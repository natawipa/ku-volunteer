from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, StudentProfile, OrganizerProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('title', 'first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'role')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'title', 'first_name', 'last_name', 'role', 'is_staff'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'student_id_external', 'year', 'faculty', 'major']
    search_fields = ['user__email', 'student_id_external']
    list_filter = ['year']


@admin.register(OrganizerProfile)
class OrganizerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization_type', 'organization_name']
    search_fields = ['user__email', 'organization_name']
