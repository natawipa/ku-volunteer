from typing import Any

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from config.constants import ActivityStatus, StatusMessages, UserRoles
from config.permissions import IsAdmin, IsOrganizer
from config.utils import get_activity_category_groups, is_admin_user
from .models import Activity, ActivityDeletionRequest
from .serializers import (
    ActivityDeletionRequestSerializer,
    ActivitySerializer,
    ActivityWriteSerializer,
)


class ActivityListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating activities."""
    
    queryset = Activity.objects.all().select_related('organizer_profile', 'organizer_profile__user')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method == 'POST':
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_create(self, serializer: ActivityWriteSerializer) -> None:
        """Create activity with proper authorization."""
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        if user_role not in (UserRoles.ORGANIZER, UserRoles.ADMIN) and not user.is_superuser:
            self.permission_denied(
                self.request, 
                message='Only organizers or admins can create activities'
            )
        serializer.save()

    def get_queryset(self):
        """Filter queryset based on user role."""
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        if user_role == UserRoles.ORGANIZER:
            return self.queryset.filter(organizer_profile__user=user)
        if is_admin_user(user):
            return self.queryset.all()
        # Students: see all activities except pending
        return self.queryset.exclude(status=ActivityStatus.PENDING)


class ActivityListOnlyView(ActivityListCreateView):
    """API view for listing activities only."""
    http_method_names = ['get']


class ActivityCreateOnlyView(ActivityListCreateView):
    """API view for creating activities only."""
    http_method_names = ['post']


class ActivityRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """API view for retrieving and updating activities."""
    
    queryset = Activity.objects.all().select_related('organizer_profile', 'organizer_profile__user')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ('PUT', 'PATCH'):
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_update(self, serializer: ActivityWriteSerializer) -> None:
        """Update activity with proper authorization."""
        instance: Activity = self.get_object()
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        if (user_role == UserRoles.ORGANIZER and 
            instance.organizer_profile.user != user):
            self.permission_denied(
                self.request, 
                message=StatusMessages.NOT_YOUR_ACTIVITY
            )
        serializer.save()


class ActivityDetailOnlyView(ActivityRetrieveUpdateView):
    """API view for retrieving activity details only."""
    http_method_names = ['get']


class ActivityUpdateOnlyView(ActivityRetrieveUpdateView):
    """API view for updating activities only."""
    http_method_names = ['put', 'patch']


class ActivityDeleteView(APIView):
    """API view for deleting activities."""
    
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request: Request, pk: int) -> Response:
        """Delete activity with proper authorization and business rules."""
        activity = get_object_or_404(Activity, pk=pk)
        user = request.user
        user_role = getattr(user, 'role', None)
        
        # Admin can always delete
        if is_admin_user(user):
            activity.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Organizer deletion rules
        if (user_role != UserRoles.ORGANIZER or 
            activity.organizer_profile.user != user):
            return Response(
                {'detail': StatusMessages.PERMISSION_DENIED}, 
                status=status.HTTP_403_FORBIDDEN
            )

        if activity.current_participants == 0:
            activity.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # If participants >= 1, require deletion request
        return Response({
            'detail': StatusMessages.DELETION_REQUIRES_ADMIN,
            'requires_admin_for_delete': True
        }, status=status.HTTP_409_CONFLICT)


class ActivityRequestDeleteView(APIView):
    """API view for requesting activity deletion."""
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        """Create a deletion request for an activity."""
        activity = get_object_or_404(Activity, pk=pk)
        user = request.user
        user_role = getattr(user, 'role', None)
        
        if (user_role != UserRoles.ORGANIZER or 
            activity.organizer_profile.user != user):
            return Response(
                {'detail': StatusMessages.PERMISSION_DENIED}, 
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get('reason')
        try:
            deletion_request = activity.request_deletion(user, reason)
        except Exception as e:
            return Response(
                {'detail': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(
            ActivityDeletionRequestSerializer(deletion_request).data, 
            status=status.HTTP_201_CREATED
        )


class ActivityDeletionRequestListView(generics.ListAPIView):
    """API view for listing activity deletion requests (admin only)."""
    
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = ActivityDeletionRequest.objects.select_related('activity', 'requested_by')
    serializer_class = ActivityDeletionRequestSerializer


class ActivityDeletionRequestReviewView(APIView):
    """API view for reviewing activity deletion requests (admin only)."""
    
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request: Request, pk: int) -> Response:
        """Review (approve or reject) a deletion request."""
        deletion_request = get_object_or_404(ActivityDeletionRequest, pk=pk)
        action = request.data.get('action')  # 'approve' or 'reject'
        note = request.data.get('note', '')
        
        if action not in ('approve', 'reject'):
            return Response(
                {'detail': StatusMessages.INVALID_ACTION}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if action == 'approve':
            deletion_request.approve(request.user, note)
        else:
            deletion_request.reject(request.user, note)
        
        return Response(ActivityDeletionRequestSerializer(deletion_request).data)


class ActivityMetadataView(APIView):
    """API view for activity metadata (categories, etc.)."""
    
    permission_classes = [permissions.AllowAny]

    def get(self, request: Request) -> Response:
        """Return activity category configuration and metadata."""
        groups = get_activity_category_groups()
        
        if groups and isinstance(groups, dict):
            # Header-only groups (empty list) are selectable top-level categories
            top_levels = [
                name for name, items in groups.items() 
                if isinstance(items, (list, tuple)) and not items
            ]
            # Non-empty groups are compound categories with sub-items
            compound = [
                name for name, items in groups.items() 
                if isinstance(items, (list, tuple)) and items
            ]
            subcategories = {
                name: list(items) for name, items in groups.items() 
                if name in compound
            }
            payload = {
                'top_levels': top_levels + compound,  # include umbrella names for selection
                'compound_categories': compound,       # require choosing from subcategories
                'subcategories': subcategories,        
                'categories_max': 4,
            }
        else:
            payload = {
                'error': 'Category configuration missing: set ACTIVITY_CATEGORY_GROUPS in settings.',
                'categories_max': 4,
            }
        return Response(payload)
