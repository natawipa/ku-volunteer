from typing import Any
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from social_django.models import UserSocialAuth

from config.constants import StatusMessages
from config.permissions import IsAdmin, IsOwnerOrAdmin
from config.utils import get_client_url
from .models import User
from .serializers import UserRegisterSerializer, UserSerializer


class UserRegisterView(generics.CreateAPIView):
    """API view for user registration."""

    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    """API view for listing all users (admin only)."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class UserDetailView(generics.RetrieveAPIView):
    """API view for retrieving user details."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]


class UserUpdateView(generics.UpdateAPIView):
    """API view for updating user information."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]


class UserDeleteView(generics.DestroyAPIView):
    """API view for deleting users (admin only)."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class LoginView(APIView):
    """API view for user login with email and password."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Authenticate user and return JWT tokens."""
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate using email and password
        user = authenticate(request, username=email, password=password)

        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        return Response(
            {'error': StatusMessages.INVALID_CREDENTIALS},
            status=status.HTTP_401_UNAUTHORIZED
        )


class OAuthRegistrationView(APIView):
    """API view for OAuth registration completion."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Complete OAuth registration with additional user data."""
        oauth_session_key = request.data.get('oauth_session')
        if not oauth_session_key:
            return Response(
                {'error': 'OAuth session key is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Retrieve OAuth session data
        session_data = cache.get(f"oauth_session_{oauth_session_key}")
        if not session_data:
            return Response(
                {'error': 'OAuth session expired or invalid'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user with registration data
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Ensure email matches OAuth session
            if serializer.validated_data.get('email') != session_data.get('email'):
                return Response(
                    {'error': 'Email must match OAuth session'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = serializer.save()

            # Create social auth association
            try:
                social_auth = UserSocialAuth.create_social_auth(
                    user=user,
                    uid=session_data['details']['email'],
                    backend='google-oauth2'
                )
                # Store additional OAuth details
                social_auth.extra_data = session_data['details']
                social_auth.save()
            except Exception:
                # If social auth creation fails, still return success for user creation
                pass

            # Clear the session
            cache.delete(f"oauth_session_{oauth_session_key}")

            # Generate tokens and redirect
            refresh = RefreshToken.for_user(user)
            client_url = get_client_url()

            return Response({
                'success': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'redirect_url': f"{client_url}/auth/callback?access={refresh.access_token}&refresh={refresh}&role={user.role}"
            }, status=status.HTTP_201_CREATED)

        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


@login_required
def google_jwt_redirect(request) -> JsonResponse:
    """Issue JWT for authenticated user and redirect (or return JSON in test mode)."""
    user = request.user
    refresh = RefreshToken.for_user(user)

    # Optional testing mode: return JSON instead of redirect when ?json=1
    if request.GET.get('json') == '1':
        return JsonResponse({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })

    client_url = get_client_url()
    # Include user data in the callback URL for role-based redirection
    user_data = UserSerializer(user).data
    url = f"{client_url}/auth/callback?access={refresh.access_token}&refresh={refresh}&role={user_data['role']}"
    return redirect(url)


def google_login(request):
    """Redirect to social-auth begin while forcing custom redirect_uri to our callback."""
    # Use configured redirect URI if available; fall back to building one.
    redirect_uri = getattr(
        settings,
        'SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI',
        request.build_absolute_uri('/api/auth/google/callback')
    )
    begin_path = '/api/auth/login/google-oauth2/'  # Provided by social_django.urls
    query = urlencode({'redirect_uri': redirect_uri})
    return redirect(f"{begin_path}?{query}")
