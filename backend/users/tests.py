from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from config.constants import UserRoles
from .models import OrganizerProfile, StudentProfile

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model."""
    
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
        }
    
    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertEqual(user.role, UserRoles.STUDENT)  # Default role
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password(self.user_data['password']))
    
    def test_create_user_without_email(self):
        """Test creating user without email raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='testpass123')
    
    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        
        self.assertEqual(user.role, UserRoles.ADMIN)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
    
    def test_user_string_representation(self):
        """Test string representation of user."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), self.user_data['email'])
    
    def test_user_full_name_property(self):
        """Test full_name property."""
        user = User.objects.create_user(**self.user_data)
        expected_name = f"{self.user_data['first_name']} {self.user_data['last_name']}"
        self.assertEqual(user.full_name, expected_name)
        
        # Test when no names are provided
        user_no_name = User.objects.create_user(
            email='noname@example.com',
            password='testpass123'
        )
        self.assertEqual(user_no_name.full_name, 'noname@example.com')
    
    def test_user_role_properties(self):
        """Test role checking properties."""
        student = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        organizer = User.objects.create_user(
            email='organizer@example.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='testpass123'
        )
        
        # Test student properties
        self.assertTrue(student.is_student)
        self.assertFalse(student.is_organizer)
        self.assertFalse(student.is_admin_user)
        
        # Test organizer properties
        self.assertFalse(organizer.is_student)
        self.assertTrue(organizer.is_organizer)
        self.assertFalse(organizer.is_admin_user)
        
        # Test admin properties
        self.assertFalse(admin.is_student)
        self.assertFalse(admin.is_organizer)
        self.assertTrue(admin.is_admin_user)


class StudentProfileTest(TestCase):
    """Test cases for StudentProfile model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='student@example.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
    
    def test_create_student_profile(self):
        """Test creating a student profile."""
        profile_data = {
            'user': self.user,
            'student_id_external': 'STU001',
            'year': 2,
            'faculty': 'Engineering',
            'major': 'Computer Science'
        }
        
        profile = StudentProfile.objects.create(**profile_data)
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.student_id_external, 'STU001')
        self.assertEqual(profile.year, 2)
        self.assertEqual(profile.faculty, 'Engineering')
        self.assertEqual(profile.major, 'Computer Science')
    
    def test_student_profile_string_representation(self):
        """Test string representation of student profile."""
        profile = StudentProfile.objects.create(
            user=self.user,
            student_id_external='STU001'
        )
        expected_str = f"{self.user.email} - STU001"
        self.assertEqual(str(profile), expected_str)


class OrganizerProfileTest(TestCase):
    """Test cases for OrganizerProfile model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='organizer@example.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
    
    def test_create_organizer_profile(self):
        """Test creating an organizer profile."""
        profile_data = {
            'user': self.user,
            'organization_type': 'internal',
            'organization_name': 'Kasetsart University'
        }
        
        profile = OrganizerProfile.objects.create(**profile_data)
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.organization_type, 'internal')
        self.assertEqual(profile.organization_name, 'Kasetsart University')
    
    def test_organizer_profile_string_representation(self):
        """Test string representation of organizer profile."""
        profile = OrganizerProfile.objects.create(
            user=self.user,
            organization_type='internal',
            organization_name='Kasetsart University'
        )
        expected_str = f"{self.user.email} - Kasetsart University (Kasetsart University)"
        self.assertEqual(str(profile), expected_str)


class UserAPITest(APITestCase):
    """Test cases for User API endpoints."""
    
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
    
    def get_auth_header(self, user):
        """Get authorization header for user."""
        refresh = RefreshToken.for_user(user)
        return {'HTTP_AUTHORIZATION': f'Bearer {refresh.access_token}'}
    
    def test_user_registration(self):
        """Test user registration endpoint."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': UserRoles.STUDENT,
            'student_id_external': '123456789'  # Required for students
        }
        
        response = self.client.post(url, data, format='json')
        
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Registration failed with status {response.status_code}: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
    
    def test_user_login(self):
        """Test user login endpoint."""
        url = reverse('user-login')
        data = {
            'email': 'student@example.com',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
    
    def test_user_login_invalid_credentials(self):
        """Test user login with invalid credentials."""
        url = reverse('user-login')
        data = {
            'email': 'student@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
    
    def test_user_list_admin_only(self):
        """Test user list endpoint (admin only)."""
        url = reverse('user-list')
        
        # Test without authentication
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test with student (should be forbidden)
        response = self.client.get(url, **self.get_auth_header(self.student))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with admin (should work)
        response = self.client.get(url, **self.get_auth_header(self.admin))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check actual number of users instead of hardcoded count
        user_count = User.objects.count()
        self.assertEqual(len(response.data['results'] if 'results' in response.data else response.data), user_count)
    
    def test_user_detail_own_profile(self):
        """Test user can view their own profile."""
        url = reverse('user-detail', kwargs={'pk': self.student.pk})
        
        response = self.client.get(url, **self.get_auth_header(self.student))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.student.email)
    
    def test_user_detail_other_profile_forbidden(self):
        """Test user cannot view other user's profile."""
        url = reverse('user-detail', kwargs={'pk': self.organizer.pk})
        
        response = self.client.get(url, **self.get_auth_header(self.student))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_user_detail_admin_can_view_any(self):
        """Test admin can view any user's profile."""
        url = reverse('user-detail', kwargs={'pk': self.student.pk})
        
        response = self.client.get(url, **self.get_auth_header(self.admin))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.student.email)
    
    def test_user_update_own_profile(self):
        """Test user can update their own profile."""
        url = reverse('user-update', kwargs={'pk': self.student.pk})
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        
        response = self.client.patch(url, data, format='json', **self.get_auth_header(self.student))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student.refresh_from_db()
        self.assertEqual(self.student.first_name, 'Updated')
        self.assertEqual(self.student.last_name, 'Name')
    
    def test_user_delete_admin_only(self):
        """Test user deletion (admin only)."""
        url = reverse('user-delete', kwargs={'pk': self.student.pk})
        
        # Test with student (should be forbidden)
        response = self.client.delete(url, **self.get_auth_header(self.student))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test with admin (should work)
        response = self.client.delete(url, **self.get_auth_header(self.admin))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(pk=self.student.pk).exists())
