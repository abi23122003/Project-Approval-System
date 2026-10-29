from .models import Role

# Permissions and role restrictions
PUBLIC_ENDPOINT_PERMISSIONS = []  # No authentication needed for public endpoints
ALLOWED_REGISTRATION_ROLES = {Role.STUDENT}

# Pagination defaults
PAGE_SIZE_QUERY_PARAM = "page_size"
MAX_PAGE_SIZE = 100
MAX_PROJECT_MEMBERS = 4
MAX_UPLOAD_BYTES = 25 * 1024 * 1024

# Health check response
HEALTH_RESPONSE = {"status": "ok"}

# Hod submitted project status codes
HOD_SUBMITTED_STATUS_CODES = ["SUBMITTED", "UNDER_REVIEW"]
