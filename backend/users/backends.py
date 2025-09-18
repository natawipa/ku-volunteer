from social_core.backends.google import GoogleOAuth2


class GoogleOAuth2Custom(GoogleOAuth2):
    """Use SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI if provided."""
    name = 'google-oauth2'

    def get_redirect_uri(self, state=None):
        uri = self.setting('REDIRECT_URI')
        if uri:
            return uri
        return super().get_redirect_uri(state)
