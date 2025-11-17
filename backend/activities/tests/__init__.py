"""Tests for the activities app."""

# Model tests
from .test_activity_model import *
from .test_application_model import *
from .test_checkin_model import *
from .test_deletion_request_model import *

# Serializer tests
from .test_serializers import *

# URL tests
from .test_urls import *

# View tests
from .test_activity_views import *
from .test_application_views import *
from .test_checkin_views import *
from .test_view_edge_cases import *
