"""Top-level URL routes."""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from social_django.views import complete as social_complete
from users.views import google_login
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/users/", include("users.urls")),
    path("api/activities/", include("activities.urls")),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('social_django.urls', namespace='social')),
    # Explicit Google OAuth endpoints (override login to enforce custom redirect_uri)
    path('api/auth/google/login/', google_login, name='google_login'),
    path('api/auth/google/callback/', social_complete, {"backend": "google-oauth2"}, name='google_callback'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
