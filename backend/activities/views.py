from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Activity
from .serializers import ActivitySerializer, ActivityWriteSerializer


class IsOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'organizer'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', None) == 'admin' or getattr(request.user, 'is_superuser', False)
        )


class ActivityListCreateView(generics.ListCreateAPIView):
    queryset = Activity.objects.all().select_related('organizer')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        # Only organizers create activities
        if getattr(self.request.user, 'role', None) != 'organizer':
            self.permission_denied(self.request, message='Only organizers can create activities')
        serializer.save()

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == 'organizer':
            return self.queryset.filter(organizer=user)
        if getattr(user, 'role', None) == 'admin' or user.is_superuser:
            return self.queryset
        # Students see open activities only (optional, can be adjusted later)
        return self.queryset.filter(status=Activity.Status.OPEN)


class ActivityRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Activity.objects.all().select_related('organizer')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ActivityWriteSerializer
        return ActivitySerializer

    def perform_update(self, serializer):
        instance: Activity = self.get_object()
        user = self.request.user
        if getattr(user, 'role', None) == 'organizer' and instance.organizer != user:
            self.permission_denied(self.request, message='Not your activity')
        serializer.save()


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
        if getattr(user, 'role', None) != 'organizer' or activity.organizer != user:
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
        if getattr(user, 'role', None) != 'organizer' or activity.organizer != user:
            return Response({'detail': 'Not allowed'}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason')
        try:
            activity.request_deletion(user, reason)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ActivitySerializer(activity).data, status=status.HTTP_200_OK)
