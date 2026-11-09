from __future__ import annotations

import logging
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenObtainSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import Role
from .config import GENERIC_AUTH_ERROR

logger = logging.getLogger(__name__)
_GENERIC_AUTH_ERROR = GENERIC_AUTH_ERROR
USERNAME_MAX_LENGTH = 150


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    expected_role = serializers.ChoiceField(choices=Role.ROLE_CHOICES, write_only=True)

    def validate(self, attrs):
        expected_role = attrs.pop("expected_role")
        username = attrs.get(self.username_field)
        if username and "@" in username:
            matches = get_user_model().objects.filter(email__iexact=username)
            if matches.count() == 1:
                attrs[self.username_field] = matches.first().get_username()

        # Authenticate first, but do not construct either token until the
        # authenticated account's authoritative role has been checked.
        # We catch AuthenticationFailed from the parent and re-raise with
        # our generic message so that wrong-password and wrong-role produce
        # identical 401 responses, preventing user enumeration.
        try:
            TokenObtainSerializer.validate(self, attrs)
        except AuthenticationFailed:
            raise AuthenticationFailed(_GENERIC_AUTH_ERROR) from None

        profile = getattr(self.user, "app_profile", None)
        if not profile or not profile.is_active or profile.role_code_id not in {"STUDENT", "FACULTY", "HOD", "ADMIN"}:
            raise AuthenticationFailed(_GENERIC_AUTH_ERROR)

        # Role mismatch must NOT reveal that the password was correct:
        # return the same generic 401 as a wrong-password attempt.
        if profile.role_code_id != expected_role:
            raise AuthenticationFailed(_GENERIC_AUTH_ERROR)

        refresh = self.get_token(self.user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": self.user.id,
                "username": self.user.get_username(),
                "email": self.user.email,
                "role_code": profile.role_code_id,
            },
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        profile = getattr(user, "app_profile", None)
        role_code = getattr(profile, "role_code_id", None) if profile else None
        if not profile or not profile.is_active or role_code not in {"STUDENT", "FACULTY", "HOD", "ADMIN"}:
            raise AuthenticationFailed(_GENERIC_AUTH_ERROR)
        token["role_code"] = role_code
        token["user_id"] = user.id
        token["auth_version"] = profile.auth_version
        return token


def _record_login_audit(event_type: str, actor=None, entity_id=None, username: str = ""):
    try:
        from .models import AuditEvent
        AuditEvent.objects.create(
            actor=actor,
            event_type=event_type,
            entity_type="AppUser",
            entity_id=entity_id,
            details_json={"username": username},
        )
    except Exception:
        logger.exception("Failed to record %s audit event", event_type)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    # Scoped throttle: "login" scope → 5 requests/min (see REST_FRAMEWORK settings)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        safe_username = str(username)[:USERNAME_MAX_LENGTH] if username else ""
        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            _record_login_audit("LOGIN_FAILED", actor=None, entity_id=None, username=safe_username)
            raise

        if response.status_code == 200:
            user_data = response.data.get("user") or {}
            user_id = user_data.get("id")
            user_model = get_user_model()
            user_obj = user_model.objects.filter(pk=user_id).first() if user_id else None
            _record_login_audit(
                "LOGIN_SUCCEEDED",
                actor=user_obj,
                entity_id=user_id,
                username=safe_username or (user_obj.username if user_obj else ""),
            )
        else:
            _record_login_audit("LOGIN_FAILED", actor=None, entity_id=None, username=safe_username)
        return response


class ActiveProfileTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        token = RefreshToken(attrs["refresh"])
        user_model = get_user_model()
        try:
            user = user_model.objects.get(pk=token.get("user_id"), is_active=True)
            profile = user.app_profile
        except (user_model.DoesNotExist, user_model.app_profile.RelatedObjectDoesNotExist):
            raise AuthenticationFailed("This account no longer has an active role profile.")
        if not profile.is_active or token.get("role_code") != profile.role_code_id:
            raise AuthenticationFailed("The account role changed. Please sign in again.")
        if token.get("auth_version", 0) != profile.auth_version:
            raise AuthenticationFailed("The account credentials changed. Please sign in again.")
        return super().validate(attrs)


class ActiveProfileTokenRefreshView(TokenRefreshView):
    serializer_class = ActiveProfileTokenRefreshSerializer


class LogoutView(APIView):
    # A signed refresh token is the credential being invalidated. Do not let an
    # expired access token prevent a client from ending its local session.
    authentication_classes = []
    permission_classes = [AllowAny]

    def get_authenticate_header(self, request):
        return "Bearer"

    def post(self, request):
        refresh_value = request.data.get("refresh")
        if not isinstance(refresh_value, str) or not refresh_value:
            raise AuthenticationFailed("A refresh token is required.")
        try:
            RefreshToken(refresh_value).blacklist()
        except TokenError as exc:
            raise AuthenticationFailed("Refresh token is invalid or expired.") from exc
        return Response(status=status.HTTP_204_NO_CONTENT)
