from django.urls import path
from .views import (
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


urlpatterns = [
    # CRUD-like paths mirroring users URL style
    path('list/', ActivityListOnlyView.as_view(), name='activity-list'),
    path('create/', ActivityCreateOnlyView.as_view(), name='activity-create'),
    path('<int:pk>/', ActivityDetailOnlyView.as_view(), name='activity-detail'),
    path('<int:pk>/update/', ActivityUpdateOnlyView.as_view(), name='activity-update'),
    path('delete/<int:pk>/', ActivityDeleteView.as_view(), name='activity-delete'),
    # Deletion request workflow (admin moderation)
    path('request-delete/<int:pk>/', ActivityRequestDeleteView.as_view(), name='activity-request-delete'),
    path('deletion-requests/', ActivityDeletionRequestListView.as_view(), name='activity-deletion-request-list'),
    path('deletion-requests/<int:pk>/review/', ActivityDeletionRequestReviewView.as_view(), name='activity-deletion-request-review'),
    # Metadata for categories
    path('metadata/', ActivityMetadataView.as_view(), name='activity-metadata'),
    # Admin moderation of activities
    path('moderation/pending/', ActivityModerationListView.as_view(), name='activity-moderation-list'),
    path('moderation/<int:pk>/review/', ActivityModerationReviewView.as_view(), name='activity-moderation-review'),
    # Application endpoints
    path('applications/create/', ApplicationCreateView.as_view(), name='application-create'),
    path('applications/list/', ApplicationListView.as_view(), name='application-list'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:pk>/cancel/', ApplicationCancelView.as_view(), name='application-cancel'),
    path('applications/<int:pk>/review/', ApplicationReviewView.as_view(), name='application-review'),
    path('<int:activity_id>/applications/', ApplicationsByActivityView.as_view(), name='applications-by-activity'),
    # Student's approved activities
    path('my-approved-activities/', StudentApprovedActivitiesView.as_view(), name='student-approved-activities'),
    # Poster image endpoints
    path('<int:activity_id>/posters/', ActivityPosterImageListCreateView.as_view(), name='activity-poster-images'),
    path('<int:activity_id>/posters/<int:pk>/', ActivityPosterImageDetailView.as_view(), name='activity-poster-image-detail'),
    # Check-in endpoints
    path('<int:activity_id>/checkin-code/', ActivityCheckInCodeView.as_view(), name='activity-checkin-code'),
    path('<int:activity_id>/checkin/', StudentCheckInView.as_view(), name='student-checkin'),
    path('<int:activity_id>/checkin-list/', ActivityCheckInListView.as_view(), name='activity-checkin-list'),
    path('<int:activity_id>/checkin-status/', StudentCheckInStatusView.as_view(), name='student-checkin-status'),
]