from rest_framework import serializers
from .models import Activity, ActivityDeletionRequest, Application, ActivityPosterImage, DailyCheckInCode, StudentCheckIn


class ActivityPosterImageSerializer(serializers.ModelSerializer):
    """Serializer for activity poster images."""
    
    class Meta:
        model = ActivityPosterImage
        fields = ['id', 'image', 'order', 'created_at']
        read_only_fields = ['id', 'created_at']


class ActivitySerializer(serializers.ModelSerializer):
    requires_admin_for_delete = serializers.BooleanField(read_only=True)
    capacity_reached = serializers.BooleanField(read_only=True)
    organizer_profile_id = serializers.IntegerField(source='organizer_profile.id', read_only=True)
    organizer_email = serializers.EmailField(source='organizer_profile.user.email', read_only=True)
    organizer_name = serializers.CharField(source='organizer_profile.organization_name', read_only=True)
    user_application_status = serializers.SerializerMethodField()
    poster_images = ActivityPosterImageSerializer(many=True, read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'organizer_profile_id', 'organizer_email', 'organizer_name', 'categories', 'title', 'description',
            'start_at', 'end_at', 'location', 'max_participants', 'current_participants',
            'status', 'hours_awarded', 'cover_image', 'poster_images', 'rejection_reason', 'created_at', 'updated_at', 
            'requires_admin_for_delete', 'capacity_reached', 'user_application_status',
        ]
        read_only_fields = [
            'id', 'organizer_profile_id', 'organizer_email', 'organizer_name', 'current_participants', 'status',
            'rejection_reason', 'created_at', 'updated_at', 'requires_admin_for_delete', 
            'capacity_reached', 'user_application_status', 'poster_images'
        ]

    def get_user_application_status(self, obj):
        """Get the current user's application status for this activity."""
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return None
        
        from config.utils import get_student_application_status
        from config.constants import UserRoles
        
        # Only return status for students
        if getattr(request.user, 'role', None) == UserRoles.STUDENT:
            return get_student_application_status(request.user, obj)
        
        return None


class ActivityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'id', 'categories', 'title', 'description', 'start_at', 'end_at', 'location',
            'max_participants', 'hours_awarded', 'cover_image'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        organizer_profile = getattr(user, 'organizer_profile', None)
        return Activity.objects.create(organizer_profile=organizer_profile, **validated_data)
    
    def validate(self, data):
        """Convert incoming times from Bangkok timezone to UTC for storage"""
        # Get Bangkok timezone
        import pytz
        bangkok_tz = pytz.timezone('Asia/Bangkok')
        
        # If start_at and end_at are naive (no timezone), assume they're Bangkok time
        if data.get('start_at') and data.get('start_at').tzinfo is None:
            # Localize as Bangkok time, then convert to UTC
            bangkok_time = bangkok_tz.localize(data['start_at'])
            data['start_at'] = bangkok_time.astimezone(pytz.UTC).replace(tzinfo=None)
        
        if data.get('end_at') and data.get('end_at').tzinfo is None:
            bangkok_time = bangkok_tz.localize(data['end_at'])
            data['end_at'] = bangkok_time.astimezone(pytz.UTC).replace(tzinfo=None)
        
        return data


class ActivityDeletionRequestSerializer(serializers.ModelSerializer):
    activity_title = serializers.SerializerMethodField()
    requested_by_email = serializers.EmailField(source='requested_by.email', read_only=True)

    class Meta:
        model = ActivityDeletionRequest
        fields = [
            'id', 'activity', 'activity_title', 'reason', 'status', 'requested_by', 'requested_by_email',
            'requested_at', 'reviewed_by', 'reviewed_at', 'review_note'
        ]
        read_only_fields = ['status', 'requested_at', 'reviewed_by', 'reviewed_at']
    
    def get_activity_title(self, obj):
        """Get activity title from stored field or from activity if still exists."""
        if obj.activity_title:
            return obj.activity_title
        if obj.activity:
            return obj.activity.title
        return "Deleted Activity"


