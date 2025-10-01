from django.contrib import admin
from django import forms
from .models import Activity
from users.models import User


class OrganizerChoiceField(forms.ModelChoiceField):
    def label_from_instance(self, obj: User) -> str:
        fullname = f"{(obj.first_name or '').strip()} {(obj.last_name or '').strip()}".strip()
        return fullname or obj.email


class ActivityAdminForm(forms.ModelForm):
    organizer = OrganizerChoiceField(queryset=User.objects.filter(role='organizer'))

    class Meta:
        model = Activity
        fields = '__all__'


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    form = ActivityAdminForm
    list_display = ('id', 'title', 'organizer', 'status', 'start_at', 'end_at', 'created_at')
    list_filter = ('status', 'start_at', 'end_at', 'created_at')
    search_fields = ('title', 'description', 'location', 'organizer__email')
