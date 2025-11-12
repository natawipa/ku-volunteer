"""
Comprehensive test cases for user models.
"""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from users.models import User, StudentProfile, OrganizerProfile
from config.constants import UserRoles, OrganizationType


class UserModelTest(TestCase):
    """Test cases for the User model."""

    def setUp(self):
        """Set up test data."""
        self.student_email = "student@test.com"
        self.organizer_email = "organizer@test.com"
        self.admin_email = "admin@test.com"
        self.password = "testpass123"

    def test_create_user_with_email(self):
        """Test creating a user with email."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        self.assertEqual(user.email, self.student_email)
        self.assertTrue(user.check_password(self.password))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_default_role_is_student(self):
        """Test that default user role is student."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertTrue(user.is_student)
        self.assertFalse(user.is_organizer)
        self.assertFalse(user.is_admin_user)

    def test_create_user_without_email_raises_error(self):
        """Test that creating a user without email raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password=self.password)

    def test_create_user_with_organizer_role(self):
        """Test creating a user with organizer role."""
        user = User.objects.create_user(
            email=self.organizer_email,
            password=self.password,
            role=UserRoles.ORGANIZER
        )
        self.assertEqual(user.role, UserRoles.ORGANIZER)
        self.assertTrue(user.is_organizer)
        self.assertFalse(user.is_student)
        self.assertFalse(user.is_admin_user)

    def test_create_superuser(self):
        """Test creating a superuser."""
        admin = User.objects.create_superuser(
            email=self.admin_email,
            password=self.password
        )
        self.assertEqual(admin.email, self.admin_email)
        self.assertEqual(admin.role, UserRoles.ADMIN)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_admin_user)

    def test_user_email_must_be_unique(self):
        """Test that user email must be unique."""
        User.objects.create_user(email=self.student_email, password=self.password)
        with self.assertRaises(IntegrityError):
            User.objects.create_user(email=self.student_email, password=self.password)

    def test_user_str_representation(self):
        """Test user string representation."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        self.assertEqual(str(user), self.student_email)

    def test_user_full_name_with_names(self):
        """Test user full_name property when first and last names are set."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password,
            first_name="John",
            last_name="Doe"
        )
        self.assertEqual(user.full_name, "John Doe")

    def test_user_full_name_without_names(self):
        """Test user full_name property defaults to email."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        self.assertEqual(user.full_name, self.student_email)

    def test_user_with_title(self):
        """Test creating user with title."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password,
            title="Mr.",
            first_name="John",
            last_name="Doe"
        )
        self.assertEqual(user.title, "Mr.")
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")

    def test_email_normalization(self):
        """Test that email is normalized."""
        email = "Test@Example.COM"
        user = User.objects.create_user(email=email, password=self.password)
        self.assertEqual(user.email, "Test@example.com")

    def test_user_timestamps(self):
        """Test that timestamps are set correctly."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)

    def test_non_admin_users_dont_get_staff_privileges(self):
        """Test that non-admin users don't get staff privileges."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password,
            role=UserRoles.STUDENT
        )
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_user_title_max_length_validation(self):
        """Test that user title exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        user = User(
            email=self.student_email,
            title="x" * (ValidationLimits.MAX_USER_TITLE_LENGTH + 1),
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_first_name_max_length_validation(self):
        """Test that first name exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        user = User(
            email=self.student_email,
            first_name="x" * (ValidationLimits.MAX_USER_NAME_LENGTH + 1),
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_last_name_max_length_validation(self):
        """Test that last name exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        user = User(
            email=self.student_email,
            last_name="x" * (ValidationLimits.MAX_USER_NAME_LENGTH + 1),
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_role_valid_choices(self):
        """Test that valid role choices are accepted."""
        # Test all valid role choices
        valid_roles = [UserRoles.STUDENT, UserRoles.ORGANIZER, UserRoles.ADMIN]
        
        for role in valid_roles:
            user = User.objects.create_user(
                email=f"test_{role}@test.com",
                password=self.password,
                role=role
            )
            self.assertEqual(user.role, role)

    def test_user_role_invalid_choice_raises_error(self):
        """Test that invalid role choice raises ValidationError."""
        user = User(
            email=self.student_email,
            role="invalid_role"
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_email_format_validation(self):
        """Test that invalid email format raises ValidationError."""
        user = User(
            email="invalid-email-format",
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_valid_email_format_passes(self):
        """Test that valid email format passes validation."""
        user = User(
            email="valid.email+tag@example.com",
            password=self.password
        )
        user.set_password(self.password)
        
        # Should not raise any exception
        user.full_clean()
        user.save()
        self.assertEqual(user.email, "valid.email+tag@example.com")

    def test_user_email_without_at_symbol_fails(self):
        """Test that email without @ symbol raises ValidationError."""
        user = User(
            email="invalidemail.com",
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_email_without_domain_fails(self):
        """Test that email without domain raises ValidationError."""
        user = User(
            email="invalid@",
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_email_without_dot_in_domain_fails(self):
        """Test that email without dot in domain raises ValidationError."""
        user = User(
            email="invalid@domain",
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_email_with_spaces_fails(self):
        """Test that email with spaces raises ValidationError."""
        user = User(
            email="invalid email@example.com",
            password=self.password
        )
        user.set_password(self.password)
        
        with self.assertRaises(ValidationError):
            user.full_clean()

    def test_user_valid_email_formats(self):
        """Test that various valid email formats pass validation."""
        valid_emails = [
            "admin@ku.th",
            "user@example.com",
            "test.user@example.co.uk",
            "user+tag@example.com",
            "user_name@example.com",
            "123@example.com"
        ]
        
        for email in valid_emails:
            user = User(
                email=email,
                password=self.password
            )
            user.set_password(self.password)
            
            # Should not raise any exception
            user.full_clean()
            user.save()
            self.assertEqual(user.email, email)
            # Clean up for next iteration
            user.delete()

    def test_user_password_is_hashed(self):
        """Test that password is properly hashed."""
        user = User.objects.create_user(
            email=self.student_email,
            password=self.password
        )
        
        # Password should not be stored in plain text
        self.assertNotEqual(user.password, self.password)
        # Should be able to verify password
        self.assertTrue(user.check_password(self.password))

    def test_user_password_can_be_empty(self):
        """Test that empty password creates a usable but empty password."""
        user = User.objects.create_user(
            email=self.student_email,
            password=""
        )
        
        # Empty password can be checked
        self.assertTrue(user.check_password(""))
        self.assertTrue(user.has_usable_password())

    def test_user_password_none_creates_unusable_password(self):
        """Test that None password creates an unusable password."""
        user = User.objects.create_user(
            email=self.student_email,
            password=None
        )
        
        # None password should result in unusable password
        self.assertFalse(user.has_usable_password())


class StudentProfileModelTest(TestCase):
    """Test cases for the StudentProfile model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email="student@test.com",
            password="testpass123",
            role=UserRoles.STUDENT
        )

    def test_create_student_profile(self):
        """Test creating a student profile."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545",
            year=3,
            faculty="Engineering",
            major="Computer Science"
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.student_id_external, "6610545545")
        self.assertEqual(profile.year, 3)
        self.assertEqual(profile.faculty, "Engineering")
        self.assertEqual(profile.major, "Computer Science")

    def test_student_profile_str_representation(self):
        """Test student profile string representation."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545"
        )
        expected = f"{self.user.email} - 6610545545"
        self.assertEqual(str(profile), expected)

    def test_student_id_external_must_be_unique(self):
        """Test that student_id_external must be unique."""
        StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545"
        )
        
        another_user = User.objects.create_user(
            email="another@test.com",
            password="testpass123",
            role=UserRoles.STUDENT
        )
        
        with self.assertRaises(IntegrityError):
            StudentProfile.objects.create(
                user=another_user,
                student_id_external="6610545545"
            )

    def test_student_profile_optional_fields(self):
        """Test that year, faculty, and major are optional."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545"
        )
        self.assertIsNone(profile.year)
        self.assertIsNone(profile.faculty)
        self.assertIsNone(profile.major)

    def test_one_to_one_relationship_student_profile_with_user(self):
        """Test one-to-one relationship between User and StudentProfile."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545"
        )
        self.assertEqual(self.user.profile, profile)
        self.assertEqual(profile.user, self.user)

    def test_student_profile_deleted_when_user_deleted(self):
        """Test that student profile is deleted when user is deleted."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545"
        )
        profile_id = profile.id
        self.user.delete()
        
        with self.assertRaises(StudentProfile.DoesNotExist):
            StudentProfile.objects.get(id=profile_id)

    def test_student_id_with_less_than_10_digits_raises_error(self):
        """Test that student ID with less than 10 digits raises ValidationError."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="123456789"  # 9 digits
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_with_more_than_10_digits_raises_error(self):
        """Test that student ID with more than 10 digits raises ValidationError."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="12345678901"  # 11 digits
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_with_letters_raises_error(self):
        """Test that student ID with letters raises ValidationError."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="B6610545545"  # Contains letter 'B'
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_with_special_characters_raises_error(self):
        """Test that student ID with special characters raises ValidationError."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="6610-54554"  # Contains dash
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_with_spaces_raises_error(self):
        """Test that student ID with spaces raises ValidationError."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="66105 45545"  # Contains space
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_valid_10_digits_passes(self):
        """Test that valid 10-digit student ID passes validation."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="6610545545"
        )
        # Should not raise any exception
        profile.full_clean()
        profile.save()
        self.assertEqual(profile.student_id_external, "6610545545")

    def test_student_id_empty_string_is_allowed(self):
        """Test that empty string for student ID is allowed (blank=True)."""
        profile = StudentProfile(
            user=self.user,
            student_id_external=""
        )
        # Should not raise ValidationError since field is optional
        profile.full_clean()
        profile.save()
        self.assertEqual(profile.student_id_external, "")

    def test_student_id_none_is_allowed(self):
        """Test that None for student ID is allowed (null=True)."""
        profile = StudentProfile(
            user=self.user,
            student_id_external=None
        )
        # Should not raise ValidationError since field is optional
        profile.full_clean()
        profile.save()
        self.assertIsNone(profile.student_id_external)

    def test_year_cannot_be_zero(self):
        """Test that year cannot be 0."""
        profile = StudentProfile(
            user=self.user,
            student_id_external='6610545545',
            year=0
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_year_cannot_be_negative(self):
        """Test that year cannot be negative."""
        profile = StudentProfile(
            user=self.user,
            student_id_external='6610545545',
            year=-1
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_year_cannot_be_greater_than_six(self):
        """Test that year cannot be greater than 6."""
        profile = StudentProfile(
            user=self.user,
            student_id_external='6610545545',
            year=7
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_year_valid_range_1_to_6(self):
        """Test that year values 1-6 are valid."""
        for year in range(1, 7):
            profile = StudentProfile(
                user=self.user,
                student_id_external='6610545545',
                year=year
            )
            # Should not raise any exception
            profile.full_clean()
            profile.save()
            self.assertEqual(profile.year, year)
            # Clean up for next iteration
            profile.delete()

    def test_year_none_is_allowed(self):
        """Test that None for year is allowed (null=True)."""
        profile = StudentProfile(
            user=self.user,
            student_id_external='6610545545',
            year=None
        )
        # Should not raise ValidationError since field is optional
        profile.full_clean()
        profile.save()
        self.assertIsNone(profile.year)

    def test_student_faculty_max_length_validation(self):
        """Test that faculty exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        profile = StudentProfile(
            user=self.user,
            student_id_external="6610545545",
            faculty="x" * (ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH + 1)
        )
        
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_major_max_length_validation(self):
        """Test that major exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        profile = StudentProfile(
            user=self.user,
            student_id_external="6610545545",
            major="x" * (ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH + 1)
        )
        
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_id_max_length_validation(self):
        """Test that student ID exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        profile = StudentProfile(
            user=self.user,
            student_id_external="x" * (ValidationLimits.MAX_STUDENT_ID_LENGTH + 1)
        )
        
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_student_year_can_be_positive_integer(self):
        """Test that year accepts positive integers."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545",
            year=4
        )
        self.assertEqual(profile.year, 4)

    def test_student_year_can_be_zero(self):
        """Test that year can be 0."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545",
            year=0
        )
        self.assertEqual(profile.year, 0)

    def test_student_year_can_be_negative(self):
        """Test that year can be negative (database allows it)."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external="6610545545",
            year=-1
        )
        self.assertEqual(profile.year, -1)

    def test_student_profile_with_all_fields_valid(self):
        """Test creating student profile with all fields within limits."""
        profile = StudentProfile(
            user=self.user,
            student_id_external="6610545545",
            year=3,
            faculty="A" * 255,  # Max length
            major="B" * 255  # Max length
        )
        # Should not raise any exception
        profile.full_clean()
        profile.save()
        self.assertEqual(len(profile.faculty), 255)
        self.assertEqual(len(profile.major), 255)


class OrganizerProfileModelTest(TestCase):
    """Test cases for the OrganizerProfile model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email="organizer@test.com",
            password="testpass123",
            role=UserRoles.ORGANIZER
        )

    def test_create_organizer_profile(self):
        """Test creating an organizer profile."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.organization_type, OrganizationType.INTERNAL)
        self.assertEqual(profile.organization_name, "Computer Engineering Department")

    def test_organizer_profile_str_representation(self):
        """Test organizer profile string representation."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        expected = f"{self.user.email} - Computer Engineering Department (Kasetsart University)"
        self.assertEqual(str(profile), expected)

    def test_organizer_profile_external_organization(self):
        """Test creating organizer profile for external organization."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.EXTERNAL,
            organization_name="Red Cross Thailand"
        )
        self.assertEqual(profile.organization_type, OrganizationType.EXTERNAL)
        self.assertEqual(profile.organization_name, "Red Cross Thailand")

    def test_organizer_profile_optional_fields(self):
        """Test that organization_type and organization_name are optional."""
        profile = OrganizerProfile.objects.create(user=self.user)
        self.assertIsNone(profile.organization_type)
        self.assertIsNone(profile.organization_name)

    def test_one_to_one_relationship_organizer_profile_with_user(self):
        """Test one-to-one relationship between User and OrganizerProfile."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        self.assertEqual(self.user.organizer_profile, profile)
        self.assertEqual(profile.user, self.user)

    def test_organizer_profile_deleted_when_user_deleted(self):
        """Test that organizer profile is deleted when user is deleted."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        profile_id = profile.id
        self.user.delete()
        
        with self.assertRaises(OrganizerProfile.DoesNotExist):
            OrganizerProfile.objects.get(id=profile_id)

    def test_multiple_organizers_can_have_same_organization(self):
        """Test that multiple organizers can belong to the same organization."""
        profile1 = OrganizerProfile.objects.create(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        
        another_user = User.objects.create_user(
            email="another_organizer@test.com",
            password="testpass123",
            role=UserRoles.ORGANIZER
        )
        
        profile2 = OrganizerProfile.objects.create(
            user=another_user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="Computer Engineering Department"
        )
        
        self.assertEqual(profile1.organization_name, profile2.organization_name)
        self.assertNotEqual(profile1.id, profile2.id)

    def test_organization_name_max_length_validation(self):
        """Test that organization name exceeding max length raises ValidationError."""
        from config.constants import ValidationLimits
        
        profile = OrganizerProfile(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="x" * (ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH + 1)
        )
        
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_organization_type_valid_choices(self):
        """Test that valid organization type choices are accepted."""
        valid_types = [OrganizationType.INTERNAL, OrganizationType.EXTERNAL]
        
        for org_type in valid_types:
            user = User.objects.create_user(
                email=f"organizer_{org_type}@test.com",
                password="testpass123",
                role=UserRoles.ORGANIZER
            )
            profile = OrganizerProfile.objects.create(
                user=user,
                organization_type=org_type,
                organization_name="Test Organization"
            )
            self.assertEqual(profile.organization_type, org_type)

    def test_organization_type_invalid_choice_raises_error(self):
        """Test that invalid organization type choice raises ValidationError."""
        profile = OrganizerProfile(
            user=self.user,
            organization_type="invalid_type",
            organization_name="Test Organization"
        )
        
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_organizer_profile_with_max_length_organization_name(self):
        """Test creating organizer profile with max length organization name."""
        from config.constants import ValidationLimits
        
        profile = OrganizerProfile(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name="x" * ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH
        )
        # Should not raise any exception
        profile.full_clean()
        profile.save()
        self.assertEqual(len(profile.organization_name), ValidationLimits.MAX_ORGANIZATION_NAME_LENGTH)

    def test_organizer_profile_with_empty_organization_name(self):
        """Test that empty organization name is allowed."""
        profile = OrganizerProfile(
            user=self.user,
            organization_type=OrganizationType.INTERNAL,
            organization_name=""
        )
        # Should not raise ValidationError since field is optional
        profile.full_clean()
        profile.save()
        self.assertEqual(profile.organization_name, "")

    def test_organizer_profile_with_none_organization_type(self):
        """Test that None organization type is allowed."""
        profile = OrganizerProfile(
            user=self.user,
            organization_type=None,
            organization_name="Test Organization"
        )
        # Should not raise ValidationError since field is optional
        profile.full_clean()
        profile.save()
        self.assertIsNone(profile.organization_type)


class UserManagerTest(TestCase):
    """Test cases for the UserManager."""

    def test_create_user_with_extra_fields(self):
        """Test creating user with extra fields."""
        user = User.objects.create_user(
            email="test@test.com",
            password="testpass123",
            first_name="John",
            last_name="Doe",
            title="Mr."
        )
        self.assertEqual(user.first_name, "John")
        self.assertEqual(user.last_name, "Doe")
        self.assertEqual(user.title, "Mr.")

    def test_create_superuser_has_admin_role(self):
        """Test that superuser is created with admin role."""
        admin = User.objects.create_superuser(
            email="admin@test.com",
            password="testpass123"
        )
        self.assertEqual(admin.role, UserRoles.ADMIN)

    def test_create_superuser_defaults_is_staff_true(self):
        """Test that superuser has is_staff=True by default."""
        admin = User.objects.create_superuser(
            email="admin@test.com",
            password="testpass123"
        )
        self.assertTrue(admin.is_staff)

    def test_create_superuser_defaults_is_superuser_true(self):
        """Test that superuser has is_superuser=True by default."""
        admin = User.objects.create_superuser(
            email="admin@test.com",
            password="testpass123"
        )
        self.assertTrue(admin.is_superuser)
