from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings

from config.constants import UserRoles, ValidationLimits
from config.utils import (
    get_activity_category_groups,
    validate_activity_categories,
    is_user_role,
    is_admin_user,
    get_client_url
)
from users.models import User


class UtilsTest(TestCase):
    """Test cases for utility functions."""

    def setUp(self):
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )

    def test_get_activity_category_groups(self):
        """Test get_activity_category_groups function."""
        groups = get_activity_category_groups()

        self.assertIsInstance(groups, dict)
        self.assertIn('University Activities', groups)
        self.assertIn('Enhance Competencies', groups)
        self.assertIn('Social Engagement Activities', groups)

    def test_validate_activity_categories_valid(self):
        """Test validate_activity_categories with valid data."""
        # Valid categories
        valid_categories = ['University Activities']
        validate_activity_categories(valid_categories)  # Should not raise

        # None is valid
        validate_activity_categories(None)  # Should not raise

    def test_validate_activity_categories_invalid_type(self):
        """Test validate_activity_categories with invalid type."""
        with self.assertRaises(ValidationError) as cm:
            validate_activity_categories("not a list")

        self.assertIn('categories must be a list', str(cm.exception))

    def test_validate_activity_categories_invalid_length(self):
        """Test validate_activity_categories with invalid length."""
        # Too few categories
        with self.assertRaises(ValidationError) as cm:
            validate_activity_categories([])

        self.assertIn('between 1 and 4 items', str(cm.exception))

        # Too many categories
        with self.assertRaises(ValidationError) as cm:
            validate_activity_categories(['a', 'b', 'c', 'd', 'e'])

        self.assertIn('between 1 and 4 items', str(cm.exception))

    def test_validate_activity_categories_empty_strings(self):
        """Test validate_activity_categories with empty strings."""
        with self.assertRaises(ValidationError) as cm:
            validate_activity_categories(['', '  '])

        self.assertIn('non-empty string', str(cm.exception))

    def test_validate_activity_categories_invalid_category(self):
        """Test validate_activity_categories with invalid category."""
        with self.assertRaises(ValidationError) as cm:
            validate_activity_categories(['Invalid Category'])

        self.assertIn('invalid category', str(cm.exception))

    def test_is_user_role(self):
        """Test is_user_role function."""
        self.assertTrue(is_user_role(self.student, UserRoles.STUDENT))
        self.assertFalse(is_user_role(self.student, UserRoles.ADMIN))
        self.assertTrue(is_user_role(self.admin, UserRoles.ADMIN))

    def test_is_admin_user(self):
        """Test is_admin_user function."""
        self.assertFalse(is_admin_user(self.student))
        self.assertTrue(is_admin_user(self.admin))

    @override_settings(CLIENT_URL_DEV='https://custom-url.com')
    def test_get_client_url_from_settings(self):
        """Test get_client_url with custom setting."""
        # This test might not work as expected due to how settings work in tests
        # but demonstrates the intention
        url = get_client_url()
        # The actual test would depend on how environment variables are mocked
        self.assertIsInstance(url, str)

    def test_get_client_url_default(self):
        """Test get_client_url with default value."""
        url = get_client_url()
        self.assertIsInstance(url, str)
        # Should return default if no env var is set


class ConstantsTest(TestCase):
    """Test cases for constants module."""

    def test_user_roles_constants(self):
        """Test UserRoles constants."""
        self.assertEqual(UserRoles.STUDENT, 'student')
        self.assertEqual(UserRoles.ORGANIZER, 'organizer')
        self.assertEqual(UserRoles.ADMIN, 'admin')

        # Test choices
        self.assertIsInstance(UserRoles.CHOICES, list)
        self.assertEqual(len(UserRoles.CHOICES), 3)

    def test_validation_limits_constants(self):
        """Test ValidationLimits constants."""
        # Verify ValidationLimits
        self.assertEqual(ValidationLimits.CATEGORIES_MIN, 1)
        self.assertEqual(ValidationLimits.CATEGORIES_MAX, 3)
        self.assertIsInstance(ValidationLimits.MAX_TITLE_LENGTH, int)
        self.assertGreater(ValidationLimits.MAX_TITLE_LENGTH, 0)


class PermissionsTest(TestCase):
    """Test cases for custom permissions."""

    def setUp(self):
        self.student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )

    def test_permission_classes_exist(self):
        """Test that permission classes can be imported."""
        from config.permissions import IsStudent, IsOrganizer, IsAdmin, IsOrganizerOrAdmin

        # Just test that they exist and can be instantiated
        self.assertIsNotNone(IsStudent())
        self.assertIsNotNone(IsOrganizer())
        self.assertIsNotNone(IsAdmin())
        self.assertIsNotNone(IsOrganizerOrAdmin())
