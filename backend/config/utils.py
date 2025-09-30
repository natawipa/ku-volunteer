"""
Utility functions for the application.
"""
import os
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.core.exceptions import ValidationError


def get_activity_category_groups() -> Dict[str, List[str]]:
    """Get activity category groups from settings with fallback."""
    from config.constants import DEFAULT_ACTIVITY_CATEGORY_GROUPS
    
    return getattr(settings, 'ACTIVITY_CATEGORY_GROUPS', DEFAULT_ACTIVITY_CATEGORY_GROUPS)


def validate_activity_categories(categories: Optional[List[str]]) -> None:
    """
    Validate activity categories against allowed categories.
    
    Args:
        categories: List of category strings to validate
        
    Raises:
        ValidationError: If categories are invalid
    """
    from config.constants import ValidationLimits
    
    if categories is None:
        return
        
    if not isinstance(categories, list):
        raise ValidationError('categories must be a list of strings (1-4).')
        
    if not (ValidationLimits.CATEGORIES_MIN <= len(categories) <= ValidationLimits.CATEGORIES_MAX):
        raise ValidationError(
            f'categories must have between {ValidationLimits.CATEGORIES_MIN} '
            f'and {ValidationLimits.CATEGORIES_MAX} items.'
        )
        
    if not all(isinstance(item, str) and item.strip() for item in categories):
        raise ValidationError('each category must be a non-empty string.')
        
    # Build allowed categories from settings
    groups = get_activity_category_groups()
    allowed = []
    
    if isinstance(groups, dict):
        for name, items in groups.items():
            if isinstance(items, (list, tuple)) and items:
                # Non-empty group: add its items
                allowed.extend([str(x) for x in items])
            elif isinstance(items, (list, tuple)) and not items:
                # Empty group: header itself is selectable
                allowed.append(str(name))
                
    invalid = [cat for cat in categories if cat not in allowed]
    if invalid:
        if not allowed:
            raise ValidationError(
                'Category configuration missing or invalid: '
                'set ACTIVITY_CATEGORY_GROUPS in settings.'
            )
        raise ValidationError(
            f"invalid category(ies): {invalid}. Allowed: {allowed}"
        )


def get_client_url() -> str:
    """Get client URL from environment variables."""
    return os.getenv('CLIENT_URL_DEV', 'http://localhost:3000')


def is_user_role(user: Any, role: str) -> bool:
    """Check if user has a specific role."""
    return getattr(user, 'role', None) == role


def is_admin_user(user: Any) -> bool:
    """Check if user is admin or superuser."""
    from config.constants import UserRoles
    
    return (
        getattr(user, 'role', None) == UserRoles.ADMIN or
        getattr(user, 'is_superuser', False)
    )