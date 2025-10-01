from rest_framework import serializers
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    requires_admin_for_delete = serializers.BooleanField(read_only=True)
    organizer_email = serializers.EmailField(source='organizer.email', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'organizer', 'organizer_email', 'categories', 'title', 'description',
            'start_at', 'end_at', 'location', 'max_participants', 'current_participants',
            'status', 'hours_awarded', 'created_at', 'updated_at',
            'requires_admin_for_delete', 'deletion_requested', 'deletion_reason',
        ]
        read_only_fields = [
            'id', 'organizer', 'organizer_email', 'current_participants', 'status',
            'created_at', 'updated_at', 'requires_admin_for_delete', 'deletion_requested', 'deletion_reason'
        ]


class ActivityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'categories', 'title', 'description', 'start_at', 'end_at', 'location',
            'max_participants', 'hours_awarded'
        ]

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        # organizer set from the authenticated user
        return Activity.objects.create(organizer=user, **validated_data)
