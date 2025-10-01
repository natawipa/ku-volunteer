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
        Allowed categories come from settings.ACTIVITY_CATEGORY_GROUPS.
        """
        if value is None:
            return
        if not isinstance(value, list):
            raise ValidationError('categories must be a list of strings (1-4).')
        if not (1 <= len(value) <= 4):
            raise ValidationError('categories must have between 1 and 4 items.')
        if not all(isinstance(i, str) and i.strip() for i in value):
            raise ValidationError('each category must be a non-empty string.')
        # Build allowed list solely from ACTIVITY_CATEGORY_GROUPS
        groups = getattr(settings, 'ACTIVITY_CATEGORY_GROUPS', None)
        allowed = []
        if isinstance(groups, dict):
            for name, items in groups.items():
                if isinstance(items, (list, tuple)) and items:
                    # Non-empty group: add its items
                    allowed.extend([str(x) for x in items])
                elif isinstance(items, (list, tuple)) and not items:
                    # Empty group: header itself is a selectable top-level category
                    allowed.append(str(name))
        invalid = [c for c in value if c not in allowed]
        if invalid:
            if not allowed:
                raise ValidationError('Category configuration missing or invalid: set ACTIVITY_CATEGORY_GROUPS in settings.')
            raise ValidationError(f"invalid category(ies): {invalid}. Allowed: {allowed}")

    organizer_profile = models.ForeignKey(
        'users.OrganizerProfile',
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

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"



    # ----- Business rules helpers -----
    @property
    def requires_admin_for_delete(self) -> bool:
        """Return True when organizer needs admin approval to delete (>= 1 participant)."""
        return (self.current_participants or 0) > 0

    def request_deletion(self, user, reason: str | None = None):
        if not self.requires_admin_for_delete:
            raise ValidationError("Deletion request not required: no participants; delete is allowed.")
        if not reason or not str(reason).strip():
            raise ValidationError({"reason": "Reason is required when requesting deletion."})
        return ActivityDeletionRequest.objects.create(
            activity=self,
            reason=str(reason).strip(),
            requested_by=user,
        )


class ActivityDeletionRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='deletion_requests')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
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

    def __str__(self) -> str:
        return f"Deletion request for {self.activity_id} ({self.get_status_display()})"
