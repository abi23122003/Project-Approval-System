from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class ActiveProfileJWTAuthentication(JWTAuthentication):
    """Reject access tokens after role, account status, or credentials change."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        profile = getattr(user, "app_profile", None)
        if not profile or not profile.is_active:
            raise AuthenticationFailed("This account no longer has an active role profile.")
        if validated_token.get("role_code") != profile.role_code_id:
            raise AuthenticationFailed("The account role changed. Please sign in again.")
        if validated_token.get("auth_version", 0) != profile.auth_version:
            raise AuthenticationFailed("The account credentials changed. Please sign in again.")
        return user
