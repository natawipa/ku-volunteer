"""
Comprehensive tests for config permissions, pagination, and validation.
"""
from django.test import TestCase, RequestFactory
from django.core.exceptions import ValidationError
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from unittest.mock import Mock

from config.permissions import (
    IsStudent, IsOrganizer, IsAdmin, IsOrganizerOrAdmin, IsOwnerOrAdmin
)
from config.pagination import NoPrevNextPagination
from config.utils import validate_student_id, validate_student_year
from config.constants import UserRoles
from users.models import User, StudentProfile, OrganizerProfile


class PermissionBehaviorTest(TestCase):
    """Test custom permission class behaviors."""

    def setUp(self):
        """Set up test users and request factory."""
        self.factory = APIRequestFactory()
        self.view = APIView()
        
        self.student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        self.organizer = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123'
        )
        self.inactive_user = User.objects.create_user(
            email='inactive@test.com',
            password='testpass123',
            role=UserRoles.STUDENT,
            is_active=False
        )

    def test_is_student_permission_allows_student(self):
        """Test IsStudent permission allows students."""
        permission = IsStudent()
        request = self.factory.get('/')
        request.user = self.student
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_student_permission_denies_non_student(self):
        """Test IsStudent permission denies non-students."""
        permission = IsStudent()
        
        # Test organizer
        request = self.factory.get('/')
        request.user = self.organizer
        self.assertFalse(permission.has_permission(request, self.view))
        
        # Test admin
        request.user = self.admin
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_student_permission_denies_unauthenticated(self):
        """Test IsStudent permission denies unauthenticated users."""
        permission = IsStudent()
        request = self.factory.get('/')
        request.user = Mock(is_authenticated=False)
        
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_organizer_permission_allows_organizer(self):
        """Test IsOrganizer permission allows organizers."""
        permission = IsOrganizer()
        request = self.factory.get('/')
        request.user = self.organizer
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_organizer_permission_denies_non_organizer(self):
        """Test IsOrganizer permission denies non-organizers."""
        permission = IsOrganizer()
        
        request = self.factory.get('/')
        request.user = self.student
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_admin_permission_allows_admin(self):
        """Test IsAdmin permission allows admins."""
        permission = IsAdmin()
        request = self.factory.get('/')
        request.user = self.admin
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_admin_permission_allows_superuser(self):
        """Test IsAdmin permission allows superusers."""
        superuser = User.objects.create_user(
            email='super@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        superuser.is_superuser = True
        superuser.save()
        
        permission = IsAdmin()
        request = self.factory.get('/')
        request.user = superuser
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_admin_permission_denies_non_admin(self):
        """Test IsAdmin permission denies non-admins."""
        permission = IsAdmin()
        
        request = self.factory.get('/')
        request.user = self.student
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_organizer_or_admin_allows_organizer(self):
        """Test IsOrganizerOrAdmin allows organizers."""
        permission = IsOrganizerOrAdmin()
        request = self.factory.get('/')
        request.user = self.organizer
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_organizer_or_admin_allows_admin(self):
        """Test IsOrganizerOrAdmin allows admins."""
        permission = IsOrganizerOrAdmin()
        request = self.factory.get('/')
        request.user = self.admin
        
        self.assertTrue(permission.has_permission(request, self.view))

    def test_is_organizer_or_admin_denies_student(self):
        """Test IsOrganizerOrAdmin denies students."""
        permission = IsOrganizerOrAdmin()
        request = self.factory.get('/')
        request.user = self.student
        
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_organizer_or_admin_denies_unauthenticated(self):
        """Test IsOrganizerOrAdmin denies unauthenticated users."""
        permission = IsOrganizerOrAdmin()
        request = self.factory.get('/')
        request.user = Mock(is_authenticated=False)
        
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_owner_or_admin_allows_owner_user_object(self):
        """Test IsOwnerOrAdmin allows owner for user object."""
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        request.user = self.student
        
        self.assertTrue(permission.has_object_permission(request, self.view, self.student))

    def test_is_owner_or_admin_allows_owner_with_user_attribute(self):
        """Test IsOwnerOrAdmin allows owner for object with user attribute."""
        profile = StudentProfile.objects.create(
            user=self.student,
            student_id_external='6512345678'
        )
        
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        request.user = self.student
        
        self.assertTrue(permission.has_object_permission(request, self.view, profile))

    def test_is_owner_or_admin_allows_owner_with_organizer_profile(self):
        """Test IsOwnerOrAdmin allows owner for object with organizer_profile."""
        org_profile = OrganizerProfile.objects.create(
            user=self.organizer,
            organization_name='Test Org'
        )
        
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        request.user = self.organizer
        
        # Test with the organizer profile object itself
        self.assertTrue(permission.has_object_permission(request, self.view, org_profile))

    def test_is_owner_or_admin_allows_admin_any_object(self):
        """Test IsOwnerOrAdmin allows admin for any object."""
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        request.user = self.admin
        
        # Admin can access another user's object
        self.assertTrue(permission.has_object_permission(request, self.view, self.student))

    def test_is_owner_or_admin_denies_non_owner(self):
        """Test IsOwnerOrAdmin denies non-owner non-admin."""
        other_student = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        request.user = other_student
        
        self.assertFalse(permission.has_object_permission(request, self.view, self.student))


class PaginationTest(TestCase):
    """Test NoPrevNextPagination class."""

    def setUp(self):
        """Set up pagination instance."""
        self.pagination = NoPrevNextPagination()

    def test_pagination_page_size(self):
        """Test pagination page size configuration."""
        self.assertEqual(self.pagination.page_size, 100)

    def test_pagination_get_paginated_response(self):
        """Test pagination response format."""
        data = [{'id': 1}, {'id': 2}, {'id': 3}]
        
        # Mock paginator
        self.pagination.page = Mock()
        self.pagination.page.paginator.count = 3
        self.pagination.page.number = 1
        
        response = self.pagination.get_paginated_response(data)
        
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertNotIn('next', response.data)
        self.assertNotIn('previous', response.data)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(response.data['results'], data)


class ValidationFunctionTest(TestCase):
    """Test validation utility functions."""

    def test_validate_student_id_valid_10_digits(self):
        """Test validate_student_id accepts valid 10-digit ID."""
        try:
            validate_student_id('6512345678')
        except ValidationError:
            self.fail("validate_student_id raised ValidationError unexpectedly")

    def test_validate_student_id_invalid_length(self):
        """Test validate_student_id rejects invalid length."""
        with self.assertRaises(ValidationError) as cm:
            validate_student_id('123')
        
        self.assertIn('10 digits', str(cm.exception))

    def test_validate_student_id_non_numeric(self):
        """Test validate_student_id rejects non-numeric input."""
        with self.assertRaises(ValidationError) as cm:
            validate_student_id('65123abc78')
        
        self.assertIn('digits', str(cm.exception))

    def test_validate_student_id_with_spaces(self):
        """Test validate_student_id rejects IDs with spaces."""
        with self.assertRaises(ValidationError):
            validate_student_id('6512 345678')

    def test_validate_student_id_with_special_chars(self):
        """Test validate_student_id rejects IDs with special characters."""
        with self.assertRaises(ValidationError):
            validate_student_id('6512-345678')

    def test_validate_student_year_valid_range(self):
        """Test validate_student_year accepts valid years 1-6."""
        for year in range(1, 7):
            try:
                validate_student_year(year)
            except ValidationError:
                self.fail(f"validate_student_year raised ValidationError for year {year}")

    def test_validate_student_year_zero(self):
        """Test validate_student_year rejects zero."""
        with self.assertRaises(ValidationError) as cm:
            validate_student_year(0)
        
        self.assertIn('greater than 0', str(cm.exception))

    def test_validate_student_year_negative(self):
        """Test validate_student_year rejects negative values."""
        with self.assertRaises(ValidationError) as cm:
            validate_student_year(-1)
        
        self.assertIn('greater than 0', str(cm.exception))

    def test_validate_student_year_too_high(self):
        """Test validate_student_year rejects values above 6."""
        with self.assertRaises(ValidationError) as cm:
            validate_student_year(7)
        
        self.assertIn('between 1 and 6', str(cm.exception))

    def test_validate_student_year_boundary_values(self):
        """Test validate_student_year at boundary values."""
        # Should pass
        validate_student_year(1)
        validate_student_year(6)
        
        # Should fail
        with self.assertRaises(ValidationError):
            validate_student_year(0)
        
        with self.assertRaises(ValidationError):
            validate_student_year(7)


class PermissionEdgeCasesTest(TestCase):
    """Test permission edge cases and error scenarios."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.view = APIView()

    def test_permission_with_user_missing_role_attribute(self):
        """Test permission handling when user has no role attribute."""
        permission = IsStudent()
        request = self.factory.get('/')
        
        # Create mock user without role
        request.user = Mock(is_authenticated=True)
        delattr(request.user, 'role')
        
        # Should return False gracefully
        self.assertFalse(permission.has_permission(request, self.view))

    def test_permission_with_none_role(self):
        """Test permission handling when role is None."""
        permission = IsStudent()
        request = self.factory.get('/')
        request.user = Mock(is_authenticated=True, role=None)
        
        self.assertFalse(permission.has_permission(request, self.view))

    def test_is_owner_or_admin_with_object_no_attributes(self):
        """Test IsOwnerOrAdmin with object that has no user/organizer_profile."""
        permission = IsOwnerOrAdmin()
        request = self.factory.get('/')
        user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        request.user = user
        
        # Object with no user-related attributes
        mock_obj = Mock(spec=[])
        
        # Should compare object with user directly
        self.assertFalse(permission.has_object_permission(request, self.view, mock_obj))
