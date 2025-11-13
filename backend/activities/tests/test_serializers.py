"""
Tests for activities serializers.

This module tests all serializers in the activities app including validation,
field serialization, and custom methods.
"""
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, RequestFactory
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from config.constants import ActivityStatus, ApplicationStatus, DeletionRequestStatus
from users.models import OrganizerProfile, StudentProfile
from activities.models import Activity, Application, ActivityDeletionRequest, StudentCheckIn, DailyCheckInCode
from activities.serializers import (
    ActivitySerializer,
    ActivityWriteSerializer,
    ApplicationSerializer,
    ApplicationCreateSerializer,
    ApplicationReviewSerializer,
    ActivityDeletionRequestSerializer,
    StudentCheckInSerializer,
    CheckInRequestSerializer,
    DailyCheckInCodeSerializer,
)

User = get_user_model()


class ActivitySerializerTestCase(TestCase):
    """Test cases for ActivitySerializer."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        
        # Create organizer
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Organizer',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        # Create student
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            first_name='Test',
            last_name='Student',
            role='student'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id_external='6610545001',
            year=3,
            faculty='Engineering',
            major='Computer Engineering'
        )
        
        # Create activity
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test description',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=50,
            current_participants=0,
            categories=['University Activities'],
            status=ActivityStatus.OPEN,
            hours_awarded=Decimal('5.0')
        )

    def test_activity_serializer_fields(self):
        """Test that ActivitySerializer contains all expected fields."""
        serializer = ActivitySerializer(instance=self.activity)
        data = serializer.data
        
        expected_fields = {
            'id', 'organizer_profile_id', 'organizer_email', 'organizer_name',
            'categories', 'title', 'description', 'start_at', 'end_at', 'location',
            'max_participants', 'current_participants', 'status', 'hours_awarded',
            'cover_image', 'poster_images', 'rejection_reason', 'created_at', 'updated_at',
            'requires_admin_for_delete', 'capacity_reached', 'user_application_status'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_activity_serializer_organizer_fields(self):
        """Test that organizer information is properly serialized."""
        serializer = ActivitySerializer(instance=self.activity)
        data = serializer.data
        
        self.assertEqual(data['organizer_profile_id'], self.organizer_profile.id)
        self.assertEqual(data['organizer_email'], 'organizer@test.com')
        self.assertEqual(data['organizer_name'], 'Test Organization')

    def test_activity_serializer_computed_fields(self):
        """Test that computed fields are properly serialized."""
        serializer = ActivitySerializer(instance=self.activity)
        data = serializer.data
        
        self.assertFalse(data['requires_admin_for_delete'])
        self.assertFalse(data['capacity_reached'])

    def test_activity_serializer_user_application_status_no_user(self):
        """Test user_application_status when no user in context."""
        serializer = ActivitySerializer(instance=self.activity)
        data = serializer.data
        
        self.assertIsNone(data['user_application_status'])

    def test_activity_serializer_user_application_status_with_student(self):
        """Test user_application_status for authenticated student."""
        # Create application
        Application.objects.create(
            activity=self.activity,
            student=self.student_user,
            status=ApplicationStatus.PENDING
        )
        
        # Create request with student user
        request = self.factory.get('/')
        request.user = self.student_user
        
        serializer = ActivitySerializer(instance=self.activity, context={'request': request})
        data = serializer.data
        
        self.assertEqual(data['user_application_status'], ApplicationStatus.PENDING)

    def test_activity_serializer_user_application_status_with_organizer(self):
        """Test user_application_status returns None for organizer."""
        request = self.factory.get('/')
        request.user = self.organizer_user
        
        serializer = ActivitySerializer(instance=self.activity, context={'request': request})
        data = serializer.data
        
        self.assertIsNone(data['user_application_status'])


class ActivityWriteSerializerTestCase(TestCase):
    """Test cases for ActivityWriteSerializer."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Organizer',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        self.now = timezone.now()

    def test_activity_write_serializer_create(self):
        """Test creating an activity through the serializer."""
        request = self.factory.post('/')
        request.user = self.organizer_user
        
        data = {
            'title': 'New Activity',
            'description': 'New description',
            'location': 'Bangkok',
            'start_at': self.now + timedelta(days=10),
            'end_at': self.now + timedelta(days=10, hours=5),
            'max_participants': 30,
            'categories': ['University Activities'],
            'hours_awarded': '3.0'
        }
        
        serializer = ActivityWriteSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        activity = serializer.save()
        self.assertEqual(activity.title, 'New Activity')
        self.assertEqual(activity.organizer_profile, self.organizer_profile)
        self.assertEqual(activity.status, ActivityStatus.PENDING)

    def test_activity_write_serializer_fields(self):
        """Test that ActivityWriteSerializer contains correct fields."""
        serializer = ActivityWriteSerializer()
        expected_fields = {
            'id', 'categories', 'title', 'description', 'start_at', 'end_at',
            'location', 'max_participants', 'hours_awarded', 'cover_image'
        }
        self.assertEqual(set(serializer.fields.keys()), expected_fields)


