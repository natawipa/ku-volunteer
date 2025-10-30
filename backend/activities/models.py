from typing import Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxLengthValidator
from django.db import models
from django.utils import timezone

from config.constants import ActivityStatus, ApplicationStatus, DeletionRequestStatus, ValidationLimits
from config.utils import validate_activity_categories


def activity_cover_image_path(instance, filename):
    """Generate file path for activity cover images."""
    return f'activities/{instance.id}/cover/{filename}'


def activity_poster_image_path(instance, filename):
    """Generate file path for activity poster images."""
    return f'activities/{instance.activity.id}/posters/{filename}'


class Activity(models.Model):
    def auto_update_status(self):
        """
        Automatically update status based on current time and activity dates.
        - upcoming: before start_at, within 1 week
        - during: between start_at and end_at
        - complete: after end_at
        Only updates if status is open or upcoming/during/complete.
        """
        from config.constants import ActivityStatus
        now = timezone.now()
        if self.status in [ActivityStatus.OPEN, 'upcoming', 'during', 'complete']:
            # Upcoming: before start, within 1 week
            if self.start_at > now:
                delta = self.start_at - now
                if delta.days < 7:
                    if self.status != 'upcoming':
                        self.status = 'upcoming'
                        self.save(update_fields=['status'])
                else:
                    if self.status != ActivityStatus.OPEN:
                        self.status = ActivityStatus.OPEN
                        self.save(update_fields=['status'])
            # During: between start and end
            elif self.start_at <= now <= self.end_at:
                if self.status != 'during':
                    self.status = 'during'
                    self.save(update_fields=['status'])
            # Complete: after end
            elif now > self.end_at:
                if self.status != 'complete':
                    self.status = 'complete'
                    self.save(update_fields=['status'])

    """Model representing a volunteer activity."""

    organizer_profile = models.ForeignKey(
        'users.OrganizerProfile',
        on_delete=models.CASCADE,
        related_name='activities'
    )
    categories = models.JSONField(
        default=list,
        blank=True,
        validators=[validate_activity_categories]
    )
    title = models.CharField(max_length=ValidationLimits.MAX_TITLE_LENGTH)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    location = models.CharField(
        max_length=ValidationLimits.MAX_LOCATION_LENGTH, blank=True
    )
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    current_participants = models.PositiveIntegerField(default=0)
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
    # Reason provided by admin when an activity is rejected in moderation
    rejection_reason = models.TextField(blank=True, null=True)
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

    @property
    def requires_admin_for_delete(self) -> bool:
        """Return True when organizer needs admin approval to delete.

        Returns True when activity has >= 1 participant.
        """
        return (self.current_participants or 0) > 0

    def request_deletion(
        self, user, reason: Optional[str] = None
    ) -> 'ActivityDeletionRequest':
        """Create a deletion request for this activity."""
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

    @property
    def capacity_reached(self) -> bool:
        """Return True if current_participants has reached or exceeded max."""
        if self.max_participants is None:
            return False
        return (self.current_participants or 0) >= self.max_participants

    @property
    def is_active(self) -> bool:
        """Return True if activity is currently active."""
        self.auto_update_status()
        return self.status == ActivityStatus.OPEN

    @property
    def is_past(self) -> bool:
        """Return True if activity has ended."""
        self.auto_update_status()
        return self.end_at < timezone.now()


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
