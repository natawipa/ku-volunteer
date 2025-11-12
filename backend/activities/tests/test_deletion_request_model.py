"""
Tests for ActivityDeletionRequest model.

This module tests ActivityDeletionRequest model validations,
approval/rejection logic, and deletion request management.
"""
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from config.constants import ActivityStatus, DeletionRequestStatus
from users.models import OrganizerProfile
from activities.models import Activity, ActivityDeletionRequest

User = get_user_model()


class ActivityDeletionRequestTestCase(TestCase):
    """Test cases for ActivityDeletionRequest model."""

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

        # Create admin
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='admin',
            is_staff=True
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
            max_participants=10,
            current_participants=5,
            categories=['University Activities'],
            status=ActivityStatus.OPEN,
            hours_awarded=Decimal('5.0')
        )

    def test_create_deletion_request(self):
        """Test creating a deletion request."""
        deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Need to reschedule'
        )
        
        self.assertEqual(deletion_request.status, DeletionRequestStatus.PENDING)
        self.assertEqual(deletion_request.activity, self.activity)
        self.assertEqual(deletion_request.requested_by, self.organizer_user)
        self.assertEqual(deletion_request.reason, 'Need to reschedule')

    def test_deletion_request_stores_activity_title(self):
        """Test that deletion request stores activity title."""
        deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Testing'
        )
        
        self.assertEqual(deletion_request.activity_title, self.activity.title)

    def test_approve_deletion_request(self):
        """Test approving a deletion request."""
        deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Need to cancel'
        )
        
        deletion_request.approve(self.admin_user, 'Approved')
        deletion_request.refresh_from_db()
        
        self.assertEqual(deletion_request.status, DeletionRequestStatus.APPROVED)
        self.assertEqual(deletion_request.reviewed_by, self.admin_user)
        self.assertEqual(deletion_request.review_note, 'Approved')
        self.assertIsNotNone(deletion_request.reviewed_at)

    def test_reject_deletion_request(self):
        """Test rejecting a deletion request."""
        deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Want to delete'
        )
        
        deletion_request.reject(self.admin_user, 'Not a valid reason')
        deletion_request.refresh_from_db()
        
        self.assertEqual(deletion_request.status, DeletionRequestStatus.REJECTED)
        self.assertEqual(deletion_request.reviewed_by, self.admin_user)
        self.assertEqual(deletion_request.review_note, 'Not a valid reason')
        self.assertIsNotNone(deletion_request.reviewed_at)

    def test_deletion_request_str_representation(self):
        """Test the string representation of a deletion request."""
        deletion_request = ActivityDeletionRequest.objects.create(
            activity=self.activity,
            requested_by=self.organizer_user,
            reason='Testing'
        )
        
        str_repr = str(deletion_request)
        self.assertIn(self.activity.title, str_repr)
