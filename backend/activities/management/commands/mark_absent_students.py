"""
Management command to mark students as absent for completed activities.

This command should be run periodically (e.g., via cron job) to automatically
mark students who didn't check in as absent after activities end.

Usage:
    python manage.py mark_absent_students
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from activities.models import Activity, StudentCheckIn
from config.constants import ActivityStatus


class Command(BaseCommand):
    help = 'Mark students as absent for completed activities where they did not check in'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Process activities that ended within the last N days (default: 7)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        
        now = timezone.now()
        cutoff_date = now - timezone.timedelta(days=days)
        
        # Find completed activities within the specified time range
        completed_activities = Activity.objects.filter(
            status=ActivityStatus.COMPLETE,
            end_at__gte=cutoff_date,
            end_at__lt=now
        )
        
        total_marked = 0
        activities_processed = 0
        
        self.stdout.write(
            self.style.WARNING(f'Processing activities that ended in the last {days} days...')
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        for activity in completed_activities:
            if dry_run:
                # Count how many would be marked
                from django.db.models import Q
                from activities.models import Application
                
                approved_students = Application.objects.filter(
                    activity=activity,
                    status='approved'
                ).values_list('student_id', flat=True)
                
                existing_checkins = StudentCheckIn.objects.filter(
                    activity=activity
                ).values_list('student_id', flat=True)
                
                students_without_checkin = set(approved_students) - set(existing_checkins)
                count = len(students_without_checkin)
                
                if count > 0:
                    self.stdout.write(
                        f'  Would mark {count} students as absent for: {activity.title}'
                    )
                    total_marked += count
                    activities_processed += 1
            else:
                # Actually mark students absent
                count = StudentCheckIn.mark_absent_students(activity)
                
                if count > 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  Marked {count} students as absent for: {activity.title}'
                        )
                    )
                    total_marked += count
                    activities_processed += 1
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'\nDRY RUN: Would mark {total_marked} students as absent '
                    f'across {activities_processed} activities'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nSuccessfully marked {total_marked} students as absent '
                    f'across {activities_processed} activities'
                )
            )
