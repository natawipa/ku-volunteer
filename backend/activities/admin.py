from django.contrib import admin
from django import forms
from django.conf import settings
from .models import Activity, ActivityDeletionRequest, Application
from users.models import OrganizerProfile


class OrganizerProfileChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj: OrganizerProfile) -> str:
        # Show only the organization name in the dropdown
        return (obj.organization_name or '').strip() or '(Unnamed organization)'


class ActivityAdminForm(forms.ModelForm):
    organizer_profile = OrganizerProfileChoiceField(
        queryset=OrganizerProfile.objects.select_related('user').order_by('organization_name').distinct('organization_name')
    )
    categories = forms.MultipleChoiceField(
        required=False,
        choices=(),
        widget=forms.CheckboxSelectMultiple,
        help_text='Select up to 4 categories'
    )

    class Meta:
        model = Activity
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        groups = getattr(settings, 'ACTIVITY_CATEGORY_GROUPS', None)
        if groups and isinstance(groups, dict):
            # Build choices with optgroups for non-empty groups and add header-only
            # groups as top-level options
            grouped_choices = []
            top_level_options = []
            for group_label, items in groups.items():
                items = items or []
                if not items:
                    # header-only selectable
                    top_level_options.append((group_label, group_label))
                else:
                    options = [(str(i), str(i)) for i in items]
                    grouped_choices.append((group_label, options))
            # Combine: top-level options first, then grouped sections
            self.fields['categories'].choices = top_level_options + grouped_choices
        else:
            # No fallback: model only accepts categories from ACTIVITY_CATEGORY_GROUPS
            self.fields['categories'].choices = []
            self.fields['categories'].help_text = (
                'No categories configured. Please set ACTIVITY_CATEGORY_GROUPS in settings.'
            )
        # If instance exists, prefill
        if self.instance and isinstance(self.instance.categories, list):
            self.initial['categories'] = self.instance.categories

    def clean_categories(self):
        value = self.cleaned_data.get('categories') or []
        # Ensure list and enforce max 4 (model validator will also check)
        value = list(value)
        if len(value) > 4:
            raise forms.ValidationError('Select at most 4 categories')
        return value


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    form = ActivityAdminForm
    list_display = ('id', 'title', 'get_organizer_name', 'status', 'current_participants', 'max_participants', 'start_at', 'end_at', 'created_at')
    list_filter = ('status', 'start_at', 'end_at', 'created_at')
    search_fields = (
        'title', 'description', 'location',
        'organizer_profile__organization_name', 'organizer_profile__user__email'
    )

    # Show system fields as read-only
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic info', {
            'fields': (
                'organizer_profile', 'title', 'description', 'categories', 'location'
            )
        }),
        ('Timing', {
            'fields': ('start_at', 'end_at')
        }),
        ('Capacity & status', {
            'fields': ('max_participants', 'current_participants', 'hours_awarded', 'status')
        }),
        ('Metadata', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at')
        }),
    )

    def get_organizer_name(self, obj: Activity):
        prof = obj.organizer_profile
        if not prof:
            return '-'
        return prof.organization_name or '-'
    get_organizer_name.short_description = 'Organizer'


@admin.register(ActivityDeletionRequest)
class ActivityDeletionRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'activity', 'status', 'requested_by', 'requested_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'requested_at', 'reviewed_at')
    search_fields = ('activity__title', 'reason', 'requested_by__email', 'reviewed_by__email')
    readonly_fields = ('requested_at',)

    fields = (
        'activity',
        'reason',
        'status',
        'review_note',
        'requested_by',
        'requested_at',
        'reviewed_by',
        'reviewed_at',
    )

    actions = ['approve_requests', 'reject_requests']

    def approve_requests(self, request, queryset):
        updated = queryset.update(status='approved', reviewed_by=request.user, reviewed_at=None)
        self.message_user(request, f"Approved {updated} deletion request(s).")

    def reject_requests(self, request, queryset):
        updated = queryset.update(status='rejected', reviewed_by=request.user, reviewed_at=None)
        self.message_user(request, f"Rejected {updated} deletion request(s).")

    approve_requests.short_description = 'Approve selected requests'
    reject_requests.short_description = 'Reject selected requests'


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'get_student_email', 'get_student_name', 'get_activity_title',
        'status', 'submitted_at', 'decision_at', 'get_decision_by_email'
    )
    list_filter = ('status', 'submitted_at', 'decision_at')
    search_fields = (
        'student__email', 'student__first_name', 'student__last_name',
        'activity__title', 'notes', 'decision_by__email'
    )
    readonly_fields = ('submitted_at',)
    
    fieldsets = (
        ('Application Info', {
            'fields': ('activity', 'student', 'status')
        }),
        ('Decision', {
            'fields': ('decision_at', 'decision_by', 'notes')
        }),
        ('Metadata', {
            'classes': ('collapse',),
            'fields': ('submitted_at',)
        }),
    )
    
    def get_student_email(self, obj: Application):
        return obj.student.email if obj.student else '-'
    get_student_email.short_description = 'Student Email'
    get_student_email.admin_order_field = 'student__email'
    
    def get_student_name(self, obj: Application):
        if obj.student and obj.student.first_name and obj.student.last_name:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return '-'
    get_student_name.short_description = 'Student Name'
    
    def get_activity_title(self, obj: Application):
        return obj.activity.title if obj.activity else '-'
    get_activity_title.short_description = 'Activity'
    get_activity_title.admin_order_field = 'activity__title'
    
    def get_decision_by_email(self, obj: Application):
        return obj.decision_by.email if obj.decision_by else '-'
    get_decision_by_email.short_description = 'Decided By'
    get_decision_by_email.admin_order_field = 'decision_by__email'
