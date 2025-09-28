from rest_framework import generics, status
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
from django.contrib.auth import authenticate
from django.http import JsonResponse
from django.core.cache import cache
from social_django.models import UserSocialAuth


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


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=400)
        
        # Authenticate using email and password
        user = authenticate(request, username=email, password=password)
        
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        
        return Response({'error': 'Invalid credentials'}, status=401)


class OAuthRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        oauth_session_key = request.data.get('oauth_session')
        if not oauth_session_key:
            return Response({'error': 'OAuth session key is required'}, status=400)
        
        # Retrieve OAuth session data
        session_data = cache.get(f"oauth_session_{oauth_session_key}")
        if not session_data:
            return Response({'error': 'OAuth session expired or invalid'}, status=400)
        
        # Create user with registration data
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Ensure email matches OAuth session
            if serializer.validated_data.get('email') != session_data.get('email'):
                return Response({'error': 'Email must match OAuth session'}, status=400)
            
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
            except Exception as e:
                # If social auth creation fails, still return success for user creation
                pass
            
            # Clear the session
            cache.delete(f"oauth_session_{oauth_session_key}")
            
            # Generate tokens and redirect
            refresh = RefreshToken.for_user(user)
            client = getattr(settings, 'CLIENT_URL_DEV', 'http://localhost:3000')
            
            return Response({
                'success': True,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'redirect_url': f"{client}/auth/callback?access={refresh.access_token}&refresh={refresh}&role={user.role}"
            })
        
        return Response({'error': serializer.errors}, status=400)


@login_required
def google_jwt_redirect(request):
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
    client = getattr(settings, 'CLIENT_URL_DEV', 'http://localhost:3000')
    # Include user data in the callback URL for role-based redirection
    user_data = UserSerializer(user).data
    url = f"{client}/auth/callback?access={refresh.access_token}&refresh={refresh}&role={user_data['role']}"
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
