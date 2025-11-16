from typing import Any
from urllib.parse import urlencode
import secrets
import hashlib

from django.conf import settings
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.core.mail import send_mail
from django.http import JsonResponse
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.utils import timezone
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
        # Validate email format
        try:
            django_validate_email(email)
        except ValidationError:
            return Response(
                {'email': ['Enter a valid email address.']},
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


class ForgotPasswordView(APIView):
    """API view for requesting password reset."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Send password reset email to user."""
        email = request.data.get('email', '').strip().lower()

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate email format
        try:
            django_validate_email(email)
        except ValidationError:
            return Response(
                {'error': 'Enter a valid email address'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Email not found in database
            return Response(
                {'error': 'No account found with this email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        
        # Create hash of token to store (more secure than storing plain token)
        token_hash = hashlib.sha256(reset_token.encode()).hexdigest()
        
        # Store token in cache with expiration (1 hour)
        cache_key = f"password_reset_{user.id}"
        cache.set(cache_key, {
            'token_hash': token_hash,
            'email': email,
            'created_at': timezone.now().isoformat()
        }, timeout=getattr(settings, 'PASSWORD_RESET_TIMEOUT', 3600))

        # Generate reset URL
        client_url = getattr(settings, 'CLIENT_URL_DEV', 'http://localhost:3000')
        reset_url = f"{client_url}/reset-password?token={reset_token}&email={email}"

        # Send email
        try:
            subject = "Reset Your Password - KU Volunteer"
            message = f"""
Hello,

You have requested to reset your password for your KU Volunteer account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
KU Volunteer Team
"""
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
        except Exception as e:
            # Log the error but don't expose it to user
            print(f"Email sending failed: {e}")
            return Response(
                {'error': 'Failed to send reset email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {'success': True, 'message': 'If your email exists in our system, you will receive a password reset link shortly.'},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    """API view for resetting password with token."""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        """Reset password using token."""
        email = request.data.get('email', '').strip().lower()
        token = request.data.get('token', '').strip()
        new_password = request.data.get('password', '')

        if not all([email, token, new_password]):
            return Response(
                {'error': 'Email, token, and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate email format
        try:
            django_validate_email(email)
        except ValidationError:
            return Response(
                {'error': 'Enter a valid email address'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get cached token data
        cache_key = f"password_reset_{user.id}"
        cached_data = cache.get(cache_key)
        
        if not cached_data:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify token
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        if cached_data['token_hash'] != token_hash:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify email matches
        if cached_data['email'] != email:
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(new_password)
        user.save()

        # Clear the reset token
        cache.delete(cache_key)

        return Response(
            {'success': True, 'message': 'Password has been reset successfully'},
            status=status.HTTP_200_OK
        )
