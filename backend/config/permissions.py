"""
Shared permission classes for the application.
"""
from typing import Any

from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView

from config.constants import UserRoles


class IsStudent(BasePermission):
    """Permission class to check if user is a student."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == UserRoles.STUDENT
        )


class IsOrganizer(BasePermission):
    """Permission class to check if user is an organizer."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == UserRoles.ORGANIZER
        )


class IsAdmin(BasePermission):
    """Permission class to check if user is an admin."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        return (
            request.user.is_authenticated and (
                getattr(request.user, 'role', None) == UserRoles.ADMIN or
                getattr(request.user, 'is_superuser', False)
            )
        )


class IsOrganizerOrAdmin(BasePermission):
    """Permission class to check if user is an organizer or admin."""
    
    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user.is_authenticated:
            return False
            
        user_role = getattr(request.user, 'role', None)
        return (
            user_role in (UserRoles.ORGANIZER, UserRoles.ADMIN) or
            getattr(request.user, 'is_superuser', False)
        )


class IsOwnerOrAdmin(BasePermission):
    """Permission class to check if user owns the object or is admin."""
    
    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        # Admin can access any object
        if (getattr(request.user, 'role', None) == UserRoles.ADMIN or 
            getattr(request.user, 'is_superuser', False)):
            return True
            
        # Owner can access their own object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'organizer_profile'):
            return obj.organizer_profile.user == request.user
            
        return obj == request.user