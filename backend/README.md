# Backend setup and verification

The backend uses Django 5.2.10, Django REST Framework, SimpleJWT, django-cors-headers, and PostgreSQL support through psycopg 3. Python 3.14.8 was used for local verification; the source syntax requires Python 3.10 or newer.

## Windows PowerShell setup

From the repository root:

```powershell
py -3.14 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

The checked-in requirements file pins the installed direct and transitive packages used for verification. Activate the environment or invoke its Python executable directly for Django commands.

## Environment and security settings

`backend/.env.example` documents development-only values. Django does not load `.env` files; export these variables in PowerShell or configure them in the service environment. Development defaults use `DEBUG=true`, local allowed hosts, and only the two local Vite origins. The signing key is generated ephemerally when `DJANGO_SECRET_KEY` is not set, so tokens do not survive a backend restart.

For production, set `DJANGO_ENV=production` (or set `DJANGO_DEBUG=false`) and provide all of the following from a secret manager or deployment environment:

- `DJANGO_SECRET_KEY`: a unique random value with at least 50 characters. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(64))"`; do not commit the output.
- `DJANGO_ALLOWED_HOSTS`: comma-separated explicit hostnames; wildcards are rejected.
- `CORS_ALLOWED_ORIGINS`: comma-separated exact HTTPS frontend origins. Wildcard and HTTP production origins are rejected.
- `DJANGO_DEBUG=false`.

Production enables HTTPS redirects, secure session and CSRF cookies, and one-year HSTS by default. Confirm HTTPS works for every host before deployment. If TLS terminates at a reverse proxy, configure the proxy to overwrite the forwarded-protocol header and set `DJANGO_SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO=https`; never trust a client-controlled forwarding header. If the deployment topology cannot support Django's redirect, the edge must enforce HTTPS and this setting must be explicitly configured for that topology.

Run `manage.py migrate` during deployment. This creates Simple JWT blacklist tables and preserves existing application records. Logout invalidates the submitted refresh token; already-issued access tokens remain valid until their configured expiration (one hour) and are not server-revoked by logout.

## SQLite

SQLite is the development default. The normal database path remains `backend/db.sqlite3`. To use a separate database file, set `DJANGO_SQLITE_PATH`; this is useful for disposable migration checks and does not replace the default database:

```powershell
$env:DJANGO_DB = 'sqlite'
$env:DJANGO_SQLITE_PATH = "$env:TEMP/aps-fresh-migrations.sqlite3"
backend/.venv/Scripts/python.exe backend/manage.py migrate
```

Remove a disposable database only after confirming its path. Never point a migration verification command at an existing user database.

## Checks and regression tests

```powershell
$env:DJANGO_DB = 'sqlite'
backend/.venv/Scripts/python.exe backend/manage.py check
backend/.venv/Scripts/python.exe backend/manage.py test core.tests
```

The test runner creates its own temporary database and applies the complete migration graph.

For a production configuration check, export `DJANGO_ENV=production`, a temporary verification-only `DJANGO_SECRET_KEY`, explicit example host/origin values, and the intended HTTPS settings, then run:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py check --deploy
```

This checks Django's production settings but does not verify your real TLS termination, proxy header behavior, DNS, or certificate. Validate those in the actual deployment environment.

## PostgreSQL

Set `DJANGO_DB=postgres` and configure `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT`. Migration `0002` installs PostgreSQL-specific constraints and triggers only on PostgreSQL. Migration `0006` updates the status trigger so the transactional service layer is the single writer of status history. PostgreSQL runtime migration verification requires a reachable PostgreSQL server.
