"""
Comprehensive test cases for user views and API endpoints.
"""
from unittest.mock import patch, Mock
import json
from django.test import TestCase, RequestFactory
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User, StudentProfile, OrganizerProfile
from users.views import google_jwt_redirect, google_login
from config.constants import UserRoles, OrganizationType


class UserRegisterViewTest(TestCase):
    """Test cases for user registration endpoint."""

    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
        self.register_url = reverse('user-register')

    def test_register_student_success(self):
        """Test successful student registration."""
        data = {
            'email': 'student@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'first_name': 'John',
            'last_name': 'Doe',
            'student_id_external': '6610545545',
            'year': 3,
            'faculty': 'Engineering',
            'major': 'Computer Science'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.first()
        self.assertEqual(user.email, 'student@test.com')
        self.assertEqual(user.role, UserRoles.STUDENT)
        
        # Check student profile was created
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.student_id_external, '6610545545')

    def test_register_student_without_student_id_fails(self):
        """Test that registering a student without student_id_external fails."""
        data = {
            'email': 'student@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'first_name': 'John',
            'last_name': 'Doe'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id_external', response.data)

    def test_register_student_with_duplicate_student_id_fails(self):
        """Test that registering with duplicate student_id_external fails."""
        # Create first student
        StudentProfile.objects.create(
            user=User.objects.create_user(
                email='existing@test.com',
                password='testpass123',
                role=UserRoles.STUDENT
            ),
            student_id_external='6610545545'
        )
        
        # Try to register with same student ID
        data = {
            'email': 'newstudent@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('student_id_external', response.data)

    def test_register_organizer_internal_success(self):
        """Test successful internal organizer registration."""
        data = {
            'email': 'organizer@test.com',
            'password': 'testpass123',
            'role': UserRoles.ORGANIZER,
            'first_name': 'Jane',
            'last_name': 'Smith',
            'organization': 'Kasetsart University',
            'organization_name': 'Computer Engineering Department'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.first()
        self.assertEqual(user.role, UserRoles.ORGANIZER)
        
        # Check organizer profile was created
        self.assertTrue(hasattr(user, 'organizer_profile'))
        self.assertEqual(user.organizer_profile.organization_type, OrganizationType.INTERNAL)

    def test_register_organizer_external_success(self):
        """Test successful external organizer registration."""
        data = {
            'email': 'organizer@test.com',
            'password': 'testpass123',
            'role': UserRoles.ORGANIZER,
            'organization': 'External Organization',
            'organization_name': 'Red Cross Thailand'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.first()
        self.assertEqual(user.organizer_profile.organization_type, OrganizationType.EXTERNAL)

    def test_register_with_duplicate_email_fails(self):
        """Test that registering with duplicate email fails."""
        User.objects.create_user(email='existing@test.com', password='testpass123')
        
        data = {
            'email': 'existing@test.com',
            'password': 'newpass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_with_empty_password_fails(self):
        """Test that registering with empty password fails."""
        data = {
            'email': 'student@test.com',
            'password': '',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_register_with_whitespace_only_password_fails(self):
        """Test that registering with whitespace-only password fails."""
        data = {
            'email': 'student@test.com',
            'password': '   ',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class LoginViewTest(TestCase):
    """Test cases for user login endpoint."""

    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.login_url = reverse('user-login')
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )

    def test_login_success(self):
        """Test successful login."""
        data = {
            'email': 'test@test.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@test.com')

    def test_login_with_wrong_password_fails(self):
        """Test login with incorrect password fails."""
        data = {
            'email': 'test@test.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_with_nonexistent_email_fails(self):
        """Test login with non-existent email fails."""
        data = {
            'email': 'nonexistent@test.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_without_email_fails(self):
        """Test login without email fails."""
        data = {'password': 'testpass123'}
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_without_password_fails(self):
        """Test login without password fails."""
        data = {'email': 'test@test.com'}
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_inactive_user_fails(self):
        """Test login with inactive user fails."""
        self.user.is_active = False
        self.user.save()
        
        data = {
            'email': 'test@test.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_with_email_missing_at_symbol_fails(self):
        """Test login with email missing @ symbol fails."""
        data = {
            'email': 'adminku.th',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_with_email_missing_dot_in_domain_fails(self):
        """Test login with email missing dot in domain fails."""
        data = {
            'email': 'admin@kuth',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_login_with_invalid_email_format_fails(self):
        """Test login with invalid email format fails."""
        invalid_emails = [
            'admin@',
            '@ku.th',
            'admin @ku.th',
            'admin@ku .th',
            'admin ku@th.com'
        ]
        
        for invalid_email in invalid_emails:
            data = {
                'email': invalid_email,
                'password': 'testpass123'
            }
            response = self.client.post(self.login_url, data, format='json')
            
            self.assertEqual(
                response.status_code, 
                status.HTTP_400_BAD_REQUEST,
                f"Failed to reject invalid email: {invalid_email}"
            )
            self.assertIn('email', response.data, f"Expected 'email' error for: {invalid_email}")


class UserListViewTest(TestCase):
    """Test cases for user list endpoint (admin only)."""

    def setUp(self):
        """Set up test client and users."""
        self.client = APIClient()
        self.list_url = reverse('user-list')
        
        # Create admin user
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123'
        )
        
        # Create regular user
        self.user = User.objects.create_user(
            email='user@test.com',
            password='userpass123'
        )

    def test_admin_can_list_users(self):
        """Test that admin can list all users."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_regular_user_cannot_list_users(self):
        """Test that regular user cannot list users."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_list_users(self):
        """Test that unauthenticated user cannot list users."""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDetailViewTest(TestCase):
    """Test cases for user detail endpoint."""

    def setUp(self):
        """Set up test client and users."""
        self.client = APIClient()
        
        # Create users
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123'
        )
        self.user = User.objects.create_user(
            email='user@test.com',
            password='userpass123',
            first_name='John',
            last_name='Doe'
        )
        self.other_user = User.objects.create_user(
            email='other@test.com',
            password='otherpass123'
        )
        
        self.detail_url = reverse('user-detail', kwargs={'pk': self.user.pk})

    def test_user_can_view_own_details(self):
        """Test that user can view their own details."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@test.com')
        self.assertEqual(response.data['first_name'], 'John')

    def test_admin_can_view_any_user_details(self):
        """Test that admin can view any user's details."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'user@test.com')

    def test_user_cannot_view_other_user_details(self):
        """Test that user cannot view other user's details."""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_user_cannot_view_details(self):
        """Test that unauthenticated user cannot view details."""
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserUpdateViewTest(TestCase):
    """Test cases for user update endpoint."""

    def setUp(self):
        """Set up test client and users."""
        self.client = APIClient()
        
        # Create users
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123'
        )
        self.student = User.objects.create_user(
            email='student@test.com',
            password='studentpass123',
            role=UserRoles.STUDENT,
            first_name='John',
            last_name='Doe'
        )
        StudentProfile.objects.create(
            user=self.student,
            student_id_external='6610545545',
            year=3,
            faculty='Engineering',
            major='Computer Science'
        )
        
        self.update_url = reverse('user-update', kwargs={'pk': self.student.pk})

    def test_user_can_update_own_profile(self):
        """Test that user can update their own profile."""
        self.client.force_authenticate(user=self.student)
        data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'year': 4
        }
        response = self.client.patch(self.update_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Jane')
        self.assertEqual(self.student.last_name, 'Smith')
        self.assertEqual(self.student.profile.year, 4)

    def test_admin_can_update_any_user(self):
        """Test that admin can update any user."""
        self.client.force_authenticate(user=self.admin)
        data = {'first_name': 'Updated'}
        response = self.client.patch(self.update_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Updated')

    def test_update_student_profile_fields(self):
        """Test updating student profile fields."""
        self.client.force_authenticate(user=self.student)
        data = {
            'year': 4,
            'faculty': 'Science',
            'major': 'Physics'
        }
        response = self.client.patch(self.update_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile = StudentProfile.objects.get(user=self.student)
        self.assertEqual(profile.year, 4)
        self.assertEqual(profile.faculty, 'Science')
        self.assertEqual(profile.major, 'Physics')

    def test_update_organizer_profile_fields(self):
        """Test updating organizer profile fields."""
        organizer = User.objects.create_user(
            email='organizer@test.com',
            password='orgpass123',
            role=UserRoles.ORGANIZER
        )
        OrganizerProfile.objects.create(
            user=organizer,
            organization_type=OrganizationType.INTERNAL,
            organization_name='Old Name'
        )
        
        self.client.force_authenticate(user=organizer)
        url = reverse('user-update', kwargs={'pk': organizer.pk})
        data = {
            'organization_type': OrganizationType.EXTERNAL,
            'organization_name': 'New Organization'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile = OrganizerProfile.objects.get(user=organizer)
        self.assertEqual(profile.organization_type, OrganizationType.EXTERNAL)
        self.assertEqual(profile.organization_name, 'New Organization')


class UserDeleteViewTest(TestCase):
    """Test cases for user delete endpoint (admin only)."""

    def setUp(self):
        """Set up test client and users."""
        self.client = APIClient()
        
        # Create users
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123'
        )
        self.user = User.objects.create_user(
            email='user@test.com',
            password='userpass123'
        )
        
        self.delete_url = reverse('user-delete', kwargs={'pk': self.user.pk})

    def test_admin_can_delete_user(self):
        """Test that admin can delete a user."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(self.delete_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(User.objects.filter(pk=self.user.pk).count(), 0)

    def test_regular_user_cannot_delete_user(self):
        """Test that regular user cannot delete users."""
        another_user = User.objects.create_user(
            email='another@test.com',
            password='anotherpass123'
        )
        self.client.force_authenticate(user=self.user)
        url = reverse('user-delete', kwargs={'pk': another_user.pk})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(User.objects.filter(pk=another_user.pk).count(), 1)

    def test_unauthenticated_user_cannot_delete(self):
        """Test that unauthenticated user cannot delete users."""
        response = self.client.delete(self.delete_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OAuthRegistrationViewTest(TestCase):
    """Test cases for OAuth registration completion endpoint."""

    def setUp(self):
        """Set up test client and mock OAuth session data."""
        self.client = APIClient()
        self.oauth_register_url = reverse('oauth-register')
        self.session_key = 'test-session-123'
        
        # Mock OAuth session data
        self.session_data = {
            'email': 'newuser@gmail.com',
            'details': {
                'email': 'newuser@gmail.com',
                'first_name': 'Test',
                'last_name': 'User',
                'picture': 'https://example.com/photo.jpg'
            }
        }

    def test_oauth_registration_student_success(self):
        """Test successful OAuth registration for student."""
        # Set up session
        cache.set(f"oauth_session_{self.session_key}", self.session_data, timeout=600)
        
        data = {
            'oauth_session': self.session_key,
            'email': 'newuser@gmail.com',
            'password': 'temppass123',
            'role': UserRoles.STUDENT,
            'first_name': 'Test',
            'last_name': 'User',
            'student_id_external': '6512345678',
            'year': 3,
            'faculty': 'Engineering',
            'major': 'Computer Engineering'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertIn('redirect_url', response.data)
        
        # Verify user was created
        user = User.objects.get(email='newuser@gmail.com')
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.student_id_external, '6512345678')
        
        # Verify session was cleared
        self.assertIsNone(cache.get(f"oauth_session_{self.session_key}"))

    def test_oauth_registration_organizer_success(self):
        """Test successful OAuth registration for organizer."""
        cache.set(f"oauth_session_{self.session_key}", self.session_data, timeout=600)
        
        data = {
            'oauth_session': self.session_key,
            'email': 'newuser@gmail.com',
            'password': 'temppass123',
            'role': UserRoles.ORGANIZER,
            'first_name': 'Test',
            'last_name': 'Organizer',
            'organization': 'Kasetsart University',
            'organization_name': 'Student Affairs'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='newuser@gmail.com')
        self.assertEqual(user.role, UserRoles.ORGANIZER)
        self.assertTrue(hasattr(user, 'organizer_profile'))

    def test_oauth_registration_missing_session_key(self):
        """Test OAuth registration without session key fails."""
        data = {
            'email': 'newuser@gmail.com',
            'password': 'temppass123',
            'role': UserRoles.STUDENT
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('OAuth session key is required', response.data['error'])

    def test_oauth_registration_invalid_session(self):
        """Test OAuth registration with invalid/expired session fails."""
        data = {
            'oauth_session': 'invalid-session',
            'email': 'newuser@gmail.com',
            'password': 'temppass123',
            'role': UserRoles.STUDENT
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('OAuth session expired or invalid', response.data['error'])

    def test_oauth_registration_email_mismatch(self):
        """Test OAuth registration with mismatched email fails."""
        cache.set(f"oauth_session_{self.session_key}", self.session_data, timeout=600)
        
        data = {
            'oauth_session': self.session_key,
            'email': 'different@gmail.com',  # Different from session
            'password': 'temppass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6512345678'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('Email must match OAuth session', response.data['error'])

    def test_oauth_registration_invalid_data(self):
        """Test OAuth registration with invalid data fails."""
        cache.set(f"oauth_session_{self.session_key}", self.session_data, timeout=600)
        
        data = {
            'oauth_session': self.session_key,
            'email': 'newuser@gmail.com',
            'password': '',  # Invalid: empty password
            'role': UserRoles.STUDENT,
            'student_id_external': '6512345678'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_oauth_registration_student_without_student_id(self):
        """Test OAuth registration for student without student_id fails."""
        cache.set(f"oauth_session_{self.session_key}", self.session_data, timeout=600)
        
        data = {
            'oauth_session': self.session_key,
            'email': 'newuser@gmail.com',
            'password': 'temppass123',
            'role': UserRoles.STUDENT
            # Missing student_id_external
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oauth_registration_duplicate_email(self):
        """Test OAuth registration with existing email."""
        # Create existing user
        User.objects.create_user(
            email='existing@gmail.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        
        session_key = 'test-session-456'
        session_data = {
            'email': 'existing@gmail.com',
            'details': {'email': 'existing@gmail.com'}
        }
        cache.set(f"oauth_session_{session_key}", session_data, timeout=600)
        
        data = {
            'oauth_session': session_key,
            'email': 'existing@gmail.com',
            'password': 'newpass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6512345678'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        # Should fail due to unique email constraint
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_oauth_registration_session_persists_on_error(self):
        """Test that OAuth session is NOT cleared on validation error."""
        session_key = 'test-session-789'
        session_data = {
            'email': 'newuser@gmail.com',
            'details': {'email': 'newuser@gmail.com'}
        }
        cache.set(f"oauth_session_{session_key}", session_data, timeout=600)
        
        data = {
            'oauth_session': session_key,
            'email': 'newuser@gmail.com',
            'password': '',  # Invalid
            'role': UserRoles.STUDENT,
            'student_id_external': '6512345678'
        }
        
        response = self.client.post(self.oauth_register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Session should still exist for retry
        self.assertIsNotNone(cache.get(f"oauth_session_{session_key}"))


class GoogleJWTRedirectTest(TestCase):
    """Test cases for Google JWT redirect view."""

    def setUp(self):
        """Set up test data."""
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            role=UserRoles.STUDENT,
            first_name='Test',
            last_name='User'
        )
        StudentProfile.objects.create(
            user=self.user,
            student_id_external='6512345678'
        )

    @patch('users.views.get_client_url')
    def test_google_jwt_redirect_success(self, mock_get_client_url):
        """Test successful JWT redirect."""
        mock_get_client_url.return_value = 'http://localhost:3000'
        
        request = self.factory.get('/api/users/auth/google/jwt-redirect/')
        request.user = self.user
        
        response = google_jwt_redirect(request)
        
        self.assertEqual(response.status_code, 302)  # Redirect
        self.assertIn('http://localhost:3000/auth/callback', response.url)
        self.assertIn('access=', response.url)
        self.assertIn('refresh=', response.url)
        self.assertIn(f'role={UserRoles.STUDENT}', response.url)

    @patch('users.views.get_client_url')
    def test_google_jwt_redirect_json_mode(self, mock_get_client_url):
        """Test JWT redirect with JSON mode."""
        mock_get_client_url.return_value = 'http://localhost:3000'
        
        request = self.factory.get('/api/users/auth/google/jwt-redirect/?json=1')
        request.user = self.user
        
        response = google_jwt_redirect(request)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('access', data)
        self.assertIn('refresh', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'test@test.com')


class GoogleLoginTest(TestCase):
    """Test cases for Google login redirect."""

    def setUp(self):
        """Set up test data."""
        self.factory = RequestFactory()

    @patch('django.conf.settings.SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
    def test_google_login_redirect_with_settings(self):
        """Test Google login redirect with configured redirect URI."""
        request = self.factory.get('/api/auth/google/login/')
        
        response = google_login(request)
        
        self.assertEqual(response.status_code, 302)
        self.assertIn('/api/auth/login/google-oauth2/', response.url)
        self.assertIn('redirect_uri=', response.url)

    def test_google_login_redirect_without_settings(self):
        """Test Google login redirect without configured redirect URI."""
        request = self.factory.get('/api/auth/google/login/')
        
        response = google_login(request)
        
        self.assertEqual(response.status_code, 302)
        self.assertIn('/api/auth/login/google-oauth2/', response.url)
