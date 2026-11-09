from __future__ import annotations


class SecurityHeadersMiddleware:
    """Security headers middleware that enforces Content-Security-Policy."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Preserve any Content-Security-Policy already set by a view or upstream middleware
        if "Content-Security-Policy" not in response.headers:
            # Django admin and browsable pages require unsafe-inline for scripts/styles
            if request.path.startswith("/admin/"):
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; script-src 'self' 'unsafe-inline'; "
                    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none';"
                )
            else:
                # Restrict script execution to 'self' to prevent XSS-based token theft
                response.headers["Content-Security-Policy"] = (
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
                    "img-src 'self' data:; object-src 'none';"
                )
        return response
