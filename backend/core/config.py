from .models import Role

# Permissions and role restrictions
PUBLIC_ENDPOINT_PERMISSIONS = []  # No authentication needed for public endpoints
DISALLOWED_REGISTRATION_ROLES = {Role.ADMIN, Role.HOD}

# Pagination defaults
PAGE_SIZE_QUERY_PARAM = "page_size"
MAX_PAGE_SIZE = 100

# Health check response
HEALTH_RESPONSE = {"status": "ok"}

# Hod submitted project status codes
HOD_SUBMITTED_STATUS_CODES = ["SUBMITTED", "UNDER_REVIEW"]
