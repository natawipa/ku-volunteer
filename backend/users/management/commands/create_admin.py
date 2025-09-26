from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Create admin account'

    def handle(self, *args, **options):
        email = 'admin@ku.th'
        password = 'admin123'
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'Admin user with email {email} already exists')
            )
            return
        
        admin_user = User.objects.create_superuser(
            email=email,
            password=password,
            title='Mr.',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created admin user:\n'
                f'Email: {email}\n'
                f'Password: {password}'
            )
        )