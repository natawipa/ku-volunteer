from django.conf import settings
from django.shortcuts import redirect
from .models import User

# Check that user email exist in database
# If not, redirect to frontend register page
# If yes, allow to continue the pipeline
def require_existing_user(strategy, details, backend, user=None, *args, **kwargs):
    """
    If the social user isn't already associated and no matching user is found, redirect to frontend register.
    Allows existing users (matched by email) to proceed and be associated.
    """
    if user:
        # Already authenticated or found by previous pipeline step
        return {"user": user}

    email = (details or {}).get("email")
    if not email:
        # No email provided by provider; treat as new and send to role selection
        return strategy.redirect(f"{get_client_url()}/role")

    try:
        existing = User.objects.get(email=email)
        return {"user": existing}
    except User.DoesNotExist:
        # Send them to role selection page with prefilled email
        return strategy.redirect(f"{get_client_url()}/role?email={email}")


def get_client_url():
    return getattr(settings, "CLIENT_URL_DEV", "http://localhost:3000")
