"""
Tests for Application model.

This module tests Application model validations, approval/rejection logic,
and application status management.
"""
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from config.constants import ActivityStatus, ApplicationStatus
from users.models import OrganizerProfile, StudentProfile
from activities.models import Activity, Application

User = get_user_model()


class ApplicationModelTestCase(TestCase):
    """Test cases for Application model validation and business logic."""

    def setUp(self):
        """Set up test data."""
        # Create organizer user
        self.organizer_user = User.objects.create_user(
            email='organizer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Organizer',
            role='organizer'
        )

        # Create organizer profile
        self.organizer_profile = OrganizerProfile.objects.create(
            user=self.organizer_user,
            organization_name='Test Organization',
            organization_type='nonprofit'
        )

        # Create student users
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='student'
        )
        
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id_external='6610545545',
            year=3,
            faculty='Engineering',
            major='Computer Engineering'
        )

        self.student_user2 = User.objects.create_user(
            email='student2@ku.th',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
            role='student'
        )
        
        self.student_profile2 = StudentProfile.objects.create(
            user=self.student_user2,
            student_id_external='6610545546',
            year=2,
            faculty='Science',
            major='Computer Science'
        )

        # Create activity
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test Description',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=5,
            current_participants=0,
            categories=['University Activities'],
            status=ActivityStatus.OPEN,
            hours_awarded=Decimal('5.0')
        )

    def test_create_application(self):
        """Test creating an application with valid data."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        self.assertEqual(application.status, ApplicationStatus.PENDING)
        self.assertEqual(application.activity, self.activity)
        self.assertEqual(application.student, self.student_user)
        self.assertEqual(application.activity_title, 'Test Activity')
        self.assertIsNotNone(application.submitted_at)

    def test_application_stores_activity_title(self):
        """Test that application stores activity title on save."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        self.assertEqual(application.activity_title, self.activity.title)
        self.assertEqual(application.activity_id_stored, self.activity.id)

    def test_application_unique_constraint(self):
        """Test that a student cannot apply twice to the same activity."""
        Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        with self.assertRaises(IntegrityError):
            Application.objects.create(
                activity=self.activity,
                student=self.student_user
            )

    def test_application_only_for_students(self):
        """Test that only students can create applications."""
        application = Application(
            activity=self.activity,
            student=self.organizer_user  # Not a student!
        )
        
        with self.assertRaises(ValidationError) as context:
            application.full_clean()
        
        self.assertIn('Applications can only be made by students', str(context.exception))

    def test_approve_pending_application(self):
        """Test approving a pending application."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.approve(self.organizer_user)
        application.refresh_from_db()
        
        self.assertEqual(application.status, ApplicationStatus.APPROVED)
        self.assertEqual(application.decision_by, self.organizer_user)
        self.assertIsNotNone(application.decision_at)
        
        # Check activity capacity increased
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.current_participants, 1)

    def test_cannot_approve_non_pending_application(self):
        """Test that only pending applications can be approved."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.approve(self.organizer_user)
        
        # Try to approve again
        with self.assertRaises(ValidationError) as context:
            application.approve(self.organizer_user)
        
        self.assertIn('Only pending applications can be approved', str(context.exception))

    def test_cannot_approve_when_activity_full(self):
        """Test that applications cannot be approved when activity is full."""
        # Set activity to full capacity
        self.activity.current_participants = 5  # max is 5
        self.activity.save()
        
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        with self.assertRaises(ValidationError) as context:
            application.approve(self.organizer_user)
        
        self.assertIn('Activity has reached maximum capacity', str(context.exception))

    def test_reject_pending_application(self):
        """Test rejecting a pending application with a reason."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        reason = "Not enough experience"
        application.reject(self.organizer_user, reason)
        application.refresh_from_db()
        
        self.assertEqual(application.status, ApplicationStatus.REJECTED)
        self.assertEqual(application.decision_by, self.organizer_user)
        self.assertEqual(application.notes, reason)
        self.assertIsNotNone(application.decision_at)

    def test_cannot_reject_without_reason(self):
        """Test that rejection requires a reason."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        with self.assertRaises(ValidationError) as context:
            application.reject(self.organizer_user, "")
        
        self.assertIn('Rejection reason is required', str(context.exception))

    def test_rejection_reason_max_length(self):
        """Test that rejection reason cannot exceed 225 characters."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        long_reason = "A" * 226
        
        with self.assertRaises(ValidationError) as context:
            application.reject(self.organizer_user, long_reason)
        
        self.assertIn('cannot exceed 225 characters', str(context.exception))

    def test_cannot_reject_non_pending_application(self):
        """Test that only pending applications can be rejected."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.approve(self.organizer_user)
        
        with self.assertRaises(ValidationError) as context:
            application.reject(self.organizer_user, "Too late")
        
        self.assertIn('Only pending applications can be rejected', str(context.exception))

    def test_cancel_pending_application(self):
        """Test student can cancel their pending application."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.cancel()
        application.refresh_from_db()
        
        self.assertEqual(application.status, ApplicationStatus.CANCELLED)

    def test_cancel_approved_application(self):
        """Test student can cancel their approved application."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.approve(self.organizer_user)
        application.cancel()
        application.refresh_from_db()
        
        self.assertEqual(application.status, ApplicationStatus.CANCELLED)

    def test_cannot_cancel_rejected_application(self):
        """Test that rejected applications cannot be cancelled."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        application.reject(self.organizer_user, "Not qualified")
        
        with self.assertRaises(ValidationError) as context:
            application.cancel()
        
        self.assertIn('Only pending or approved applications can be cancelled', str(context.exception))

    def test_application_str_representation(self):
        """Test the string representation of an application."""
        application = Application.objects.create(
            activity=self.activity,
            student=self.student_user
        )
        
        str_repr = str(application)
        self.assertIn(self.student_user.email, str_repr)
        self.assertIn(self.activity.title, str_repr)
        self.assertIn('Pending', str_repr)
