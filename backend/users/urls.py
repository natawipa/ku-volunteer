from django.urls import path
from .views import (
    UserRegisterView, UserListView, UserDetailView, UserUpdateView, UserDeleteView, 
    google_jwt_redirect, LoginView, OAuthRegistrationView, ForgotPasswordView, ResetPasswordView
)

urlpatterns = [
    path("register/", UserRegisterView.as_view(), name="user-register"),
    path("oauth-register/", OAuthRegistrationView.as_view(), name="oauth-register"),
    path("login/", LoginView.as_view(), name="user-login"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("list/", UserListView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("<int:pk>/update/", UserUpdateView.as_view(), name="user-update"),
    path("delete/<int:pk>/", UserDeleteView.as_view(), name="user-delete"),
    path("auth/google/jwt-redirect/", google_jwt_redirect, name="google-jwt-redirect"),
]
