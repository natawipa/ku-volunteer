from django.urls import path
from .views import UserRegisterView, UserListView, UserDetailView
from .views import UserDeleteView  # For Delete test data

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="user-register"),
    path("list/", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("delete/<int:pk>/", UserDeleteView.as_view(), name="user-delete"), # For testing
]   
