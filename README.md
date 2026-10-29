# Project Approval System

## Backend setup

Python 3.10 or newer is required. Run these commands from the repository root.

**Windows PowerShell**

```powershell
py -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Copy-Item backend/.env.example backend/.env
$env:DJANGO_ENV = 'development'
$env:DJANGO_DB = 'sqlite'
backend/.venv/Scripts/python.exe backend/manage.py migrate
```

**Linux/macOS**

```sh
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
export DJANGO_ENV=development DJANGO_DB=sqlite
backend/.venv/bin/python backend/manage.py migrate
```

Django reads environment variables from the process, not `.env` automatically. Configure these variables in your shell or deployment environment:

| Variable | Development example / default | Production |
|---|---|---|
| `DJANGO_ENV` | `development` | Set `production`. |
| `DJANGO_DEBUG` | `false` by default; set `1` to opt in locally | Must be `false`. |
| `DJANGO_SECRET_KEY` | Optional; an ephemeral key is generated if omitted | Required, unique random value of at least 50 characters. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Required explicit hostnames, no wildcards. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4028,http://127.0.0.1:4028` | Required exact HTTPS origins. |
| `CSRF_TRUSTED_ORIGINS` | `http://localhost:4028,http://127.0.0.1:4028` | Required exact HTTPS origins. |
| `DJANGO_DB` | `sqlite` | `postgres` or explicitly `sqlite`. |
| `DJANGO_SQLITE_PATH` | Optional; defaults to `backend/db.sqlite3` | Optional SQLite path. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | Not needed for SQLite | PostgreSQL connection; defaults are `project_approval_db`, `aswin`, empty password, `localhost`, `5432`. |
| `DJANGO_SECURE_SSL_REDIRECT`, `DJANGO_SECURE_HSTS_SECONDS`, `DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS`, `DJANGO_SECURE_HSTS_PRELOAD` | Production defaults: `true`, `31536000`, `false`, `false` | Set according to the HTTPS deployment. |
| `DJANGO_SECURE_PROXY_SSL_HEADER` | Optional, unset | Optional trusted proxy header, e.g. `HTTP_X_FORWARDED_PROTO=https`. |
| `DJANGO_EMAIL_BACKEND`, `DJANGO_EMAIL_HOST`, `DJANGO_EMAIL_PORT`, `DJANGO_EMAIL_HOST_USER`, `DJANGO_EMAIL_HOST_PASSWORD`, `DJANGO_EMAIL_USE_TLS`, `DJANGO_EMAIL_USE_SSL`, `DJANGO_DEFAULT_FROM_EMAIL` | Console backend; SMTP values optional | Configure SMTP to send password reset email; defaults include port `587`, TLS `true`, SSL `false`. |
| `PASSWORD_RESET_FRONTEND_URL` | `http://localhost:4028/reset-password` | Set the frontend reset URL. |
| `APP_ADMIN_PASSWORD` | Optional; command prompts securely when interactive | Supply through a protected environment for non-interactive command runs; never use a CLI argument. |

For a production secret, generate a fresh value with `python -c "import secrets; print(secrets.token_urlsafe(64))"` and store it only in the deployment environment. Do not commit it.

After migrations, create the first application admin, log in through the frontend, create a department in the admin dashboard, then create faculty/student users or let students self-register and assign their department in the admin dashboard:

```sh
python backend/manage.py create_app_admin --username admin --email admin@example.edu --first-name App --last-name Admin
```

The command prompts for the password with confirmation. To run it non-interactively, set `APP_ADMIN_PASSWORD` in the environment. Start the backend with `python backend/manage.py runserver` (use `backend/.venv/Scripts/python.exe` on Windows if the environment is not activated).

## Frontend

```sh
cd frontend
npm install
npm run start
npm run build
```

## Tests

From the repository root, run backend tests with `python backend/manage.py test core`. Frontend test scripts are `npm run test:auth` and `npm run test:admin-stats`, run from `frontend/`; build with `npm run build`.

## Known limitations

- file contents are not stored (only metadata)
- no comment-creation endpoint
- no notifications API
- no password-reset email unless SMTP is configured
- tokens are kept in localStorage
- no login rate limiting
