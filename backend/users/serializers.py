from rest_framework import serializers
from .models import User, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ["student_id_external", "year"]


class UserSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ["id", "email", "title", "first_name", "last_name", "role", "created_at", "updated_at", "profile"]


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    student_id_external = serializers.CharField(write_only=True, required=False)
    year = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["email", "password", "title", "first_name", "last_name", "role", "student_id_external", "year"]

    def validate(self, attrs):
        role = attrs.get("role")
        student_id_external = attrs.get("student_id_external")
        if role == "student" and not student_id_external:
            raise serializers.ValidationError({"student_id_external": "This field is required for students."})
        return attrs

    def create(self, validated_data):
        student_id_external = validated_data.pop("student_id_external", None)
        year = validated_data.pop("year", None)
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        if validated_data.get("role") == "student" and student_id_external:
            StudentProfile.objects.create(
                user=user, 
                student_id_external=student_id_external,
                year=year
            )
        return user
