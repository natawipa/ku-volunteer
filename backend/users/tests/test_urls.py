"""
Test cases for user URL routing.
"""
from django.test import SimpleTestCase
from django.urls import reverse, resolve

from users import views


class UserUrlsTest(SimpleTestCase):
    """Test cases for user URL patterns."""

    def test_user_register_url_resolves(self):
        """Test that user-register URL resolves correctly."""
        url = reverse('user-register')
        self.assertEqual(resolve(url).func.view_class, views.UserRegisterView)

    def test_user_list_url_resolves(self):
        """Test that user-list URL resolves correctly."""
        url = reverse('user-list')
        self.assertEqual(resolve(url).func.view_class, views.UserListView)

    def test_user_detail_url_resolves(self):
        """Test that user-detail URL resolves correctly with ID."""
        url = reverse('user-detail', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.UserDetailView)

    def test_user_update_url_resolves(self):
        """Test that user-update URL resolves correctly with ID."""
        url = reverse('user-update', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.UserUpdateView)

    def test_user_delete_url_resolves(self):
        """Test that user-delete URL resolves correctly with ID."""
        url = reverse('user-delete', args=[1])
        self.assertEqual(resolve(url).func.view_class, views.UserDeleteView)

    def test_login_url_resolves(self):
        """Test that login URL resolves correctly."""
        url = reverse('user-login')
        self.assertEqual(resolve(url).func.view_class, views.LoginView)

    def test_user_detail_url_with_different_ids(self):
        """Test user-detail URL with different ID values."""
        for user_id in [1, 10, 100, 999]:
            url = reverse('user-detail', args=[user_id])
            resolved = resolve(url)
            self.assertEqual(resolved.func.view_class, views.UserDetailView)
            self.assertEqual(resolved.kwargs['pk'], user_id)

    def test_user_update_url_with_different_ids(self):
        """Test user-update URL with different ID values."""
        for user_id in [1, 10, 100, 999]:
            url = reverse('user-update', args=[user_id])
            resolved = resolve(url)
            self.assertEqual(resolved.func.view_class, views.UserUpdateView)
            self.assertEqual(resolved.kwargs['pk'], user_id)

    def test_user_delete_url_with_different_ids(self):
        """Test user-delete URL with different ID values."""
        for user_id in [1, 10, 100, 999]:
            url = reverse('user-delete', args=[user_id])
            resolved = resolve(url)
            self.assertEqual(resolved.func.view_class, views.UserDeleteView)
            self.assertEqual(resolved.kwargs['pk'], user_id)