class ApplicationSerializer(serializers.ModelSerializer):
    """Serializer for reading Application data."""
    
    activity_title = serializers.SerializerMethodField()
    activity_id = serializers.SerializerMethodField()
    activity_id_stored = serializers.IntegerField(read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    decision_by_email = serializers.EmailField(source='decision_by.email', read_only=True, allow_null=True)

    class Meta:
        model = Application
        fields = [
            'id', 'activity', 'activity_id', 'activity_title', 'activity_id_stored',
            'student', 'student_email', 'student_name',
            'status', 'submitted_at', 'decision_at',
            'decision_by', 'decision_by_email', 'notes'
        ]
        read_only_fields = [
            'id', 'activity_id', 'activity_title', 'activity_id_stored',
            'student_email', 'student_name',
            'status', 'submitted_at', 'decision_at', 'decision_by', 'decision_by_email', 'notes'
        ]

    def get_activity_title(self, obj):
        """Get activity title, falling back to stored title if activity is deleted."""
        if obj.activity:
            return obj.activity.title
        return obj.activity_title or "Deleted Activity"
    
    def get_activity_id(self, obj):
        """Get activity ID, falling back to stored ID if activity is deleted."""
        if obj.activity:
            return obj.activity.id
        return obj.activity_id_stored

    def get_student_name(self, obj):
        """Get student's full name or email."""
        student = obj.student
        if student.first_name and student.last_name:
            return f"{student.first_name} {student.last_name}"
        return student.email


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating an application (student submits)."""

    class Meta:
        model = Application
        fields = ['activity']

    def validate_activity(self, value):
        """Validate that the activity is open for applications."""
        from config.constants import ActivityStatus
        # Ensure the activity's status is up-to-date before validation
        try:
            value.auto_update_status()
        except Exception:
            # If auto update fails for any reason, continue with current status
            pass

        # Allow students to apply when activity is OPEN or UPCOMING
        if value.status not in (ActivityStatus.OPEN, ActivityStatus.UPCOMING):
            raise serializers.ValidationError("This activity is not open for applications.")
        
        # Check if activity is full
        if value.capacity_reached:
            raise serializers.ValidationError("This activity has reached maximum capacity.")
        
        return value

    def validate(self, data):
        """Validate that student hasn't already applied."""
        request = self.context.get('request')
        if request and request.user:
            activity = data.get('activity')
            # Check for existing application
            if Application.objects.filter(activity=activity, student=request.user).exists():
                raise serializers.ValidationError("You have already applied to this activity.")
        
        return data

    def create(self, validated_data):
        """Create application with the authenticated student."""
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return Application.objects.create(student=user, **validated_data)


class ApplicationReviewSerializer(serializers.Serializer):
    """Serializer for reviewing an application (approve/reject)."""
    
    action = serializers.ChoiceField(choices=['approve', 'reject'], required=True)
    reason = serializers.CharField(max_length=225, required=False, allow_blank=True)

    def validate(self, data):
        """Validate that rejection includes a reason."""
        if data.get('action') == 'reject':
            reason = data.get('reason', '').strip()
            if not reason:
                raise serializers.ValidationError({
                    'reason': 'Rejection reason is required when rejecting an application.'
                })
            if len(reason) > 225:
                raise serializers.ValidationError({
                    'reason': 'Rejection reason cannot exceed 225 characters.'
                })
            data['reason'] = reason
        
        return data


class DailyCheckInCodeSerializer(serializers.ModelSerializer):
    """Serializer for daily check-in codes (organizer view)."""
    
    class Meta:
        model = DailyCheckInCode
        fields = ['id', 'code', 'valid_date', 'created_at']
        read_only_fields = ['id', 'code', 'created_at']


class StudentCheckInSerializer(serializers.ModelSerializer):
    """Serializer for student check-in records."""
    
    student_email = serializers.EmailField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    
    class Meta:
        model = StudentCheckIn
        fields = [
            'id', 'activity', 'activity_title', 'student', 'student_email', 
            'student_name', 'attendance_status', 'checked_in_at', 'marked_absent_at'
        ]
        read_only_fields = [
            'id', 'activity_title', 'student_email', 'student_name',
            'attendance_status', 'checked_in_at', 'marked_absent_at'
        ]
    
    def get_student_name(self, obj):
        """Get student's full name or email."""
        student = obj.student
        if student.first_name and student.last_name:
            return f"{student.first_name} {student.last_name}"
        return student.email


class CheckInRequestSerializer(serializers.Serializer):
    """Serializer for student check-in request."""
    
    code = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="6-character check-in code"
    )
    
    def validate_code(self, value):
        """Validate code format."""
        # Remove whitespace and convert to uppercase
        code = value.strip().upper()
        
        # Validate length
        if len(code) != 6:
            raise serializers.ValidationError("Check-in code must be exactly 6 characters.")
        
        return code
