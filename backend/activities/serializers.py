from rest_framework import serializers
from .models import Activity, ActivityDeletionRequest


class ActivitySerializer(serializers.ModelSerializer):
    requires_admin_for_delete = serializers.BooleanField(read_only=True)
    capacity_reached = serializers.BooleanField(read_only=True)
    organizer_profile_id = serializers.IntegerField(source='organizer_profile.id', read_only=True)
    organizer_email = serializers.EmailField(source='organizer_profile.user.email', read_only=True)
    organizer_name = serializers.CharField(source='organizer_profile.organization_name', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'organizer_profile_id', 'organizer_email', 'organizer_name', 'categories', 'title', 'description',
            'start_at', 'end_at', 'location', 'max_participants', 'current_participants',
            'status', 'hours_awarded', 'rejection_reason', 'created_at', 'updated_at', 'requires_admin_for_delete', 'capacity_reached',
        ]
        read_only_fields = [
            'id', 'organizer_profile_id', 'organizer_email', 'organizer_name', 'current_participants', 'status',
            'rejection_reason', 'created_at', 'updated_at', 'requires_admin_for_delete', 'capacity_reached'
        ]


class ActivityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'id', 'categories', 'title', 'description', 'start_at', 'end_at', 'location',
            'max_participants', 'hours_awarded'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        organizer_profile = getattr(user, 'organizer_profile', None)
        return Activity.objects.create(organizer_profile=organizer_profile, **validated_data)


class ActivityDeletionRequestSerializer(serializers.ModelSerializer):
    activity_title = serializers.CharField(source='activity.title', read_only=True)
    requested_by_email = serializers.EmailField(source='requested_by.email', read_only=True)

    class Meta:
        model = ActivityDeletionRequest
        fields = [
            'id', 'activity', 'activity_title', 'reason', 'status', 'requested_by', 'requested_by_email',
            'requested_at', 'reviewed_by', 'reviewed_at', 'review_note'
        ]
        read_only_fields = ['status', 'requested_at', 'reviewed_by', 'reviewed_at']

