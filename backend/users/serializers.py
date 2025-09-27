from rest_framework import serializers
from .models import User, StudentProfile, OrganizerProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ["student_id_external", "year", "faculty", "major"]


class OrganizerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizerProfile
        fields = ["organization_type", "organization_name"]


class UserSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(required=False)
    organizer_profile = OrganizerProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["id", "email", "title", "first_name", "last_name", "role", "created_at", "updated_at", "profile", "organizer_profile"]


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Student fields
    student_id_external = serializers.CharField(write_only=True, required=False)
    year = serializers.IntegerField(write_only=True, required=False)
    faculty = serializers.CharField(write_only=True, required=False)
    major = serializers.CharField(write_only=True, required=False)
    # Organizer fields
    organization = serializers.CharField(write_only=True, required=False)
    organization_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["email", "password", "title", "first_name", "last_name", "role", 
                 "student_id_external", "year", "faculty", "major",
                 "organization", "organization_name"]

    def validate(self, attrs):
        role = attrs.get("role")
        student_id_external = attrs.get("student_id_external")
        
        if role == "student" and not student_id_external:
            raise serializers.ValidationError({"student_id_external": "This field is required for students."})
            
        return attrs

    def create(self, validated_data):
        student_id_external = validated_data.pop("student_id_external", None)
        year = validated_data.pop("year", None)
        faculty = validated_data.pop("faculty", None)
        major = validated_data.pop("major", None)
        organization = validated_data.pop("organization", None)
        organization_name = validated_data.pop("organization_name", None)
        
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create student profile
        if validated_data.get("role") == "student" and student_id_external:
            StudentProfile.objects.create(
                user=user, 
                student_id_external=student_id_external,
                year=year,
                faculty=faculty,
                major=major
            )
        
        # Create organizer profile
        elif validated_data.get("role") == "organizer":
            organization_type = None
            if organization == "Kasetsart University":
                organization_type = "internal"
            elif organization == "External Organization":
                organization_type = "external"
                
            OrganizerProfile.objects.create(
                user=user,
                organization_type=organization_type,
                organization_name=organization_name
            )
            
        return user
