"""
Comprehensive test cases for user serializers.
"""
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from users.models import User, StudentProfile, OrganizerProfile
from users.serializers import (
    StudentProfileSerializer,
    OrganizerProfileSerializer,
    UserSerializer,
    UserRegisterSerializer
)
from config.constants import UserRoles, OrganizationType


class StudentProfileSerializerTest(TestCase):
    """Test cases for StudentProfileSerializer."""

    def test_serialize_student_profile(self):
        """Test serializing a student profile."""
        user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        profile = StudentProfile.objects.create(
            user=user,
            student_id_external='6610545545',
            year=3,
            faculty='Engineering',
            major='Computer Science'
        )
        
        serializer = StudentProfileSerializer(profile)
        data = serializer.data
        
        self.assertEqual(data['student_id_external'], '6610545545')
        self.assertEqual(data['year'], 3)
        self.assertEqual(data['faculty'], 'Engineering')
        self.assertEqual(data['major'], 'Computer Science')

    def test_serialize_partial_student_profile(self):
        """Test serializing student profile with optional fields empty."""
        user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        profile = StudentProfile.objects.create(
            user=user,
            student_id_external='6610545545'
        )
        
        serializer = StudentProfileSerializer(profile)
        data = serializer.data
        
        self.assertEqual(data['student_id_external'], '6610545545')
        self.assertIsNone(data['year'])
        self.assertIsNone(data['faculty'])
        self.assertIsNone(data['major'])


class OrganizerProfileSerializerTest(TestCase):
    """Test cases for OrganizerProfileSerializer."""

    def test_serialize_organizer_profile(self):
        """Test serializing an organizer profile."""
        user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        profile = OrganizerProfile.objects.create(
            user=user,
            organization_type=OrganizationType.INTERNAL,
            organization_name='CS Department'
        )
        
        serializer = OrganizerProfileSerializer(profile)
        data = serializer.data
        
        self.assertIn('id', data)
        self.assertEqual(data['organization_type'], OrganizationType.INTERNAL)
        self.assertEqual(data['organization_name'], 'CS Department')

    def test_serialize_external_organizer_profile(self):
        """Test serializing external organizer profile."""
        user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        profile = OrganizerProfile.objects.create(
            user=user,
            organization_type=OrganizationType.EXTERNAL,
            organization_name='Red Cross'
        )
        
        serializer = OrganizerProfileSerializer(profile)
        data = serializer.data
        
        self.assertEqual(data['organization_type'], OrganizationType.EXTERNAL)
        self.assertEqual(data['organization_name'], 'Red Cross')


class UserSerializerTest(TestCase):
    """Test cases for UserSerializer."""

    def test_serialize_student_user(self):
        """Test serializing a student user with profile."""
        user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role=UserRoles.STUDENT,
            first_name='John',
            last_name='Doe'
        )
        StudentProfile.objects.create(
            user=user,
            student_id_external='6610545545',
            year=3,
            faculty='Engineering',
            major='Computer Science'
        )
        
        serializer = UserSerializer(user)
        data = serializer.data
        
        self.assertEqual(data['email'], 'student@test.com')
        self.assertEqual(data['role'], UserRoles.STUDENT)
        self.assertEqual(data['first_name'], 'John')
        self.assertEqual(data['last_name'], 'Doe')
        self.assertIn('profile', data)
        self.assertEqual(data['profile']['student_id_external'], '6610545545')
        self.assertEqual(data['profile']['year'], 3)

    def test_serialize_organizer_user(self):
        """Test serializing an organizer user with profile."""
        user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        OrganizerProfile.objects.create(
            user=user,
            organization_type=OrganizationType.INTERNAL,
            organization_name='CS Department'
        )
        
        serializer = UserSerializer(user)
        data = serializer.data
        
        self.assertEqual(data['email'], 'organizer@test.com')
        self.assertEqual(data['role'], UserRoles.ORGANIZER)
        self.assertIn('organizer_profile', data)
        self.assertEqual(data['organizer_profile']['organization_type'], OrganizationType.INTERNAL)

    def test_update_student_profile_fields(self):
        """Test updating student profile fields through serializer."""
        user = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        StudentProfile.objects.create(
            user=user,
            student_id_external='6610545545',
            year=3,
            faculty='Engineering',
            major='Computer Science'
        )
        
        serializer = UserSerializer(user, data={
            'year': 4,
            'faculty': 'Science',
            'major': 'Physics'
        }, partial=True)
        
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        updated_user.refresh_from_db()
        self.assertEqual(updated_user.profile.year, 4)
        self.assertEqual(updated_user.profile.faculty, 'Science')
        self.assertEqual(updated_user.profile.major, 'Physics')

    def test_update_organizer_profile_fields(self):
        """Test updating organizer profile fields through serializer."""
        user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role=UserRoles.ORGANIZER
        )
        OrganizerProfile.objects.create(
            user=user,
            organization_type=OrganizationType.INTERNAL,
            organization_name='Old Name'
        )
        
        serializer = UserSerializer(user, data={
            'organization_type': OrganizationType.EXTERNAL,
            'organization_name': 'New Organization'
        }, partial=True)
        
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        updated_user.refresh_from_db()
        self.assertEqual(updated_user.organizer_profile.organization_type, OrganizationType.EXTERNAL)
        self.assertEqual(updated_user.organizer_profile.organization_name, 'New Organization')


