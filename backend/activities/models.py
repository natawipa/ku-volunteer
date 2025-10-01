from typing import Optional

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from config.constants import ActivityStatus, DeletionRequestStatus, ValidationLimits
from config.utils import validate_activity_categories


class Activity(models.Model):
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
    location = models.CharField(max_length=ValidationLimits.MAX_LOCATION_LENGTH, blank=True)
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Activity"
        verbose_name_plural = "Activities"

    def __str__(self) -> str:
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
        """Return True when organizer needs admin approval to delete (>= 1 participant)."""
        return (self.current_participants or 0) > 0

    def request_deletion(self, user, reason: Optional[str] = None) -> 'ActivityDeletionRequest':
        """Create a deletion request for this activity."""
        if not self.requires_admin_for_delete:
            raise ValidationError("Deletion request not required: no participants; delete is allowed.")
        if not reason or not str(reason).strip():
            raise ValidationError({"reason": "Reason is required when requesting deletion."})
        return ActivityDeletionRequest.objects.create(
            activity=self,
            reason=str(reason).strip(),
            requested_by=user,
        )

    @property
    def capacity_reached(self) -> bool:
        """Return True if current_participants has reached or exceeded max_participants."""
        if self.max_participants is None:
            return False
        return (self.current_participants or 0) >= self.max_participants
    
    @property
    def is_active(self) -> bool:
        """Return True if activity is currently active."""
        return self.status == ActivityStatus.OPEN
    
    @property
    def is_past(self) -> bool:
        """Return True if activity has ended."""
        return self.end_at < timezone.now()


class ActivityDeletionRequest(models.Model):
    """Model representing a request to delete an activity."""
    
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='deletion_requests')
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
        return f"Deletion request for {self.activity_id} ({self.get_status_display()})"
    
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