class ApplicationSerializerTestCase(TestCase):
    """Test cases for ApplicationSerializer."""

    def setUp(self):
        """Set up test data."""
        # Create organizer
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        # Create student
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='student'
        )
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id_external='6610545001'
        )
        
        # Create activity
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test description',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.OPEN
        )
        
        # Create application
        self.application = Application.objects.create(
            activity=self.activity,
            student=self.student_user,
            status=ApplicationStatus.PENDING
        )

    def test_application_serializer_fields(self):
        """Test that ApplicationSerializer contains all expected fields."""
        serializer = ApplicationSerializer(instance=self.application)
        data = serializer.data
        
        expected_fields = {
            'id', 'activity', 'activity_id', 'activity_title', 'activity_id_stored',
            'student', 'student_email', 'student_name', 'student_id_external',
            'status', 'submitted_at', 'decision_at', 'decision_by', 'decision_by_email', 'notes'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_application_serializer_student_name(self):
        """Test that student name is properly formatted."""
        serializer = ApplicationSerializer(instance=self.application)
        data = serializer.data
        
        self.assertEqual(data['student_name'], 'John Doe')
        self.assertEqual(data['student_email'], 'student@ku.th')

    def test_application_serializer_activity_title(self):
        """Test that activity title is retrieved."""
        serializer = ApplicationSerializer(instance=self.application)
        data = serializer.data
        
        self.assertEqual(data['activity_title'], 'Test Activity')
        self.assertEqual(data['activity_id'], self.activity.id)

    def test_application_serializer_deleted_activity(self):
        """Test serialization when activity is deleted."""
        # Store activity info
        self.application.activity_title = 'Stored Title'
        self.application.activity_id_stored = 999
        self.application.activity = None
        self.application.save()
        
        serializer = ApplicationSerializer(instance=self.application)
        data = serializer.data
        
        self.assertEqual(data['activity_title'], 'Stored Title')
        self.assertEqual(data['activity_id'], 999)


class ApplicationCreateSerializerTestCase(TestCase):
    """Test cases for ApplicationCreateSerializer."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        
        # Create organizer and activity
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            role='student'
        )
        
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.OPEN
        )

    def test_application_create_serializer_valid(self):
        """Test creating a valid application."""
        request = self.factory.post('/')
        request.user = self.student_user
        
        data = {'activity': self.activity.id}
        serializer = ApplicationCreateSerializer(data=data, context={'request': request})
        
        self.assertTrue(serializer.is_valid())
        application = serializer.save()
        
        self.assertEqual(application.student, self.student_user)
        self.assertEqual(application.activity, self.activity)
        self.assertEqual(application.status, ApplicationStatus.PENDING)

    def test_application_create_serializer_duplicate(self):
        """Test that duplicate applications are rejected."""
        # Create first application
        Application.objects.create(
            activity=self.activity,
            student=self.student_user,
            status=ApplicationStatus.PENDING
        )
        
        request = self.factory.post('/')
        request.user = self.student_user
        
        data = {'activity': self.activity.id}
        serializer = ApplicationCreateSerializer(data=data, context={'request': request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('You have already applied', str(serializer.errors))

    def test_application_create_serializer_activity_not_open(self):
        """Test that applications to closed activities are rejected."""
        self.activity.status = ActivityStatus.CANCELLED
        self.activity.save()
        
        request = self.factory.post('/')
        request.user = self.student_user
        
        data = {'activity': self.activity.id}
        serializer = ApplicationCreateSerializer(data=data, context={'request': request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('not open for applications', str(serializer.errors))

    def test_application_create_serializer_activity_full(self):
        """Test that applications to full activities are rejected."""
        self.activity.current_participants = 50
        self.activity.save()
        
        # Manually update status to FULL since capacity is reached
        self.activity.auto_update_status()
        
        request = self.factory.post('/')
        request.user = self.student_user
        
        data = {'activity': self.activity.id}
        serializer = ApplicationCreateSerializer(data=data, context={'request': request})
        
        self.assertFalse(serializer.is_valid())
        # When activity becomes FULL, it's no longer OPEN, so the error message is about status
        self.assertIn('not open for applications', str(serializer.errors))


class ApplicationReviewSerializerTestCase(TestCase):
    """Test cases for ApplicationReviewSerializer."""

    def test_application_review_serializer_approve(self):
        """Test approve action validation."""
        data = {'action': 'approve'}
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())

    def test_application_review_serializer_reject_with_reason(self):
        """Test reject action with reason."""
        data = {
            'action': 'reject',
            'reason': 'Not qualified'
        }
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['reason'], 'Not qualified')

    def test_application_review_serializer_reject_without_reason(self):
        """Test that reject without reason fails."""
        data = {'action': 'reject'}
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('reason', serializer.errors)
        self.assertIn('required', str(serializer.errors['reason']))

    def test_application_review_serializer_reject_empty_reason(self):
        """Test that reject with empty reason fails."""
        data = {
            'action': 'reject',
            'reason': '   '
        }
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('reason', serializer.errors)

    def test_application_review_serializer_reason_too_long(self):
        """Test that overly long reason is rejected."""
        data = {
            'action': 'reject',
            'reason': 'A' * 226
        }
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('reason', serializer.errors)
        self.assertIn('225 characters', str(serializer.errors['reason']))

    def test_application_review_serializer_invalid_action(self):
        """Test that invalid action is rejected."""
        data = {'action': 'invalid'}
        serializer = ApplicationReviewSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('action', serializer.errors)


class ActivityDeletionRequestSerializerTestCase(TestCase):
    """Test cases for ActivityDeletionRequestSerializer."""

    def setUp(self):
        """Set up test data."""
        # Create organizer
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        # Create activity
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.OPEN
        )
        
        # Create deletion request
        self.deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Need to cancel',
            status=DeletionRequestStatus.PENDING
        )

    def test_deletion_request_serializer_fields(self):
        """Test that serializer contains all expected fields."""
        serializer = ActivityDeletionRequestSerializer(instance=self.deletion_request)
        data = serializer.data
        
        expected_fields = {
            'id', 'activity', 'activity_title', 'reason', 'status',
            'requested_by', 'requested_by_email', 'requested_at',
            'reviewed_by', 'reviewed_at', 'review_note'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_deletion_request_serializer_activity_title(self):
        """Test that activity title is retrieved."""
        serializer = ActivityDeletionRequestSerializer(instance=self.deletion_request)
        data = serializer.data
        
        self.assertEqual(data['activity_title'], 'Test Activity')

    def test_deletion_request_serializer_deleted_activity(self):
        """Test serialization when activity is deleted."""
        self.deletion_request.activity_title = 'Stored Title'
        self.deletion_request.activity = None
        self.deletion_request.save()
        
        serializer = ActivityDeletionRequestSerializer(instance=self.deletion_request)
        data = serializer.data
        
        self.assertEqual(data['activity_title'], 'Stored Title')


class StudentCheckInSerializerTestCase(TestCase):
    """Test cases for StudentCheckInSerializer."""

    def setUp(self):
        """Set up test data."""
        # Create organizer and activity
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
            role='student'
        )
        
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now - timedelta(hours=1),
            end_at=self.now + timedelta(hours=2),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.DURING
        )
        
        self.checkin = StudentCheckIn.objects.create(
            activity=self.activity,
            student=self.student_user,
            attendance_status='present',
            checked_in_at=timezone.now()
        )

    def test_student_checkin_serializer_fields(self):
        """Test that serializer contains all expected fields."""
        serializer = StudentCheckInSerializer(instance=self.checkin)
        data = serializer.data
        
        expected_fields = {
            'id', 'activity', 'activity_title', 'student', 'student_email',
            'student_name', 'attendance_status', 'checked_in_at', 'marked_absent_at'
        }
        self.assertEqual(set(data.keys()), expected_fields)

    def test_student_checkin_serializer_student_name(self):
        """Test that student name is properly formatted."""
        serializer = StudentCheckInSerializer(instance=self.checkin)
        data = serializer.data
        
        self.assertEqual(data['student_name'], 'Jane Smith')
        self.assertEqual(data['student_email'], 'student@ku.th')

    def test_student_checkin_serializer_activity_title(self):
        """Test that activity title is included."""
        serializer = StudentCheckInSerializer(instance=self.checkin)
        data = serializer.data
        
        self.assertEqual(data['activity_title'], 'Test Activity')


class CheckInRequestSerializerTestCase(TestCase):
    """Test cases for CheckInRequestSerializer."""

    def test_checkin_request_serializer_valid_code(self):
        """Test valid 6-character code."""
        data = {'code': 'ABC123'}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['code'], 'ABC123')

    def test_checkin_request_serializer_lowercase_code(self):
        """Test that lowercase codes are converted to uppercase."""
        data = {'code': 'abc123'}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['code'], 'ABC123')

    def test_checkin_request_serializer_code_with_whitespace(self):
        """Test that whitespace is stripped."""
        data = {'code': '  ABC123  '}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['code'], 'ABC123')

    def test_checkin_request_serializer_code_too_short(self):
        """Test that codes shorter than 6 characters are rejected."""
        data = {'code': 'ABC12'}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_checkin_request_serializer_code_too_long(self):
        """Test that codes longer than 6 characters are rejected."""
        data = {'code': 'ABC1234'}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

    def test_checkin_request_serializer_missing_code(self):
        """Test that missing code is rejected."""
        data = {}
        serializer = CheckInRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)


class DailyCheckInCodeSerializerTestCase(TestCase):
    """Test cases for DailyCheckInCodeSerializer."""

    def setUp(self):
        """Set up test data."""
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            role='organizer'
        )
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )
        
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now - timedelta(hours=1),
            end_at=self.now + timedelta(hours=2),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.DURING
        )
        
        self.code = DailyCheckInCode.objects.create(
            activity=self.activity,
            code='ABC123',
            valid_date=timezone.localtime().date()
        )

    def test_daily_checkin_code_serializer_fields(self):
        """Test that serializer contains all expected fields."""
        serializer = DailyCheckInCodeSerializer(instance=self.code)
        data = serializer.data
        
        expected_fields = {'id', 'code', 'valid_date', 'created_at'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_daily_checkin_code_serializer_read_only(self):
        """Test that certain fields are read-only."""
        serializer = DailyCheckInCodeSerializer()
        
        self.assertIn('id', serializer.fields)
        self.assertTrue(serializer.fields['id'].read_only)
        self.assertTrue(serializer.fields['code'].read_only)
        self.assertTrue(serializer.fields['created_at'].read_only)
