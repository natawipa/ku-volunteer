from django.urls import path
from .views import (
    ActivityListCreateView,
    ActivityRetrieveUpdateView,
    ActivityDeleteView,
    ActivityRequestDeleteView,
    ActivityDeletionRequestListView,
    ActivityDeletionRequestReviewView,
    ActivityMetadataView,
)


urlpatterns = [
    path('', ActivityListCreateView.as_view(), name='activity-list-create'),
    path('<int:pk>/', ActivityRetrieveUpdateView.as_view(), name='activity-detail'),
    path('<int:pk>/delete/', ActivityDeleteView.as_view(), name='activity-delete'),
    path('<int:pk>/request-delete/', ActivityRequestDeleteView.as_view(), name='activity-request-delete'),
    path('deletion-requests/', ActivityDeletionRequestListView.as_view(), name='activity-deletion-request-list'),
    path('deletion-requests/<int:pk>/review/', ActivityDeletionRequestReviewView.as_view(), name='activity-deletion-request-review'),
    path('metadata/', ActivityMetadataView.as_view(), name='activity-metadata'),
]
