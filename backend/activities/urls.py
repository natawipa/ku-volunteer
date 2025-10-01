from django.urls import path
from .views import (
    ActivityListCreateView,
    ActivityRetrieveUpdateView,
    ActivityDeleteView,
    ActivityRequestDeleteView,
)


urlpatterns = [
    path('', ActivityListCreateView.as_view(), name='activity-list-create'),
    path('<int:pk>/', ActivityRetrieveUpdateView.as_view(), name='activity-detail'),
    path('<int:pk>/delete/', ActivityDeleteView.as_view(), name='activity-delete'),
    path('<int:pk>/request-delete/', ActivityRequestDeleteView.as_view(), name='activity-request-delete'),
]
