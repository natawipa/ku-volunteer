from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from config.constants import ActivityStatus, StatusMessages, UserRoles
from config.permissions import IsAdmin
from config.utils import get_activity_category_groups, is_admin_user
from .models import Activity, ActivityDeletionRequest
from .serializers import (
    ActivityDeletionRequestSerializer,
    ActivitySerializer,
    ActivityWriteSerializer,
)


class ActivityListCreateView(generics.ListCreateAPIView):
    """API view for listing and creating activities."""

    queryset = Activity.objects.all().select_related(
        'organizer_profile', 'organizer_profile__user'
    )
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

        if (user_role not in (UserRoles.ORGANIZER, UserRoles.ADMIN) and
                not user.is_superuser):
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
            # Get user's organization name from their organizer profile
            try:
                organizer_profile = user.organizer_profile
                organization_name = organizer_profile.organization_name
                # Show all activities from the same organization
                return self.queryset.filter(
                    organizer_profile__organization_name=organization_name
                )
            except AttributeError:
                # If no organizer profile found, show no activities
                return self.queryset.none()
        if is_admin_user(user):
            return self.queryset.all()
        # Students: see all activities except pending
        return self.queryset.exclude(status=ActivityStatus.PENDING)


class ActivityListOnlyView(ActivityListCreateView):
    """API view for listing activities only."""
    http_method_names = ['get']
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """Filter queryset based on user authentication and role."""
        # If user is not authenticated, show only open activities
        if not self.request.user.is_authenticated:
            return self.queryset.filter(status=ActivityStatus.OPEN)

        # For authenticated users, use the parent logic
        return super().get_queryset()


class ActivityCreateOnlyView(ActivityListCreateView):
    """API view for creating activities only."""
    http_method_names = ['post']


class ActivityRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    """API view for retrieving and updating activities."""

    queryset = Activity.objects.all().select_related(
        'organizer_profile', 'organizer_profile__user'
    )
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

        # Check if organizer belongs to same organization
        if user_role == UserRoles.ORGANIZER:
            try:
                user_org_name = user.organizer_profile.organization_name
                activity_org_name = instance.organizer_profile.organization_name
                if user_org_name != activity_org_name:
                    self.permission_denied(
                        self.request,
                        message=StatusMessages.NOT_YOUR_ACTIVITY
                    )
            except AttributeError:
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

        # Organizer deletion rules - check if user belongs to same organization
        if user_role != UserRoles.ORGANIZER:
            return Response(
                {'detail': StatusMessages.PERMISSION_DENIED},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user_org_name = user.organizer_profile.organization_name
            activity_org_name = activity.organizer_profile.organization_name
            if user_org_name != activity_org_name:
                return Response(
                    {'detail': StatusMessages.PERMISSION_DENIED},
                    status=status.HTTP_403_FORBIDDEN
                )
        except AttributeError:
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

        # Check if user is organizer and belongs to same organization
        if user_role != UserRoles.ORGANIZER:
            return Response(
                {'detail': StatusMessages.PERMISSION_DENIED},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user_org_name = user.organizer_profile.organization_name
            activity_org_name = activity.organizer_profile.organization_name
            if user_org_name != activity_org_name:
                return Response(
                    {'detail': StatusMessages.PERMISSION_DENIED},
                    status=status.HTTP_403_FORBIDDEN
                )
        except AttributeError:
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
    queryset = ActivityDeletionRequest.objects.select_related(
        'activity', 'requested_by'
    )
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
            if not (note or '').strip():
                return Response(
                    {'detail': 'Rejection note (reason) is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            deletion_request.reject(request.user, note)

        return Response(
            ActivityDeletionRequestSerializer(deletion_request).data
        )


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
                'top_levels': top_levels + compound,
                'compound_categories': compound,
                'subcategories': subcategories,
                'categories_max': 4,
            }
        else:
            payload = {
                'error': (
                    'Category configuration missing: '
                    'set ACTIVITY_CATEGORY_GROUPS in settings.'
                ),
                'categories_max': 4,
            }
        return Response(payload)


class ActivityModerationListView(generics.ListAPIView):
    """List pending activities for admin moderation."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = ActivitySerializer

    def get_queryset(self):
        return Activity.objects.filter(
            status=ActivityStatus.PENDING
        ).select_related('organizer_profile', 'organizer_profile__user')


class ActivityModerationReviewView(APIView):
    """Approve or reject an activity (admin only)."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request: Request, pk: int) -> Response:
        activity = get_object_or_404(Activity, pk=pk)
        action = request.data.get('action')  # 'approve' or 'reject'
        if action not in ('approve', 'reject'):
            return Response(
                {'detail': StatusMessages.INVALID_ACTION},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only allow moderation from pending
        if activity.status != ActivityStatus.PENDING:
            return Response(
                {'detail': 'Only pending activities can be moderated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == 'approve':
            activity.status = ActivityStatus.OPEN
            activity.rejection_reason = ''
            activity.save(update_fields=['status', 'rejection_reason'])
            return Response({'detail': 'Activity set to open.'})
        else:
            reason = (request.data.get('reason') or '').strip()
            if not reason:
                return Response(
                    {'detail': 'Rejection reason is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            activity.status = ActivityStatus.REJECTED
            activity.rejection_reason = reason
            activity.save(update_fields=['status', 'rejection_reason'])
            return Response(
                {'detail': 'Activity rejected with reason provided.'}
            )
