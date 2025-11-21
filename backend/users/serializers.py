from rest_framework import serializers
from .models import User, StudentProfile, OrganizerProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ["student_id_external", "year", "faculty", "major"]


class OrganizerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizerProfile
        fields = ["id", "organization_type", "organization_name"]


class UserSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(required=False, read_only=True)
    organizer_profile = OrganizerProfileSerializer(required=False, read_only=True)

    year = serializers.IntegerField(required=False, write_only=True)
    faculty = serializers.CharField(required=False, write_only=True)
    major = serializers.CharField(required=False, write_only=True)
    organization_type = serializers.CharField(required=False, write_only=True)
    organization_name = serializers.CharField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "title", "first_name", "last_name", "role", "profile_image", "created_at", "updated_at",
                 "profile", "organizer_profile", "year", "faculty", "major", "organization_type", "organization_name"]

    def update(self, instance, validated_data):
        year = validated_data.pop('year', None)
        faculty = validated_data.pop('faculty', None)
        major = validated_data.pop('major', None)
        organization_type = validated_data.pop('organization_type', None)
        organization_name = validated_data.pop('organization_name', None)

        instance = super().update(instance, validated_data)

        # Update student profile
        if instance.role == 'student' and hasattr(instance, 'profile'):
            profile = instance.profile
            if year is not None:
                profile.year = year
            if faculty is not None:
                profile.faculty = faculty
            if major is not None:
                profile.major = major
            profile.save()

        # Update organizer profile
        elif instance.role == 'organizer' and hasattr(instance, 'organizer_profile'):
            organizer_profile = instance.organizer_profile
            if organization_type is not None:
                organizer_profile.organization_type = organization_type
            if organization_name is not None:
                organizer_profile.organization_name = organization_name
            organizer_profile.save()

        return instance

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        organizer_profile_data = validated_data.pop('organizer_profile', None)

        user = User.objects.create(**validated_data)

        if profile_data:
            StudentProfile.objects.create(user=user, **profile_data)

        if organizer_profile_data:
            OrganizerProfile.objects.create(user=user, **organizer_profile_data)

        return user


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

    def validate_password(self, value):
        """Validate password is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Password is required and cannot be empty.")
        return value

    def validate(self, attrs):
        role = attrs.get("role")
        student_id_external = attrs.get("student_id_external")

        if role == "student" and not student_id_external:
            raise serializers.ValidationError({"student_id_external": "This field is required for students."})
        # Ensure student_id_external is unique across StudentProfile
        if role == "student" and student_id_external:
            if StudentProfile.objects.filter(student_id_external=student_id_external).exists():
                raise serializers.ValidationError({"student_id_external": "This student ID is already in use."})
        
        # Ensure email is unique to avoid IntegrityError on create
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({'email': 'A user with this email already exists.'})

        return attrs

    def create(self, validated_data):
        student_id_external = validated_data.pop("student_id_external", None)
        year = validated_data.pop("year", None)
        faculty = validated_data.pop("faculty", None)
        major = validated_data.pop("major", None)
        organization = validated_data.pop("organization", None)
        organization_name = validated_data.pop("organization_name", None)

        password = validated_data.pop("password")
        # Create the user and profile objects. Wrap in try/except to log unexpected errors
        # so that E2E tests produce useful server-side traces for debugging.
        try:
            user = User.objects.create_user(password=password, **validated_data)
        except Exception as e:
            import traceback
            print("[DEBUG] Exception while creating user:", e)
            traceback.print_exc()
            # Re-raise so the normal DRF error handling still applies (returns 500)
            raise

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
