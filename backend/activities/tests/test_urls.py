"""
Tests for activities URLs.

This module tests URL routing and reverse resolution for all activities endpoints.
"""
from django.test import TestCase
from django.urls import reverse, resolve

from activities.views import (
    ActivityListOnlyView,
    ActivityCreateOnlyView,
    ActivityDetailOnlyView,
    ActivityUpdateOnlyView,
    ActivityDeleteView,
    ActivityRequestDeleteView,
    ActivityDeletionRequestListView,
    ActivityDeletionRequestReviewView,
    ActivityMetadataView,
    ActivityModerationListView,
    ActivityModerationReviewView,
    ApplicationCreateView,
    ApplicationListView,
    ApplicationDetailView,
    ApplicationsByActivityView,
    ApplicationCancelView,
    ApplicationReviewView,
    StudentApprovedActivitiesView,
    ActivityPosterImageListCreateView,
    ActivityPosterImageDetailView,
    ActivityCheckInCodeView,
    StudentCheckInView,
    ActivityCheckInListView,
    StudentCheckInStatusView,
)


class ActivityURLTestCase(TestCase):
    """Test cases for activity-related URLs."""

    def test_activity_list_url(self):
        """Test activity list URL."""
        url = reverse('activity-list')
        self.assertEqual(url, '/api/activities/list/')
        self.assertEqual(resolve(url).func.view_class, ActivityListOnlyView)

    def test_activity_create_url(self):
        """Test activity create URL."""
        url = reverse('activity-create')
        self.assertEqual(url, '/api/activities/create/')
        self.assertEqual(resolve(url).func.view_class, ActivityCreateOnlyView)

    def test_activity_detail_url(self):
        """Test activity detail URL."""
        url = reverse('activity-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/1/')
        self.assertEqual(resolve(url).func.view_class, ActivityDetailOnlyView)

    def test_activity_update_url(self):
        """Test activity update URL."""
        url = reverse('activity-update', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/1/update/')
        self.assertEqual(resolve(url).func.view_class, ActivityUpdateOnlyView)

    def test_activity_delete_url(self):
        """Test activity delete URL."""
        url = reverse('activity-delete', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/delete/1/')
        self.assertEqual(resolve(url).func.view_class, ActivityDeleteView)

    def test_activity_request_delete_url(self):
        """Test activity request delete URL."""
        url = reverse('activity-request-delete', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/request-delete/1/')
        self.assertEqual(resolve(url).func.view_class, ActivityRequestDeleteView)

    def test_activity_deletion_request_list_url(self):
        """Test deletion request list URL."""
        url = reverse('activity-deletion-request-list')
        self.assertEqual(url, '/api/activities/deletion-requests/')
        self.assertEqual(resolve(url).func.view_class, ActivityDeletionRequestListView)

    def test_activity_deletion_request_review_url(self):
        """Test deletion request review URL."""
        url = reverse('activity-deletion-request-review', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/deletion-requests/1/review/')
        self.assertEqual(resolve(url).func.view_class, ActivityDeletionRequestReviewView)

    def test_activity_metadata_url(self):
        """Test activity metadata URL."""
        url = reverse('activity-metadata')
        self.assertEqual(url, '/api/activities/metadata/')
        self.assertEqual(resolve(url).func.view_class, ActivityMetadataView)

    def test_activity_moderation_list_url(self):
        """Test activity moderation list URL."""
        url = reverse('activity-moderation-list')
        self.assertEqual(url, '/api/activities/moderation/pending/')
        self.assertEqual(resolve(url).func.view_class, ActivityModerationListView)

    def test_activity_moderation_review_url(self):
        """Test activity moderation review URL."""
        url = reverse('activity-moderation-review', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/moderation/1/review/')
        self.assertEqual(resolve(url).func.view_class, ActivityModerationReviewView)


class ApplicationURLTestCase(TestCase):
    """Test cases for application-related URLs."""

    def test_application_create_url(self):
        """Test application create URL."""
        url = reverse('application-create')
        self.assertEqual(url, '/api/activities/applications/create/')
        self.assertEqual(resolve(url).func.view_class, ApplicationCreateView)

    def test_application_list_url(self):
        """Test application list URL."""
        url = reverse('application-list')
        self.assertEqual(url, '/api/activities/applications/list/')
        self.assertEqual(resolve(url).func.view_class, ApplicationListView)

    def test_application_detail_url(self):
        """Test application detail URL."""
        url = reverse('application-detail', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/applications/1/')
        self.assertEqual(resolve(url).func.view_class, ApplicationDetailView)

    def test_application_cancel_url(self):
        """Test application cancel URL."""
        url = reverse('application-cancel', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/applications/1/cancel/')
        self.assertEqual(resolve(url).func.view_class, ApplicationCancelView)

    def test_application_review_url(self):
        """Test application review URL."""
        url = reverse('application-review', kwargs={'pk': 1})
        self.assertEqual(url, '/api/activities/applications/1/review/')
        self.assertEqual(resolve(url).func.view_class, ApplicationReviewView)

    def test_applications_by_activity_url(self):
        """Test applications by activity URL."""
        url = reverse('applications-by-activity', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/applications/')
        self.assertEqual(resolve(url).func.view_class, ApplicationsByActivityView)

    def test_student_approved_activities_url(self):
        """Test student approved activities URL."""
        url = reverse('student-approved-activities')
        self.assertEqual(url, '/api/activities/my-approved-activities/')
        self.assertEqual(resolve(url).func.view_class, StudentApprovedActivitiesView)


class PosterImageURLTestCase(TestCase):
    """Test cases for poster image URLs."""

    def test_activity_poster_images_list_url(self):
        """Test poster images list URL."""
        url = reverse('activity-poster-images', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/posters/')
        self.assertEqual(resolve(url).func.view_class, ActivityPosterImageListCreateView)

    def test_activity_poster_image_detail_url(self):
        """Test poster image detail URL."""
        url = reverse('activity-poster-image-detail', kwargs={'activity_id': 1, 'pk': 2})
        self.assertEqual(url, '/api/activities/1/posters/2/')
        self.assertEqual(resolve(url).func.view_class, ActivityPosterImageDetailView)


class CheckInURLTestCase(TestCase):
    """Test cases for check-in related URLs."""

    def test_activity_checkin_code_url(self):
        """Test check-in code URL."""
        url = reverse('activity-checkin-code', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/checkin-code/')
        self.assertEqual(resolve(url).func.view_class, ActivityCheckInCodeView)

    def test_student_checkin_url(self):
        """Test student check-in URL."""
        url = reverse('student-checkin', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/checkin/')
        self.assertEqual(resolve(url).func.view_class, StudentCheckInView)

    def test_activity_checkin_list_url(self):
        """Test activity check-in list URL."""
        url = reverse('activity-checkin-list', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/checkin-list/')
        self.assertEqual(resolve(url).func.view_class, ActivityCheckInListView)

    def test_student_checkin_status_url(self):
        """Test student check-in status URL."""
        url = reverse('student-checkin-status', kwargs={'activity_id': 1})
        self.assertEqual(url, '/api/activities/1/checkin-status/')
        self.assertEqual(resolve(url).func.view_class, StudentCheckInStatusView)


class URLParameterTestCase(TestCase):
    """Test cases for URL parameter parsing."""

    def test_activity_id_parameter(self):
        """Test that activity_id parameter is correctly parsed."""
        url = '/api/activities/123/'
        resolved = resolve(url)
        self.assertEqual(resolved.kwargs['pk'], 123)

    def test_application_id_parameter(self):
        """Test that application ID parameter is correctly parsed."""
        url = '/api/activities/applications/456/'
        resolved = resolve(url)
        self.assertEqual(resolved.kwargs['pk'], 456)

    def test_multiple_parameters(self):
        """Test URLs with multiple parameters."""
        url = '/api/activities/1/posters/2/'
        resolved = resolve(url)
        self.assertEqual(resolved.kwargs['activity_id'], 1)
        self.assertEqual(resolved.kwargs['pk'], 2)

    def test_deletion_request_parameter(self):
        """Test deletion request ID parameter."""
        url = '/api/activities/deletion-requests/789/review/'
        resolved = resolve(url)
        self.assertEqual(resolved.kwargs['pk'], 789)
