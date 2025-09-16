from rest_framework import generics
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
from .models import User
from .serializers import UserSerializer, UserRegisterSerializer
from django.conf import settings
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from urllib.parse import urlencode


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "student"


class IsOrganizer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "organizer"


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class UserRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if obj.id == user.id or user.role == "admin":  # View own details or admin can view anyone
            return obj
        self.permission_denied(self.request, message="You do not have permission to view this user.")


class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if obj.id == user.id or user.role == "admin":
            return obj
        self.permission_denied(self.request, message="You do not have permission to update this user.")


class UserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]


@login_required
def google_jwt_redirect(request):
    """
    Issue JWT tokens for the authenticated (social) user and redirect to frontend.
    Frontend will receive tokens as query params: /auth/callback?access=...&refresh=...
    """
    user = request.user
    refresh = RefreshToken.for_user(user)
    # Optional testing mode: return JSON instead of redirect when ?json=1
    if request.GET.get('json') == '1':
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })
    client = getattr(settings, 'CLIENT_URL_DEV', 'http://localhost:3000')
    url = f"{client}/auth/callback?access={refresh.access_token}&refresh={refresh}"
    return redirect(url)


def google_login(request):
    """
    Redirect to social-auth begin endpoint while forcing a custom redirect_uri
    so Google will call back to /api/auth/google/callback (Option B).
    """
    # Use configured redirect URI if available; fall back to building one.
    redirect_uri = getattr(
        settings,
        'SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI',
        request.build_absolute_uri('/api/auth/google/callback')
    )
    begin_path = '/api/auth/login/google-oauth2/'  # Provided by social_django.urls
    query = urlencode({'redirect_uri': redirect_uri})
    return redirect(f"{begin_path}?{query}")
