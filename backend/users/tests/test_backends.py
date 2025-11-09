"""
Test cases for custom OAuth backend.
These tests verify the basic functionality of the custom backend.
"""
from django.test import TestCase
from users.backends import GoogleOAuth2Custom
from social_core.backends.google import GoogleOAuth2


class GoogleOAuth2CustomTest(TestCase):
    """Test cases for GoogleOAuth2Custom backend."""

    def test_inherits_from_google_oauth2(self):
        """Test that GoogleOAuth2Custom properly inherits from GoogleOAuth2."""
        backend = GoogleOAuth2Custom()
        self.assertIsInstance(backend, GoogleOAuth2)

    def test_backend_name_is_google_oauth2(self):
        """Test that backend name is 'google-oauth2'."""
        backend = GoogleOAuth2Custom()
        self.assertEqual(backend.name, 'google-oauth2')

    def test_backend_can_be_imported(self):
        """Test that backend can be imported from users.backends."""
        from users.backends import GoogleOAuth2Custom
        self.assertIsNotNone(GoogleOAuth2Custom)
        self.assertTrue(callable(GoogleOAuth2Custom))
