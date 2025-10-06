"""
Application constants and configuration values.
"""

# User roles
class UserRoles:
    STUDENT = "student"
    ORGANIZER = "organizer"
    ADMIN = "admin"

    CHOICES = [
        (STUDENT, "Student"),
        (ORGANIZER, "Organizer"),
        (ADMIN, "Admin"),
    ]

# Activity statuses
class ActivityStatus:
    PENDING = 'pending'
    OPEN = 'open'
    FULL = 'full'
    CLOSED = 'closed'
    CANCELLED = 'cancelled'
    REJECTED = 'rejected'

    CHOICES = [
        (PENDING, 'Pending'),
        (OPEN, 'Open'),
        (FULL, 'Full'),
        (CLOSED, 'Closed'),
        (CANCELLED, 'Cancelled'),
        (REJECTED, 'Rejected'),
    ]

# Application statuses
class ApplicationStatus:
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'

    CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
        (CANCELLED, 'Cancelled'),
    ]

# Organization types
class OrganizationType:
    INTERNAL = "internal"
    EXTERNAL = "external"

    CHOICES = [
        (INTERNAL, "Kasetsart University"),
        (EXTERNAL, "External Organization"),
    ]

# Deletion request statuses
class DeletionRequestStatus:
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'

    CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]

# Category configuration
DEFAULT_ACTIVITY_CATEGORY_GROUPS = {
    'University Activities': [],
    'Enhance Competencies': [
        'Development of Morality and Ethics',
        'Development of Thinking and Learning Skills',
        'Development of Interpersonal Skills and Relationship Building',
        'Development of Health and Well-being',
    ],
    'Social Engagement Activities': [],
}

# Validation limits
class ValidationLimits:
    """Validation limits for activities."""
    CATEGORIES_MIN = 1
    CATEGORIES_MAX = 3
    MAX_TITLE_LENGTH = 255
    MAX_ORGANIZATION_NAME_LENGTH = 255
    MAX_USER_NAME_LENGTH = 100
    MAX_USER_TITLE_LENGTH = 20
    MAX_STUDENT_ID_LENGTH = 50
    MAX_LOCATION_LENGTH = 255

# HTTP Status messages
class StatusMessages:
    PERMISSION_DENIED = "You do not have permission to perform this action."
    NOT_FOUND = "The requested resource was not found."
    INVALID_CREDENTIALS = "Invalid credentials provided."
    EMAIL_REQUIRED = "Email is required."
    VALIDATION_ERROR = "Validation error occurred."
    NOT_YOUR_ACTIVITY = "Not your activity."
    DELETION_REQUIRES_ADMIN = "Participants exist; deletion requires admin approval"
    INVALID_ACTION = "Invalid action provided."