class UserRegisterSerializerTest(TestCase):
    """Test cases for UserRegisterSerializer."""

    def test_validate_password_empty_fails(self):
        """Test that empty password validation fails."""
        serializer = UserRegisterSerializer(data={
            'email': 'test@test.com',
            'password': '',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_validate_password_whitespace_fails(self):
        """Test that whitespace-only password validation fails."""
        serializer = UserRegisterSerializer(data={
            'email': 'test@test.com',
            'password': '   ',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_validate_student_requires_student_id(self):
        """Test that student registration requires student_id_external."""
        serializer = UserRegisterSerializer(data={
            'email': 'student@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('student_id_external', serializer.errors)

    def test_validate_duplicate_student_id_fails(self):
        """Test that duplicate student_id_external fails validation."""
        # Create existing student
        user = User.objects.create_user(
            email='existing@test.com',
            password='testpass123',
            role=UserRoles.STUDENT
        )
        StudentProfile.objects.create(
            user=user,
            student_id_external='6610545545'
        )
        
        # Try to register with same student ID
        serializer = UserRegisterSerializer(data={
            'email': 'new@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('student_id_external', serializer.errors)

    def test_create_student_with_profile(self):
        """Test creating student user with profile through serializer."""
        serializer = UserRegisterSerializer(data={
            'email': 'student@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'first_name': 'John',
            'last_name': 'Doe',
            'student_id_external': '6610545545',
            'year': 3,
            'faculty': 'Engineering',
            'major': 'Computer Science'
        })
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.email, 'student@test.com')
        self.assertEqual(user.role, UserRoles.STUDENT)
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.student_id_external, '6610545545')
        self.assertEqual(user.profile.year, 3)

    def test_create_internal_organizer(self):
        """Test creating internal organizer through serializer."""
        serializer = UserRegisterSerializer(data={
            'email': 'organizer@test.com',
            'password': 'testpass123',
            'role': UserRoles.ORGANIZER,
            'organization': 'Kasetsart University',
            'organization_name': 'CS Department'
        })
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.email, 'organizer@test.com')
        self.assertEqual(user.role, UserRoles.ORGANIZER)
        self.assertTrue(hasattr(user, 'organizer_profile'))
        self.assertEqual(user.organizer_profile.organization_type, OrganizationType.INTERNAL)
        self.assertEqual(user.organizer_profile.organization_name, 'CS Department')

    def test_create_external_organizer(self):
        """Test creating external organizer through serializer."""
        serializer = UserRegisterSerializer(data={
            'email': 'organizer@test.com',
            'password': 'testpass123',
            'role': UserRoles.ORGANIZER,
            'organization': 'External Organization',
            'organization_name': 'Red Cross'
        })
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.organizer_profile.organization_type, OrganizationType.EXTERNAL)
        self.assertEqual(user.organizer_profile.organization_name, 'Red Cross')

    def test_password_is_hashed(self):
        """Test that password is properly hashed when creating user."""
        serializer = UserRegisterSerializer(data={
            'email': 'test@test.com',
            'password': 'testpass123',
            'role': UserRoles.STUDENT,
            'student_id_external': '6610545545'
        })
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        # Password should be hashed, not plain text
        self.assertNotEqual(user.password, 'testpass123')
        # But should authenticate correctly
        self.assertTrue(user.check_password('testpass123'))
