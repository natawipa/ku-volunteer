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
]
