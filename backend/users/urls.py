from django.urls import path
from .views import UserRegisterView, UserListView, UserDetailView, UserUpdateView, UserDeleteView, google_jwt_redirect, LoginView

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="user-register"),
    path("login/", LoginView.as_view(), name="user-login"),
    path("list/", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("<int:pk>/update/", UserUpdateView.as_view(), name="user-update"),
    path("delete/<int:pk>/", UserDeleteView.as_view(), name="user-delete"),
    path("auth/google/jwt-redirect/", google_jwt_redirect, name="google-jwt-redirect"),
]
