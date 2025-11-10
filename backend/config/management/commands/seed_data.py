from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from activities.models import Activity, Application
from users.models import OrganizerProfile
from config.constants import DEFAULT_ACTIVITY_CATEGORY_GROUPS
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with sample data: 2 students, 3 organizers (2 same organization), 1 admin, and 5 activities per organizer'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        self.stdout.write('Clearing existing data...')
        Activity.objects.all().delete()
        User.objects.all().delete()
        
        # Create Admin
        self.stdout.write('Creating admin...')
        admin = User.objects.create_user(
            email='admin@ku.th',
            password='admin123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        self.stdout.write(self.style.SUCCESS(f'✓ Created admin: {admin.email}'))
        
        # Create 25 Students for testing (enough to fill all activity slots)
        self.stdout.write('\nCreating students...')
        students = []
        
        # Thai first names and last names for variety
        first_names = ['Somchai', 'Suda', 'Apinya', 'Nattapong', 'Pornpimon', 'Wuttichai', 
                       'Kanokwan', 'Thanaporn', 'Siriporn', 'Pattarapong', 'Chalida', 
                       'Worawut', 'Rattana', 'Sombat', 'Manee', 'Preecha', 'Anchalee',
                       'Surachai', 'Nutthida', 'Krittin', 'Panida', 'Pongsak', 'Chutima',
                       'Narong', 'Supaporn']
        last_names = ['Jaidee', 'Kaewta', 'Srisawat', 'Boonsong', 'Chantima', 'Thongchai',
                      'Siriporn', 'Rattanakosin', 'Phongphan', 'Wattana', 'Kongkaew',
                      'Sukhum', 'Pongsakorn', 'Rattanakorn', 'Somchai', 'Boonruang',
                      'Prasert', 'Mongkol', 'Saengthong', 'Vimonrat', 'Kitsiri',
                      'Suksamran', 'Chaiwong', 'Thammasat', 'Bundit']
        
        for i in range(25):
            student_data = {
                'email': f'student{i+1}@ku.th',
                'password': 'student123',
                'first_name': first_names[i],
                'last_name': last_names[i],
                'student_id': f'65104500{i+1:02d}',  # 6510450001 to 6510450025
                'student_year': (i % 4) + 1,  # Years 1-4
                'phone_number': f'08{12345678 + i}'
            }
            
            student = User.objects.create_user(
                email=student_data['email'],
                password=student_data['password'],
                first_name=student_data['first_name'],
                last_name=student_data['last_name'],
                role='student'
            )
            # Update student-specific fields after creation
            student.student_id = student_data['student_id']
            student.student_year = student_data['student_year']
            student.phone_number = student_data['phone_number']
            student.save()
            students.append(student)
            self.stdout.write(self.style.SUCCESS(f'✓ Created student: {student.email} ({student.student_id})'))
        
        # Create 3 Organizers (2 from same organization, 1 from different organization)
        self.stdout.write('\nCreating organizers...')
        organizers = []
        
        # First organizer from Green Earth Foundation
        org1 = User.objects.create_user(
            email='john.g@greenearth.org',
            password='organizer123',
            first_name='John',
            last_name='Green',
            role='organizer'
        )
        org1.profile_id = 'ORG001'
        org1.organization_name = 'Green Earth Foundation'
        org1.phone_number = '0891234567'
        org1.save()
        # Create organizer profile
        OrganizerProfile.objects.create(
            user=org1,
            organization_name='Green Earth Foundation',
            organization_type='nonprofit'
        )
        organizers.append(org1)
        self.stdout.write(self.style.SUCCESS(f'✓ Created organizer: {org1.first_name} {org1.last_name} ({org1.email}) - {org1.organization_name}'))
        
        # Second organizer from same organization (Green Earth Foundation)
        org2 = User.objects.create_user(
            email='sarah.eco@greenearth.org',
            password='organizer123',
            first_name='Sarah',
            last_name='Eco',
            role='organizer'
        )
        org2.profile_id = 'ORG001'  # Same organization as org1
        org2.organization_name = 'Green Earth Foundation'  # Same organization name
        org2.phone_number = '0892345678'
        org2.save()
        # Create organizer profile (same organization)
        OrganizerProfile.objects.create(
            user=org2,
            organization_name='Green Earth Foundation',
            organization_type='nonprofit'
        )
        organizers.append(org2)
        self.stdout.write(self.style.SUCCESS(f'✓ Created organizer: {org2.first_name} {org2.last_name} ({org2.email}) - {org2.organization_name} ⚠️  Same organization'))
        
        # Third organizer from different organization
        org3 = User.objects.create_user(
            email='david@techforgood.org',
            password='organizer123',
            first_name='David',
            last_name='Tech',
            role='organizer'
        )
        org3.profile_id = 'ORG002'
        org3.organization_name = 'Tech For Good'
        org3.phone_number = '0893456789'
        org3.save()
        # Create organizer profile
        OrganizerProfile.objects.create(
            user=org3,
            organization_name='Tech For Good',
            organization_type='company'
        )
        organizers.append(org3)
        self.stdout.write(self.style.SUCCESS(f'✓ Created organizer: {org3.first_name} {org3.last_name} ({org3.email}) - {org3.organization_name}'))
        
        # Create 5 activities for each organizer with different statuses
        self.stdout.write('\nCreating activities...')
        
        # Get all categories from DEFAULT_ACTIVITY_CATEGORY_GROUPS
        categories = []
        for group_name, group_categories in DEFAULT_ACTIVITY_CATEGORY_GROUPS.items():
            if group_categories:  # If the group has categories
                categories.extend(group_categories)
            else:  # If the group is empty, use the group name itself
                categories.append(group_name)
        
        # Volunteer-focused activity types
        activity_types = [
            'Community Clean-up Volunteer',
            'Tree Planting Volunteer',
            'Teaching Volunteer for Underprivileged Children',
            'Blood Donation Volunteer',
            'Food Distribution Volunteer',
            'Environmental Conservation Volunteer',
            'Elder Care Volunteer',
            'Animal Shelter Volunteer',
            'Library Reading Volunteer',
            'Community Garden Volunteer'
        ]
        
        # Define different date scenarios for each activity status
        # Activity statuses: 'pending', 'approved', 'rejected', 'open', 'upcoming', 'during', 'complete', 'full', 'cancelled'
        now = datetime.now()
        
        activity_scenarios = [
            # Activity 0: COMPLETE (ended in the past) - 100% filled
            {
                'status': 'complete',
                'start_at': now - timedelta(days=30),
                'end_at': now - timedelta(days=30, hours=-5),
                'max_participants': 16,  # Will create 16 approved students
            },
            # Activity 1: DURING (currently happening) - 100% filled
            {
                'status': 'during',
                'start_at': now - timedelta(hours=2),
                'end_at': now + timedelta(hours=4),
                'max_participants': 21,  # Will create 21 approved students
            },
            # Activity 2: UPCOMING (starts within 7 days) - 50% capacity + pending
            {
                'status': 'upcoming',
                'start_at': now + timedelta(days=3),
                'end_at': now + timedelta(days=3, hours=6),
                'max_participants': 25,
            },
            # Activity 3: OPEN (starts more than 7 days away) - 30% capacity + pending
            {
                'status': 'open',
                'start_at': now + timedelta(days=20),
                'end_at': now + timedelta(days=20, hours=8),
                'max_participants': 40,
            },
            # Activity 4: FULL (reached max participants) - 100% capacity
            {
                'status': 'full',
                'start_at': now + timedelta(days=10),
                'end_at': now + timedelta(days=10, hours=5),
                'max_participants': 15,
            },
        ]
        
        activity_count = 0
        organizer_activity_map = {}  # Track activities by organization profile_id
        
        for organizer in organizers:
            # Check if this organization already has activities
            if organizer.profile_id in organizer_activity_map:
                # Same organization - don't create new activities, just log
                self.stdout.write(f'\n  {organizer.first_name} {organizer.last_name} shares activities with same organization (Profile ID: {organizer.profile_id})')
                continue
            
            # Create activities for this organization
            self.stdout.write(f'\n  Activities created for {organizer.organization_name} (Profile ID: {organizer.profile_id}):')
            org_activities = []
            
            for i in range(5):
                scenario = activity_scenarios[i]
                
                # Random location in Bangkok area
                locations = [
                    'Kasetsart University, Bangkok',
                    'Chatuchak Park, Bangkok',
                    'Lumpini Park, Bangkok',
                    'Chulalongkorn University',
                    'Siam Square',
                    'Bang Krachao, Samut Prakan',
                    'Rama 9 Park',
                    'Benjakitti Park'
                ]
                
                activity_name = random.choice(activity_types)
                activity = Activity.objects.create(
                    title=f'{activity_name} - {organizer.organization_name}',
                    description=f'Join us for an amazing {activity_name.lower()} event organized by {organizer.first_name} {organizer.last_name} from {organizer.organization_name}! This activity aims to make a positive impact on our community.',
                    location=random.choice(locations),
                    start_at=scenario['start_at'],
                    end_at=scenario['end_at'],
                    max_participants=scenario['max_participants'],
                    current_participants=0,  # Will be updated after creating applications
                    categories=random.sample(categories, k=random.randint(1, 3)),
                    status=scenario['status'],
                    organizer_profile=organizer.organizer_profile,
                )
                activity_count += 1
                org_activities.append(activity)
                self.stdout.write(self.style.SUCCESS(f'  ✓ {activity.title} (Start: {scenario["start_at"].strftime("%Y-%m-%d %H:%M")}, End: {scenario["end_at"].strftime("%Y-%m-%d %H:%M")})'))
            
            # Store activities for this organization
            organizer_activity_map[organizer.profile_id] = org_activities
        
        # Create applications for ALL activities with capacity
        self.stdout.write('\nCreating student applications for activities...')
        all_activities = Activity.objects.all().order_by('id')
        application_count = 0
        student_index = 0  # Track which student to assign next
        
        for activity in all_activities:
            if activity.max_participants and activity.max_participants > 0:
                # Determine number of applications based on activity status
                if activity.status == 'full':
                    # FULL: All slots filled with approved students (no pending)
                    num_approved = activity.max_participants
                    num_pending = 0
                elif activity.status == 'complete':
                    # COMPLETE: 100% capacity filled (activity already happened)
                    num_approved = activity.max_participants
                    num_pending = 0  # No pending for completed activities
                elif activity.status == 'during':
                    # DURING: 100% capacity filled (activity is happening now)
                    num_approved = activity.max_participants
                    num_pending = 0  # Can't apply to an activity that's currently happening
                elif activity.status == 'upcoming':
                    # UPCOMING: Has approved students (40-60% capacity) + some pending
                    num_approved = int(activity.max_participants * 0.5)
                    num_pending = min(5, activity.max_participants - num_approved)
                elif activity.status == 'open':
                    # OPEN: Has some approved students (20-40% capacity) + some pending
                    num_approved = int(activity.max_participants * 0.3)
                    num_pending = min(5, activity.max_participants - num_approved)
                else:
                    # Other statuses: skip
                    continue
                
                # Create approved applications
                for _ in range(num_approved):
                    # Use get_or_create to avoid duplicate applications
                    app, created = Application.objects.get_or_create(
                        activity=activity,
                        student=students[student_index % len(students)],
                        defaults={
                            'activity_title': activity.title,
                            'activity_id_stored': activity.id,
                            'status': 'approved',
                            'decision_at': timezone.now()
                        }
                    )
                    if created:
                        application_count += 1
                    student_index += 1
                
                # Update current_participants to match number of approved students
                activity.current_participants = num_approved
                
                # Save the intended status after updating participants
                # to prevent auto_update_status from overriding time-based statuses with FULL
                intended_status = activity.status
                activity.save()
                
                # Restore the intended status if it was changed to FULL by auto_update_status
                # Time-based statuses (complete, during) should take priority over capacity-based (full)
                if activity.status == 'full' and intended_status in ['complete', 'during']:
                    activity.status = intended_status
                    activity.save(update_fields=['status'])
                
                # Create pending applications
                for _ in range(num_pending):
                    # Use get_or_create to avoid duplicate applications
                    app, created = Application.objects.get_or_create(
                        activity=activity,
                        student=students[student_index % len(students)],
                        defaults={
                            'activity_title': activity.title,
                            'activity_id_stored': activity.id,
                            'status': 'pending'
                        }
                    )
                    if created:
                        application_count += 1
                    student_index += 1
                
                status_label = f"{activity.status.upper()}: {num_approved} approved"
                if num_pending > 0:
                    status_label += f" + {num_pending} pending"
                self.stdout.write(self.style.SUCCESS(f'  ✓ {activity.title[:50]}... - {status_label}'))
        
        # Summary
        self.stdout.write('\n' + '='*80)
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!\n'))
        self.stdout.write(self.style.WARNING('Summary:'))
        self.stdout.write(f'  • 1 Admin: admin@ku.th (password: admin123)')
        self.stdout.write(f'\n  • 25 Students:')
        self.stdout.write(f'    - student1@ku.th to student25@ku.th (password: student123)')
        self.stdout.write(f'    - Student IDs: 6510450001 to 6510450025')
        self.stdout.write(f'    - Years: 1-4 (rotating)')
        self.stdout.write(f'\n  • 3 Organizer Accounts (2 Organizations):')
        self.stdout.write(f'    📁 Green Earth Foundation (Profile ID: ORG001):')
        self.stdout.write(f'       - John Green (john.g@greenearth.org, password: organizer123)')
        self.stdout.write(f'       - Sarah Eco (sarah.eco@greenearth.org, password: organizer123)')
        self.stdout.write(f'       → Both share the same 5 activities')
        self.stdout.write(f'    📁 Tech For Good (Profile ID: ORG002):')
        self.stdout.write(f'       - David Tech (david@techforgood.org, password: organizer123) - 5 activities')
        self.stdout.write(f'\n  • {activity_count} Total Activities (2 organizations × 5 activities each):')
        self.stdout.write(f'    - Activity 1: COMPLETE (ended 30 days ago) - 80% capacity filled')
        self.stdout.write(f'    - Activity 2: DURING (happening now) - 70% capacity, no pending allowed')
        self.stdout.write(f'    - Activity 3: UPCOMING (starts in 3 days) - 50% capacity + pending')
        self.stdout.write(f'    - Activity 4: OPEN (starts in 20 days) - 30% capacity + pending')
        self.stdout.write(f'    - Activity 5: FULL (starts in 10 days) - 100% capacity, no more applications')
        self.stdout.write(f'\n    Total: 5 from Green Earth Foundation + 5 from Tech For Good = 10 activities')
        self.stdout.write(f'\n  • {application_count} Student Applications created across all activities')
        self.stdout.write(f'    - FULL activities: All slots filled (no more applications allowed)')
        self.stdout.write(f'    - COMPLETE/DURING: Approved students only (no pending)')
        self.stdout.write(f'    - UPCOMING/OPEN: Some approved + pending applications (students can still apply)')
        self.stdout.write('\n' + '='*80)
