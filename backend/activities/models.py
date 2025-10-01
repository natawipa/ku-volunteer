from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.utils import timezone


class Activity(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'  # admin only
        OPEN = 'open', 'Open'
        FULL = 'full', 'Full'
        CLOSED = 'closed', 'Closed'
        CANCELLED = 'cancelled', 'Cancelled'

    def _validate_categories(value):
        """Validate categories: non-empty list up to 4 items and each within allowed set.

        Allowed categories can be configured via settings.ACTIVITY_ALLOWED_CATEGORIES.
        """
        if value is None:
            return
        if not isinstance(value, list):
            raise ValidationError('categories must be a list of strings (1-4).')
        if not (1 <= len(value) <= 4):
            raise ValidationError('categories must have between 1 and 4 items.')
        if not all(isinstance(i, str) and i.strip() for i in value):
            raise ValidationError('each category must be a non-empty string.')
        allowed = getattr(
            settings,
            'ACTIVITY_ALLOWED_CATEGORIES',
            [
                'กิจกรรมมหาวิทยาลัย',
                'เสริมสร้างสมรรถนะ',
                'เพื่อสังคม',
                'อื่นๆ',
            ],
        )
        invalid = [c for c in value if c not in allowed]
        if invalid:
            raise ValidationError(f"invalid category(ies): {invalid}. Allowed: {allowed}")

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    categories = models.JSONField(default=list, blank=True, validators=[_validate_categories])
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    max_participants = models.PositiveIntegerField(null=True, blank=True)
    current_participants = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    hours_awarded = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Organizer deletion request workflow: if current_participants > 0, organizer must request admin approval
    deletion_requested = models.BooleanField(default=False)
    deletion_reason = models.TextField(blank=True, null=True)
    deletion_requested_at = models.DateTimeField(blank=True, null=True)
    deletion_requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_deletion_requests',
    )

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    # ----- Business rules helpers -----
    @property
    def requires_admin_for_delete(self) -> bool:
        """Return True when organizer needs admin approval to delete (>= 1 participant)."""
        return (self.current_participants or 0) > 0

    def can_be_deleted_by(self, user) -> bool:
        """Admins can always delete. Organizer may delete only when no participants signed up.

        Note: This does not perform deletion; use in views/services to gate delete actions.
        """
        if user is None:
            return False
        # Admins can delete anytime
        if getattr(user, 'role', None) == 'admin' or getattr(user, 'is_superuser', False):
            return True
        # Organizer can delete only own activity and when zero participants
        if getattr(user, 'role', None) == 'organizer' and user == self.organizer:
            return self.current_participants == 0
        return False

    def request_deletion(self, user, reason: str | None = None):
        """Mark this activity as having a deletion request by an organizer with a reason.

        Intended for the case: current_participants >= 1 so organizer cannot hard-delete without admin.
        """
        # Preconditions
        if not self.requires_admin_for_delete:
            # No need to request deletion; organizer can delete directly when participants are zero
            raise ValidationError("Deletion request not required: no participants; delete is allowed.")
        if self.deletion_requested:
            raise ValidationError("Deletion has already been requested for this activity.")
        if not reason or not str(reason).strip():
            raise ValidationError({"deletion_reason": "Reason is required when requesting deletion."})

        self.deletion_requested = True
        self.deletion_reason = str(reason).strip()
        self.deletion_requested_at = timezone.now()
        self.deletion_requested_by = user if user and getattr(user, 'role', None) == 'organizer' else None
        self.save(update_fields=[
            'deletion_requested', 'deletion_reason', 'deletion_requested_at', 'deletion_requested_by'
        ])
