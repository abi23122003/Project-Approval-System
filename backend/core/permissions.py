from __future__ import annotations

from rest_framework.permissions import BasePermission

from .rbac import is_allowed


class RBACPermission(BasePermission):
    def has_permission(self, request, view) -> bool:
        action = getattr(view, "required_action", None)
        if not action:
            return False
        return is_allowed(user=request.user, action=action)

    def has_object_permission(self, request, view, obj) -> bool:
        action = getattr(view, "required_action", None)
        if not action:
            return False
        return is_allowed(user=request.user, action=action, obj=obj)
