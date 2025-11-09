"""
Test cases for OAuth pipeline functions.
These tests verify the business logic in pipeline functions.
OAuth integration is tested by the social-auth library itself.
"""
from django.test import TestCase
from users.models import User
from users.pipeline import ensure_user_role, get_client_url
from config.constants import UserRoles


class EnsureUserRoleTest(TestCase):
    """Test cases for ensure_user_role pipeline function."""

    def test_new_user_with_admin_role_changed_to_student(self):
        """Test that new OAuth user with admin role is changed to student."""
        user = User.objects.create_user(
            email='newuser@test.com',
            password='testpass123',
            role=UserRoles.ADMIN
        )
        # Mark as newly created
        user._created = True
        
        result = ensure_user_role(
            strategy=None,
            details={'email': 'newuser@test.com'},
            backend=None,
            user=user
        )
        
        user.refresh_from_db()
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(result['user'], user)

    def test_new_user_with_student_role_unchanged(self):
        """Test that new OAuth user with student role keeps student role."""
        user = User.objects.create_user(
            email='newuser2@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        user._created = True
        
        result = ensure_user_role(
            strategy=None,
            details={'email': 'newuser2@test.com'},
            backend=None,
            user=user
        )
        
        user.refresh_from_db()
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_existing_user_role_unchanged(self):
        """Test that existing user's role is not changed."""
        user = User.objects.create_user(
            email='existing@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        # Do not mark as newly created
        
        result = ensure_user_role(
            strategy=None,
            details={'email': 'existing@test.com'},
            backend=None,
            user=user
        )
        
        user.refresh_from_db()
        # Role should remain as organizer
        self.assertEqual(user.role, UserRoles.ORGANIZER)
        self.assertEqual(result['user'], user)

    def test_existing_admin_keeps_role(self):
        """Test that existing admin user keeps admin role."""
        user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role=UserRoles.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        # Do not mark as newly created
        
        result = ensure_user_role(
            strategy=None,
            details={'email': 'admin@test.com'},
            backend=None,
            user=user
        )
        
        user.refresh_from_db()
        # Admin role should be preserved
        self.assertEqual(user.role, UserRoles.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    def test_pipeline_prevents_admin_privileges_for_new_users(self):
        """Test that pipeline removes admin privileges from new OAuth users."""
        user = User.objects.create_user(
            email='wannabe_admin@test.com',
            password='testpass123',
            role=UserRoles.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        user._created = True
        
        result = ensure_user_role(
            strategy=None,
            details={'email': 'wannabe_admin@test.com'},
            backend=None,
            user=user
        )
        
        user.refresh_from_db()
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)


class GetClientUrlTest(TestCase):
    """Test cases for get_client_url helper function."""

    def test_get_client_url_returns_default(self):
        """Test that get_client_url returns default URL."""
        url = get_client_url()
        # Should return the default or configured client URL
        self.assertIsNotNone(url)
        self.assertIsInstance(url, str)
        self.assertTrue(url.startswith('http'))
