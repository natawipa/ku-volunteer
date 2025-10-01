from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Activity, ActivityDeletionRequest
from .serializers import (
    ActivitySerializer,
    ActivityWriteSerializer,
    ActivityDeletionRequestSerializer,
)
from django.utils import timezone
from django.conf import settings


class IsOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'organizer'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', None) == 'admin' or getattr(request.user, 'is_superuser', False)
        )


class ActivityListCreateView(generics.ListCreateAPIView):
    queryset = Activity.objects.all().select_related('organizer_profile', 'organizer_profile__user')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        # Organizers and admins can create activities
        if getattr(self.request.user, 'role', None) not in ('organizer', 'admin') and not self.request.user.is_superuser:
            self.permission_denied(self.request, message='Only organizers or admins can create activities')
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'organizer':
            return self.queryset.all().filter(organizer_profile__user=user)
        if getattr(user, 'role', None) == 'admin' or user.is_superuser:
            return self.queryset.all()
        # Students: see all activities except pending
        return self.queryset.all().exclude(status=Activity.Status.PENDING)


class ActivityListOnlyView(ActivityListCreateView):
    http_method_names = ['get']


class ActivityCreateOnlyView(ActivityListCreateView):
    http_method_names = ['post']


class ActivityRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Activity.objects.all().select_related('organizer_profile', 'organizer_profile__user')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_update(self, serializer):
        instance: Activity = self.get_object()
        user = self.request.user
        if getattr(user, 'role', None) == 'organizer' and instance.organizer_profile.user != user:
            self.permission_denied(self.request, message='Not your activity')
        serializer.save()


class ActivityDetailOnlyView(ActivityRetrieveUpdateView):
    http_method_names = ['get']


class ActivityUpdateOnlyView(ActivityRetrieveUpdateView):
    http_method_names = ['put', 'patch']


class ActivityDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk: int):
        activity = get_object_or_404(Activity, pk=pk)
        user = request.user
        # Admin can always delete
        if getattr(user, 'role', None) == 'admin' or user.is_superuser:
            activity.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Organizer deletion rules
        if getattr(user, 'role', None) != 'organizer' or activity.organizer_profile.user != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        if activity.current_participants == 0:
            activity.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # If participants >= 1, require deletion request
        return Response({
            'detail': 'Participants exist; deletion requires admin approval',
            'requires_admin_for_delete': True
        }, status=status.HTTP_409_CONFLICT)


class ActivityRequestDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk: int):
        activity = get_object_or_404(Activity, pk=pk)
        user = request.user
        if getattr(user, 'role', None) != 'organizer' or activity.organizer_profile.user != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason')
        try:
            req = activity.request_deletion(user, reason)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ActivityDeletionRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class ActivityDeletionRequestListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    queryset = ActivityDeletionRequest.objects.select_related('activity', 'requested_by')
    serializer_class = ActivityDeletionRequestSerializer


class ActivityDeletionRequestReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk: int):
        req = get_object_or_404(ActivityDeletionRequest, pk=pk)
        action = request.data.get('action')  # 'approve' or 'reject'
        note = request.data.get('note', '')
        if action not in ('approve', 'reject'):
            return Response({'detail': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        req.status = 'approved' if action == 'approve' else 'rejected'
        req.review_note = note
        req.reviewed_by = request.user
        req.reviewed_at = timezone.now()
        req.save(update_fields=['status', 'review_note', 'reviewed_by', 'reviewed_at'])
        return Response(ActivityDeletionRequestSerializer(req).data)


class ActivityMetadataView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        groups = getattr(settings, 'ACTIVITY_CATEGORY_GROUPS', None)
        if groups and isinstance(groups, dict):
            # Header-only groups (empty list) are selectable top-level categories
            top_levels = [name for name, items in groups.items() if isinstance(items, (list, tuple)) and not items]
            # Non-empty groups are compound categories with sub-items
            compound = [name for name, items in groups.items() if isinstance(items, (list, tuple)) and items]
            subcategories = {name: list(items) for name, items in groups.items() if name in compound}
            payload = {
                'top_levels': top_levels + compound,  # include umbrella names themselves for first-level selection
                'compound_categories': compound,       # these require choosing from subcategories on the UI
                'subcategories': subcategories,        
                'categories_max': 4,
            }
        else:
            payload = {
                'error': 'Category configuration missing: set ACTIVITY_CATEGORY_GROUPS in settings.',
                'categories_max': 4,
            }
        return Response(payload)
