"""
Tests for StudentCheckIn model.
This module tests StudentCheckIn model validations, check-in logic,
and attendance tracking.
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
from activities.models import Activity, Application, DailyCheckInCode, StudentCheckIn

User = get_user_model()


class StudentCheckInTestCase(TestCase):
    """Test cases for StudentCheckIn model validation and business logic."""

    def setUp(self):
        """Set up test data."""
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

        # Create students
        self.student_user = User.objects.create_user(
            email='student@ku.th',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='student'
        )
        
        self.student_profile = StudentProfile.objects.create(
            user=self.student_user,
            student_id_external='6610545547',
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
            student_id_external='6610545548',
            year=2,
            faculty='Science',
            major='Computer Science'
        )

        # Create ongoing activity
        self.now = timezone.now()
        self.activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Test Activity',
            description='Test Description',
            location='Bangkok',
            start_at=self.now - timedelta(hours=1),  # Started 1 hour ago
            end_at=self.now + timedelta(hours=2),    # Ends in 2 hours
            max_participants=10,
            current_participants=1,
            categories=['University Activities'],
            status=ActivityStatus.DURING,
            hours_awarded=Decimal('5.0')
        )

        # Create approved application
        self.application = Application.objects.create(
            activity=self.activity,
            student=self.student_user,
            status=ApplicationStatus.APPROVED
        )

        # Create daily check-in code
        self.daily_code = DailyCheckInCode.objects.create(
            activity=self.activity,
            code='ABC123',
            valid_date=timezone.localtime().date()
        )

    def test_check_in_with_valid_code(self):
        """Test successful check-in with valid code."""
        check_in = StudentCheckIn.check_in_student(
            self.activity,
            self.student_user,
            'ABC123'
        )
        
        self.assertEqual(check_in.attendance_status, 'present')
        self.assertEqual(check_in.student, self.student_user)
        self.assertEqual(check_in.activity, self.activity)
        self.assertIsNotNone(check_in.checked_in_at)

    def test_check_in_case_insensitive(self):
        """Test that check-in code is case-insensitive."""
        check_in = StudentCheckIn.check_in_student(
            self.activity,
            self.student_user,
            'abc123'  # lowercase
        )
        
        self.assertEqual(check_in.attendance_status, 'present')

    def test_cannot_check_in_without_approved_application(self):
        """Test that students need approved application to check in."""
        with self.assertRaises(ValidationError) as context:
            StudentCheckIn.check_in_student(
                self.activity,
                self.student_user2,  # No approved application
                'ABC123'
            )
        
        self.assertIn('approved application', str(context.exception))

    def test_cannot_check_in_twice(self):
        """Test that students cannot check in twice."""
        # First check-in
        StudentCheckIn.check_in_student(
            self.activity,
            self.student_user,
            'ABC123'
        )
        
        # Try to check in again
        with self.assertRaises(ValidationError) as context:
            StudentCheckIn.check_in_student(
                self.activity,
                self.student_user,
                'ABC123'
            )
        
        self.assertIn('already checked in', str(context.exception))

    def test_cannot_check_in_with_wrong_code(self):
        """Test that wrong code prevents check-in."""
        with self.assertRaises(ValidationError) as context:
            StudentCheckIn.check_in_student(
                self.activity,
                self.student_user,
                'WRONG1'
            )
        
        self.assertIn('Invalid check-in code', str(context.exception))

    def test_cannot_check_in_before_activity_starts(self):
        """Test that check-in is not allowed before activity starts."""
        # Create future activity
        future_activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Future Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now + timedelta(days=1),
            end_at=self.now + timedelta(days=1, hours=3),
            max_participants=10,
            categories=['University Activities'],
            status=ActivityStatus.UPCOMING
        )
        
        # Create approved application
        Application.objects.create(
            activity=future_activity,
            student=self.student_user,
            status=ApplicationStatus.APPROVED
        )
        
        # Create code for future activity
        DailyCheckInCode.objects.create(
            activity=future_activity,
            code='FUT123',
            valid_date=timezone.localtime().date()
        )
        
        with self.assertRaises(ValidationError) as context:
            StudentCheckIn.check_in_student(
                future_activity,
                self.student_user,
                'FUT123'
            )
        
        self.assertIn('not started yet', str(context.exception))

    def test_cannot_check_in_after_activity_ends(self):
        """Test that check-in is not allowed after activity ends."""
        # Create past activity
        past_activity = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Past Activity',
            description='Test',
            location='Bangkok',
            start_at=self.now - timedelta(days=1),
            end_at=self.now - timedelta(hours=1),
            max_participants=10,
            categories=['University Activities'],
            status=ActivityStatus.COMPLETE
        )
        
        # Create approved application
        Application.objects.create(
            activity=past_activity,
            student=self.student_user,
            status=ApplicationStatus.APPROVED
        )
        
        # Create code
        DailyCheckInCode.objects.create(
            activity=past_activity,
            code='PST123',
            valid_date=timezone.localtime().date()
        )
        
        with self.assertRaises(ValidationError) as context:
            StudentCheckIn.check_in_student(
                past_activity,
                self.student_user,
                'PST123'
            )
        
        self.assertIn('already ended', str(context.exception))

    def test_mark_absent_students(self):
        """Test marking non-checked-in students as absent."""
        # Create another approved application but don't check in
        Application.objects.create(
            activity=self.activity,
            student=self.student_user2,
            status=ApplicationStatus.APPROVED
        )
        
        # Check in only first student
        StudentCheckIn.check_in_student(
            self.activity,
            self.student_user,
            'ABC123'
        )
        
        # Mark absent students
        count = StudentCheckIn.mark_absent_students(self.activity)
        
        self.assertEqual(count, 1)  # Only student2 should be marked absent
        
        # Verify student2 is marked absent
        absent_record = StudentCheckIn.objects.get(
            activity=self.activity,
            student=self.student_user2
        )
        self.assertEqual(absent_record.attendance_status, 'absent')
        self.assertIsNotNone(absent_record.marked_absent_at)

    def test_unique_constraint(self):
        """Test that a student can only have one check-in record per activity."""
        StudentCheckIn.objects.create(
            activity=self.activity,
            student=self.student_user,
            attendance_status='present',
            checked_in_at=timezone.now()
        )
        
        with self.assertRaises(IntegrityError):
            StudentCheckIn.objects.create(
                activity=self.activity,
                student=self.student_user,
                attendance_status='present',
                checked_in_at=timezone.now()
            )
