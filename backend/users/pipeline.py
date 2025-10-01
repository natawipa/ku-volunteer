from django.conf import settings
from django.shortcuts import redirect
from django.core.cache import cache
from .models import User
import uuid

# Check that user email exist in database
# If not, redirect to frontend register page
# If yes, allow to continue the pipeline
def require_existing_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    If the social user isn't already associated and no matching user is found, redirect to frontend register.
    Allows existing users (matched by email) to proceed and be associated.
    """
    if user:
        # If there's an authenticated session (e.g., logged into Django admin),
        # only allow association when the emails match. This avoids accidentally
        # attaching a social account to the currently logged-in admin account.
        incoming_email = (details or {}).get("email")
        if incoming_email and user.email and incoming_email.lower() == user.email.lower():
            return {"user": user}
        # Emails don't match -> stop the pipeline and send a clear error.
        # Ask the user to log out first, then try again.
        return strategy.redirect(f"{get_client_url()}/auth/error?reason=account_mismatch")

    email = (details or {}).get("email")
    if not email:
        # No email provided by provider; treat as new and send to role selection
        return strategy.redirect(f"{get_client_url()}/role")

    try:
        existing = User.objects.get(email=email)
        return {"user": existing}
    except User.DoesNotExist:
        # Store OAuth session data temporarily for registration completion
        session_key = str(uuid.uuid4())
        cache.set(f"oauth_session_{session_key}", {
            'email': email,
            'details': details,
            'backend': backend.name,
            'strategy': strategy.__class__.__name__
        }, timeout=1800)  # 30 minutes
        
        # Send them to role selection page with session key and prefilled email
        return strategy.redirect(f"{get_client_url()}/role?email={email}&oauth_session={session_key}")


def ensure_user_role(strategy, details, backend, user=None, *args, **kwargs):
    """
    Ensure that users created through OAuth have the correct default role.
    This fixes the issue where OAuth users might get admin role instead of student role.
    """
    if user and not hasattr(user, '_created'):
        # This is an existing user, don't modify their role
        return {"user": user}
    
    if user and hasattr(user, '_created') and user._created:
        # This is a newly created user, ensure they have the student role (default)
        if not user.role or user.role == 'admin':
            user.role = 'student'
            user.is_staff = False
            user.is_superuser = False
            user.save()
    
    return {"user": user}


def get_client_url():
    return getattr(settings, "CLIENT_URL_DEV", "http://localhost:3000")
