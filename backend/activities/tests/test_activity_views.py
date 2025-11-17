"""
Tests for Activity CRUD views.
This module tests Activity list, create, detail, update, and delete endpoints.
For Application, CheckIn, and other views, see their respective test files:
- test_application_views.py
- test_checkin_views.py
- test_view_edge_cases.py
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from config.constants import ActivityStatus
from users.models import OrganizerProfile
from activities.models import Activity

User = get_user_model()


class ActivityListViewTestCase(TestCase):
    """Test cases for activity list endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
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
        
        # Create activities - make sure they're far enough in future to stay OPEN
        self.now = timezone.now()
        self.activity1 = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Activity 1',
            description='Description 1',
            location='Bangkok',
            start_at=self.now + timedelta(days=30),
            end_at=self.now + timedelta(days=30, hours=5),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.OPEN
        )
        self.activity2 = Activity.objects.create(
            organizer_profile=self.organizer_profile,
            title='Activity 2',
            description='Description 2',
            location='Chiang Mai',
            start_at=self.now + timedelta(days=15),
            end_at=self.now + timedelta(days=15, hours=3),
            max_participants=30,
            categories=['Social Engagement Activities'],
            status=ActivityStatus.OPEN
        )

    def test_list_activities_unauthenticated(self):
        """Test that unauthenticated users can list activities."""
        response = self.client.get('/api/activities/list/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_activities_authenticated(self):
        """Test that authenticated users can list activities."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get('/api/activities/list/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_list_activities_filter_by_status(self):
        """Test filtering activities by status."""
        self.activity2.status = ActivityStatus.FULL
        self.activity2.save()
        
        response = self.client.get('/api/activities/list/', {'status': ActivityStatus.OPEN})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], ActivityStatus.OPEN)

    def test_list_activities_search(self):
        """Test searching activities by title."""
        response = self.client.get('/api/activities/list/', {'search': 'Activity 1'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)


class ActivityCreateViewTestCase(TestCase):
    """Test cases for activity create endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
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
        self.activity_data = {
            'title': 'New Activity',
            'description': 'New description',
            'location': 'Bangkok',
            'start_at': (self.now + timedelta(days=10)).isoformat(),
            'end_at': (self.now + timedelta(days=10, hours=5)).isoformat(),
            'max_participants': 30,
            'categories': '["University Activities"]',
            'hours_awarded': '3.0'
        }

    def test_create_activity_unauthenticated(self):
        """Test that unauthenticated users cannot create activities."""
        response = self.client.post('/api/activities/create/', self.activity_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_activity_as_student(self):
        """Test that students cannot create activities."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.post(
            '/api/activities/create/',
            self.activity_data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_activity_as_organizer(self):
        """Test that organizers can create activities."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.post(
            '/api/activities/create/',
            self.activity_data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Activity')
        
        activity = Activity.objects.get(title='New Activity')
        self.assertEqual(activity.organizer_profile, self.organizer_profile)
        self.assertEqual(activity.status, ActivityStatus.PENDING)

    def test_create_activity_invalid_dates(self):
        """Test that creating activity with invalid dates fails."""
        self.client.force_authenticate(user=self.organizer_user)
        
        invalid_data = self.activity_data.copy()
        invalid_data['max_participants'] = -1
        
        response = self.client.post(
            '/api/activities/create/',
            invalid_data,
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ActivityDetailViewTestCase(TestCase):
    """Test cases for activity detail endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
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
            description='Test description',
            location='Bangkok',
            start_at=self.now + timedelta(days=10),
            end_at=self.now + timedelta(days=10, hours=5),
            max_participants=50,
            categories=['University Activities'],
            status=ActivityStatus.OPEN
        )

    def test_get_activity_detail_unauthenticated(self):
        """Test that unauthenticated users cannot view activity details."""
        response = self.client.get(f'/api/activities/{self.activity.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_activity_detail_authenticated(self):
        """Test that authenticated users can view activity details."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get(f'/api/activities/{self.activity.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Activity')

    def test_get_activity_detail_not_found(self):
        """Test that non-existent activity returns 404."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.get('/api/activities/9999/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ActivityUpdateViewTestCase(TestCase):
    """Test cases for activity update endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
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
        
        self.other_organizer = User.objects.create_user(
            email='other@test.com',
            password='testpass123',
            role='organizer'
        )
        self.other_profile = OrganizerProfile.objects.create(
            user=self.other_organizer,
            organization_name='Other Organization',
            organization_type='nonprofit'
        )
        
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

    def test_update_activity_unauthenticated(self):
        """Test that unauthenticated users cannot update activities."""
        response = self.client.patch(
            f'/api/activities/{self.activity.id}/update/',
            {'title': 'Updated Title'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_activity_as_owner(self):
        """Test that activity owner can update their activity."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.patch(
            f'/api/activities/{self.activity.id}/update/',
            {'title': 'Updated Title'},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        
        self.activity.refresh_from_db()
        self.assertEqual(self.activity.title, 'Updated Title')

    def test_update_activity_as_non_owner(self):
        """Test that non-owner organizers cannot update activities."""
        self.client.force_authenticate(user=self.other_organizer)
        response = self.client.patch(
            f'/api/activities/{self.activity.id}/update/',
            {'title': 'Updated Title'},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ActivityDeleteViewTestCase(TestCase):
    """Test cases for activity delete endpoint."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
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
        
        self.admin_user = User.objects.create_user(
            email='admin@ku.th',
            password='testpass123',
            role='admin',
            is_staff=True
        )
        
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

    def test_delete_activity_without_participants(self):
        """Test that organizer can delete activity without participants."""
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.delete(f'/api/activities/delete/{self.activity.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Activity.objects.filter(id=self.activity.id).exists())

    def test_delete_activity_with_participants_as_organizer(self):
        """Test that organizer cannot directly delete activity with participants."""
        self.activity.current_participants = 5
        self.activity.save()
        
        self.client.force_authenticate(user=self.organizer_user)
        response = self.client.delete(f'/api/activities/delete/{self.activity.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Activity.objects.filter(id=self.activity.id).exists())

    def test_delete_activity_with_participants_as_admin(self):
        """Test that admin can delete activity with participants."""
        self.activity.current_participants = 5
        self.activity.save()
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/activities/delete/{self.activity.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Activity.objects.filter(id=self.activity.id).exists())
