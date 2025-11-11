from typing import Optional
import random
import string

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxLengthValidator
from django.db import models
from django.utils import timezone

from config.constants import ActivityStatus, ApplicationStatus, DeletionRequestStatus, ValidationLimits
from config.utils import validate_activity_categories, validate_activity_is_happening


def activity_cover_image_path(instance, filename):
    """Generate file path for activity cover images."""
    return f'activities/{instance.id}/cover/{filename}'


def activity_poster_image_path(instance, filename):
    """Generate file path for activity poster images."""
    return f'activities/{instance.activity.id}/posters/{filename}'


class Activity(models.Model):
    """Model representing a volunteer activity.
    
    Handles activity lifecycle, capacity management, and status updates.
    """
    
    # Organizer
    organizer_profile = models.ForeignKey(
        'users.OrganizerProfile',
        on_delete=models.CASCADE,
        related_name='activities'
    )
    
    # Basic Information
    title = models.CharField(max_length=ValidationLimits.MAX_TITLE_LENGTH)
    description = models.TextField(blank=True)
    categories = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_activity_categories]
    )
    location = models.CharField(
        max_length=ValidationLimits.MAX_LOCATION_LENGTH, 
        blank=True
    )
    
    # Timing
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    
    # Capacity
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    current_participants = models.PositiveIntegerField(default=0)
    
    # Status & Hours
    status = models.CharField(
        max_length=20,
        choices=ActivityStatus.CHOICES,
        default=ActivityStatus.PENDING
    )
    hours_awarded = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    
    # Images
    cover_image = models.ImageField(
        upload_to=activity_cover_image_path,
        blank=True,
        null=True,
        help_text="Cover image for the activity"
    )
    
    # Admin moderation
    rejection_reason = models.TextField(
        blank=True, 
        null=True,
        help_text="Reason provided by admin when activity is rejected"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Activity"
        verbose_name_plural = "Activities"

    def __str__(self) -> str:
        self.auto_update_status()
        return f"{self.title} ({self.get_status_display()})"
    
    def clean(self) -> None:
        """Validate the activity model."""
        super().clean()

        if self.start_at and self.end_at and self.start_at >= self.end_at:
            raise ValidationError("Start time must be before end time.")

        if self.max_participants is not None and self.max_participants <= 0:
            raise ValidationError("Maximum participants must be positive.")

        if self.current_participants < 0:
            raise ValidationError("Current participants cannot be negative.")
    
    @classmethod
    def update_all_statuses(cls):
        """Bulk update statuses for all activities based on current time.
        
        This is more efficient than calling auto_update_status() on each 
        activity individually. Should be called periodically or before 
        displaying activity lists.
        """
        now = timezone.now()
        one_week_from_now = now + timezone.timedelta(days=7)
        
        # Update to COMPLETE if ended
        cls.objects.filter(
            status__in=[ActivityStatus.OPEN, ActivityStatus.UPCOMING, ActivityStatus.DURING],
            end_at__lt=now
        ).update(status=ActivityStatus.COMPLETE)
        
        # Update to DURING if currently running
        cls.objects.filter(
            status__in=[ActivityStatus.OPEN, ActivityStatus.UPCOMING],
            start_at__lte=now,
            end_at__gt=now
        ).update(status=ActivityStatus.DURING)
        
        # Update to UPCOMING if starts within a week
        cls.objects.filter(
            status=ActivityStatus.OPEN,
            start_at__gt=now,
            start_at__lt=one_week_from_now
        ).update(status=ActivityStatus.UPCOMING)
        
        # Update back to OPEN if starts more than a week away
        cls.objects.filter(
            status=ActivityStatus.UPCOMING,
            start_at__gte=one_week_from_now
        ).update(status=ActivityStatus.OPEN)
        
        # Update to FULL if capacity reached (requires individual checks)
        for activity in cls.objects.filter(
            status__in=[ActivityStatus.OPEN, ActivityStatus.UPCOMING, ActivityStatus.DURING],
            max_participants__isnull=False
        ):
            if activity.capacity_reached and activity.status != ActivityStatus.FULL:
                activity.status = ActivityStatus.FULL
                activity.save(update_fields=['status'])

    def auto_update_status(self):
        """Update status based on current time and activity dates.
        
        Status transitions:
        - OPEN → UPCOMING: within 1 week of start
        - UPCOMING → DURING: activity has started
        - DURING → COMPLETE: activity has ended
        - Any → FULL: capacity reached
        """
        now = timezone.now()
        
        if self.status not in [ActivityStatus.OPEN, ActivityStatus.UPCOMING, ActivityStatus.DURING]:
            return
        
        # Check if ended
        if now > self.end_at:
            if self.status != ActivityStatus.COMPLETE:
                self.status = ActivityStatus.COMPLETE
                self.save(update_fields=['status'])
            return
        
        # Check if full
        if self.capacity_reached:
            if self.status != ActivityStatus.FULL:
                self.status = ActivityStatus.FULL
                self.save(update_fields=['status'])
            return
        
        # Check if currently running
        if self.start_at <= now <= self.end_at:
            if self.status != ActivityStatus.DURING:
                self.status = ActivityStatus.DURING
                self.save(update_fields=['status'])
            return
        
        # Check if upcoming (within 1 week)
        if self.start_at > now:
            delta = self.start_at - now
            if delta.days < 7:
                if self.status != ActivityStatus.UPCOMING:
                    self.status = ActivityStatus.UPCOMING
                    self.save(update_fields=['status'])
            else:
                if self.status != ActivityStatus.OPEN:
                    self.status = ActivityStatus.OPEN
                    self.save(update_fields=['status'])
    
    @property
    def capacity_reached(self) -> bool:
        """Return True if current_participants has reached or exceeded max."""
        if self.max_participants is None:
            return False
        return (self.current_participants or 0) >= self.max_participants

    @property
    def is_active(self) -> bool:
        """Return True if activity is currently open for applications."""
        self.auto_update_status()
        return self.status == ActivityStatus.OPEN

    @property
    def is_past(self) -> bool:
        """Return True if activity has ended."""
        return self.end_at < timezone.now()
    
    @property
    def is_ongoing(self) -> bool:
        """Return True if activity is currently happening."""
        now = timezone.now()
        return self.start_at <= now <= self.end_at
    
    @property
    def requires_admin_for_delete(self) -> bool:
        """Return True when organizer needs admin approval to delete.
        
        Returns True when activity has >= 1 participant.
        """
        return (self.current_participants or 0) > 0
    
    def request_deletion(
        self, user, reason: Optional[str] = None
    ) -> 'ActivityDeletionRequest':
        """Create a deletion request for this activity.
        
        Args:
            user: The user requesting deletion
            reason: Reason for deletion request
            
        Returns:
            ActivityDeletionRequest instance
            
        Raises:
            ValidationError: If deletion request is not required or reason is missing
        """
        if not self.requires_admin_for_delete:
            raise ValidationError(
                "Deletion request not required: no participants; delete is allowed."
            )
        if not reason or not str(reason).strip():
            raise ValidationError(
                {"reason": "Reason is required when requesting deletion."}
            )
        return ActivityDeletionRequest.objects.create(
            activity=self,
            reason=str(reason).strip(),
            requested_by=user,
        )
    
    def get_today_checkin_code(self) -> Optional[str]:
        """Get today's check-in code for this activity.
        
        Returns:
            The 6-character code if it exists, None otherwise
        """
        try:
            code_obj = self.daily_codes.filter(
                valid_date=timezone.now().date()
            ).first()
            return code_obj.code if code_obj else None
        except Exception:
            return None
    
    def get_attendance_summary(self) -> dict:
        """Get attendance summary for this activity.
        
        Returns:
            Dictionary with present_count, absent_count, and total_approved
        """
        from .models import Application, StudentCheckIn
        
        total_approved = Application.objects.filter(
            activity=self,
            status=ApplicationStatus.APPROVED
        ).count()
        
        present_count = StudentCheckIn.objects.filter(
            activity=self,
            attendance_status='present'
        ).count()
        
        absent_count = StudentCheckIn.objects.filter(
            activity=self,
            attendance_status='absent'
        ).count()
        
        return {
            'total_approved': total_approved,
            'present_count': present_count,
            'absent_count': absent_count,
            'not_checked_in': total_approved - (present_count + absent_count)
        }


class ActivityPosterImage(models.Model):
    """Model for activity poster images (1-4 per activity)."""
    
    activity = models.ForeignKey(
        Activity, 
        on_delete=models.CASCADE, 
        related_name='poster_images'
    )
    image = models.ImageField(
        upload_to=activity_poster_image_path,
        help_text="Poster image for the activity"
    )
    order = models.PositiveIntegerField(
        default=1,
        help_text="Display order of the poster (1-4)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']
        verbose_name = "Activity Poster Image"
        verbose_name_plural = "Activity Poster Images"
        constraints = [
            models.UniqueConstraint(
                fields=['activity', 'order'],
                name='unique_activity_poster_order'
            )
        ]

    def __str__(self) -> str:
        return f"{self.activity.title} - Poster {self.order}"

    def clean(self) -> None:
        """Validate poster image constraints."""
        super().clean()
        
        # Limit to 4 posters per activity
        if self.activity_id:
            existing_count = ActivityPosterImage.objects.filter(
                activity=self.activity
            ).exclude(pk=self.pk).count()
            
            if existing_count >= 4:
                raise ValidationError("Maximum 4 poster images allowed per activity.")
        
        # Validate order is between 1-4
        if not (1 <= self.order <= 4):
            raise ValidationError("Poster order must be between 1 and 4.")


class ActivityDeletionRequest(models.Model):
    """Model representing a request to delete an activity."""

    activity = models.ForeignKey(
        Activity, on_delete=models.SET_NULL, related_name='deletion_requests',
        null=True, blank=True
    )
    activity_title = models.CharField(max_length=255, blank=True)  # Store title for notifications after deletion
    organizer_profile_id = models.IntegerField(null=True, blank=True)  # Store organizer ID for filtering after deletion
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=DeletionRequestStatus.CHOICES,
        default=DeletionRequestStatus.PENDING
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requested_activity_deletions',
    )
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_activity_deletions',
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    review_note = models.TextField(blank=True)

    class Meta:
        ordering = ['-requested_at']
        verbose_name = "Activity Deletion Request"
        verbose_name_plural = "Activity Deletion Requests"

    def __str__(self) -> str:
        title = self.activity_title or (self.activity.title if self.activity else "Unknown")
        return f"Deletion request for {title} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        """Store activity title and organizer profile ID if not already set."""
        if self.activity:
            if not self.activity_title:
                self.activity_title = self.activity.title
            if not self.organizer_profile_id:
                self.organizer_profile_id = self.activity.organizer_profile_id
        super().save(*args, **kwargs)

    def approve(self, reviewer, note: Optional[str] = None) -> None:
        """Approve the deletion request."""
        self.status = DeletionRequestStatus.APPROVED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_note = note or ""
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])

    def reject(self, reviewer, note: Optional[str] = None) -> None:
        """Reject the deletion request."""
        self.status = DeletionRequestStatus.REJECTED
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.review_note = note or ""
        self.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'review_note'])


class Application(models.Model):
    """Model representing a student application to a volunteer activity."""

    activity = models.ForeignKey(
        Activity,
        on_delete=models.SET_NULL,
        related_name='applications',
        null=True,
        blank=True
    )
    activity_title = models.CharField(max_length=255, blank=True)  # Store title for notifications after deletion
    activity_id_stored = models.IntegerField(null=True, blank=True)  # Store activity ID for reference after deletion
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications',
        limit_choices_to={'role': 'student'}
    )
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.CHOICES,
        default=ApplicationStatus.PENDING
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    decision_at = models.DateTimeField(null=True, blank=True)
    decision_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_decisions'
    )
    notes = models.CharField(
        max_length=225,
        blank=True,
        help_text="Reason for rejection or other notes (max 225 characters)"
    )

    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Application"
        verbose_name_plural = "Applications"
        constraints = [
            models.UniqueConstraint(
                fields=['activity', 'student'],
                name='unique_activity_student_application'
            )
        ]

    def __str__(self) -> str:
        title = self.activity_title or (self.activity.title if self.activity else "Deleted Activity")
        return f"{self.student.email} -> {title} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        """Store activity title and ID before saving."""
        if self.activity and not self.activity_title:
            self.activity_title = self.activity.title
        if self.activity and not self.activity_id_stored:
            self.activity_id_stored = self.activity.id
        super().save(*args, **kwargs)

    def clean(self) -> None:
        """Validate the application model."""
        super().clean()

        # Ensure student is actually a student role
        if hasattr(self, 'student') and self.student:
            from config.constants import UserRoles
            if getattr(self.student, 'role', None) != UserRoles.STUDENT:
                raise ValidationError("Applications can only be made by students.")

        # Validate rejection notes length
        if self.notes and len(self.notes) > 225:
            raise ValidationError("Notes cannot exceed 225 characters.")

    def approve(self, reviewer) -> None:
        """Approve the application and increment activity capacity."""
        if self.status != ApplicationStatus.PENDING:
            raise ValidationError("Only pending applications can be approved.")
        
        # Check if activity has reached capacity
        activity = self.activity
        if activity.max_participants is not None and activity.current_participants >= activity.max_participants:
            raise ValidationError("Activity has reached maximum capacity.")
        
        # Increment the activity's current participants count
        activity.current_participants += 1
        activity.save(update_fields=['current_participants'])
        
        self.status = ApplicationStatus.APPROVED
        self.decision_at = timezone.now()
        self.decision_by = reviewer
        self.notes = ""  # Clear any previous notes
        self.save(update_fields=['status', 'decision_at', 'decision_by', 'notes'])

    def reject(self, reviewer, reason: str) -> None:
        """Reject the application with a reason."""
        if self.status != ApplicationStatus.PENDING:
            raise ValidationError("Only pending applications can be rejected.")
        
        if not reason or not reason.strip():
            raise ValidationError("Rejection reason is required.")
        
        if len(reason) > 225:
            raise ValidationError("Rejection reason cannot exceed 225 characters.")
        
        self.status = ApplicationStatus.REJECTED
        self.decision_at = timezone.now()
        self.decision_by = reviewer
        self.notes = reason.strip()
        self.save(update_fields=['status', 'decision_at', 'decision_by', 'notes'])

    def cancel(self) -> None:
        """Cancel the application (student action)."""
        if self.status not in (ApplicationStatus.PENDING, ApplicationStatus.APPROVED):
            raise ValidationError("Only pending or approved applications can be cancelled.")
        
        self.status = ApplicationStatus.CANCELLED
        self.save(update_fields=['status'])


class DailyCheckInCode(models.Model):
    """Daily check-in code for activity attendance tracking.
    
    Each activity generates one unique code per day. The code is valid only
    for that specific day (00:00-23:59 UTC).
    
    Attributes:
        activity: The activity this code belongs to
        code: 6-character alphanumeric code (e.g., "AN6813")
        valid_date: Date this code is valid for
        created_at: When this code was generated
    """
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='daily_codes'
    )
    code = models.CharField(
        max_length=6,
        help_text="6-character alphanumeric check-in code"
    )
    valid_date = models.DateField(
        help_text="Date this code is valid for (UTC timezone)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-valid_date']
        verbose_name = "Daily Check-in Code"
        verbose_name_plural = "Daily Check-in Codes"
        constraints = [
            models.UniqueConstraint(
                fields=['activity', 'valid_date'],
                name='unique_activity_daily_code'
            )
        ]
    
    def __str__(self) -> str:
        return f"{self.activity.title} - {self.valid_date} - {self.code}"
    
    @staticmethod
    def generate_code() -> str:
        """Generate a random 6-character code.
        
        Format: 2 uppercase letters followed by 4 digits (XX0000)
        Example: "AB1234", "XY5678"
        
        Returns:
            6-character string in format XX0000
        """
        letters = ''.join(random.choices(string.ascii_uppercase, k=2))
        numbers = ''.join(random.choices(string.digits, k=4))
        return letters + numbers
    
    @classmethod
    def get_or_create_today_code(cls, activity: Activity) -> 'DailyCheckInCode':
        """Get or create today's check-in code for an activity.
        
        If a code already exists for today, returns it. Otherwise, generates
        a new code.
        
        Args:
            activity: Activity to get/create code for
            
        Returns:
            DailyCheckInCode instance for today
        """
        today = timezone.now().date()
        
        code_obj, created = cls.objects.get_or_create(
            activity=activity,
            valid_date=today,
            defaults={'code': cls.generate_code()}
        )
        
        return code_obj
    
    def is_valid_today(self) -> bool:
        """Check if this code is valid for today.
        
        Returns:
            True if valid_date matches today's date (UTC)
        """
        return self.valid_date == timezone.now().date()


class StudentCheckIn(models.Model):
    """Student attendance record for activities.
    
    Tracks whether a student checked in or was marked absent for an activity.
    Students only need to check in once during the entire activity period.
    
    Attributes:
        activity: The activity being tracked
        student: The student whose attendance is recorded
        attendance_status: Either 'present' or 'absent'
        checked_in_at: When the student checked in (null if absent)
        marked_absent_at: When the student was auto-marked absent (null if present)
    """
    
    ATTENDANCE_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
    ]
    
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='check_ins'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activity_check_ins',
        limit_choices_to={'role': 'student'}
    )
    attendance_status = models.CharField(
        max_length=20,
        choices=ATTENDANCE_CHOICES,
        default='absent'
    )
    checked_in_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when student checked in"
    )
    marked_absent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when student was automatically marked absent"
    )
    
    class Meta:
        ordering = ['-checked_in_at']
        verbose_name = "Student Check-in"
        verbose_name_plural = "Student Check-ins"
        constraints = [
            models.UniqueConstraint(
                fields=['activity', 'student'],
                name='unique_activity_student_checkin'
            )
        ]
    
    def __str__(self) -> str:
        return f"{self.student.email} - {self.activity.title} - {self.attendance_status}"
    
    @classmethod
    def check_in_student(cls, activity: Activity, student, code: str) -> 'StudentCheckIn':
        """Check in a student using the daily code.
        
        Performs comprehensive validation before marking student as present:
        1. Verifies student has an approved application
        2. Checks code is correct and valid for today
        3. Ensures student hasn't already checked in
        4. Validates activity timing (must be currently happening)
        
        Args:
            activity: The activity to check in to
            student: The student checking in
            code: The 6-character check-in code
            
        Returns:
            StudentCheckIn instance with attendance_status='present'
            
        Raises:
            ValidationError: If any validation fails
        """
        # Step 1: Verify approved application
        if not cls._has_approved_application(activity, student):
            raise ValidationError(
                "You must have an approved application to check in to this activity."
            )
        
        # Step 2: Check for duplicate check-in
        if cls._already_checked_in(activity, student):
            raise ValidationError(
                "You have already checked in to this activity."
            )
        
        # Step 3: Validate the code
        cls._validate_code(activity, code)
        
        # Step 4: Validate activity timing
        cls._validate_activity_timing(activity)
        
        # All validations passed - create or update check-in record
        check_in, created = cls.objects.update_or_create(
            activity=activity,
            student=student,
            defaults={
                'attendance_status': 'present',
                'checked_in_at': timezone.now()
            }
        )
        
        return check_in
    
    @staticmethod
    def _has_approved_application(activity: Activity, student) -> bool:
        """Check if student has an approved application for the activity."""
        return Application.objects.filter(
            activity=activity,
            student=student,
            status=ApplicationStatus.APPROVED
        ).exists()
    
    @classmethod
    def _already_checked_in(cls, activity: Activity, student) -> bool:
        """Check if student has already checked in."""
        return cls.objects.filter(
            activity=activity,
            student=student,
            attendance_status='present'
        ).exists()
    
    @staticmethod
    def _validate_code(activity: Activity, code: str) -> None:
        """Validate the check-in code.
        
        Raises:
            ValidationError: If code is invalid or not valid today
        """
        today_code = DailyCheckInCode.get_or_create_today_code(activity)
        
        if not today_code.is_valid_today():
            raise ValidationError("The check-in code is not valid today.")
        
        if code.strip().upper() != today_code.code.upper():
            raise ValidationError("Invalid check-in code.")
    
    @staticmethod
    def _validate_activity_timing(activity: Activity) -> None:
        """Validate that activity is currently happening.
        
        Raises:
            ValidationError: If activity hasn't started or has ended
        """
        validate_activity_is_happening(activity)
    
    @classmethod
    def mark_absent_students(cls, activity: Activity) -> int:
        """Mark all non-checked-in students as absent.
        
        This should be called after an activity ends. It finds all students
        with approved applications who don't have check-in records and creates
        absent records for them.
        
        Args:
            activity: The completed activity
            
        Returns:
            Number of students marked absent
        """
        # Get all approved applications for this activity
        approved_students = Application.objects.filter(
            activity=activity,
            status=ApplicationStatus.APPROVED
        ).values_list('student_id', flat=True)
        
        # Get students who already have check-in records
        existing_checkins = cls.objects.filter(
            activity=activity
        ).values_list('student_id', flat=True)
        
        # Find students who don't have check-in records
        students_without_checkin = set(approved_students) - set(existing_checkins)
        
        # Create absent records for them
        absent_records = [
            cls(
                activity=activity,
                student_id=student_id,
                attendance_status='absent',
                marked_absent_at=timezone.now()
            )
            for student_id in students_without_checkin
        ]
        
        if absent_records:
            cls.objects.bulk_create(absent_records)
        
        return len(absent_records)
