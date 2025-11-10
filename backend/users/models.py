from typing import Optional

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

from config.constants import OrganizationType, UserRoles, ValidationLimits
from config.utils import validate_student_id, validate_student_year


def user_profile_image_path(instance, filename):
    """Generate file path for user profile images."""
    return f'users/{instance.id}/profile/{filename}'


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email: str, password: Optional[str] = None, **extra_fields) -> 'User':
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)

        # Ensure role is set to student by default unless explicitly specified
        if 'role' not in extra_fields:
            extra_fields['role'] = UserRoles.STUDENT

        # Ensure non-admin users don't get admin privileges
        if extra_fields.get('role') != UserRoles.ADMIN:
            extra_fields.setdefault('is_staff', False)
            extra_fields.setdefault('is_superuser', False)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: Optional[str] = None, **extra_fields) -> 'User':
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault("role", UserRoles.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email as the unique identifier."""

    email = models.EmailField(unique=True)
    title = models.CharField(max_length=ValidationLimits.MAX_USER_TITLE_LENGTH, blank=True, null=True)
    first_name = models.CharField(max_length=ValidationLimits.MAX_USER_NAME_LENGTH, blank=True, null=True)
    last_name = models.CharField(max_length=ValidationLimits.MAX_USER_NAME_LENGTH, blank=True, null=True)
    role = models.CharField(
        max_length=20,
        choices=UserRoles.CHOICES,
        default=UserRoles.STUDENT
    )
    profile_image = models.ImageField(
        upload_to=user_profile_image_path,
        blank=True,
        null=True,
        help_text="Profile picture for the user"
    )

    # Django-required fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        """Return the user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email

    @property
    def is_student(self) -> bool:
        """Check if user is a student."""
        return self.role == UserRoles.STUDENT

    @property
    def is_organizer(self) -> bool:
        """Check if user is an organizer."""
        return self.role == UserRoles.ORGANIZER

    @property
    def is_admin_user(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRoles.ADMIN or self.is_superuser


class StudentProfile(models.Model):
    """Profile for students with additional information."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    student_id_external = models.CharField(
        max_length=ValidationLimits.MAX_STUDENT_ID_LENGTH,
        blank=True,
        null=True,
        unique=True,
        validators=[validate_student_id]
    )
    year = models.IntegerField(blank=True, null=True, validators=[validate_student_year])
    faculty = models.CharField(max_length=ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH, blank=True, null=True)
    major = models.CharField(max_length=ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH, blank=True, null=True)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.student_id_external}"


class OrganizerProfile(models.Model):
    """Profile for organizers with organization information."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="organizer_profile")
    organization_type = models.CharField(
        max_length=20,
        choices=OrganizationType.CHOICES,
        blank=True,
        null=True
    )
    organization_name = models.CharField(
        max_length=ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH,
        blank=True,
        null=True
    )

    def __str__(self) -> str:
        return f"{self.user.email} - {self.organization_name} ({self.get_organization_type_display()})"
