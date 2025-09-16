from social_core.backends.google import GoogleOAuth2


class GoogleOAuth2Custom(GoogleOAuth2):
    """Custom Google OAuth2 backend that honors SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI
    for the provider redirect_uri, enabling a custom callback path.
    """
    name = 'google-oauth2'  # keep the same name so existing URLs keep working

    def get_redirect_uri(self, state=None):
        # Prefer explicit setting if provided; fall back to default behavior
        uri = self.setting('REDIRECT_URI')
        if uri:
            return uri
        return super().get_redirect_uri(state)
