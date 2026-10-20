# Backend setup and verification

The backend uses Django 5.2.10, Django REST Framework, SimpleJWT, django-cors-headers, and PostgreSQL support through psycopg 3. Python 3.14.8 was used for local verification; the source syntax requires Python 3.10 or newer.

## Windows PowerShell setup

From the repository root:

```powershell
py -3.14 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
```

The checked-in requirements file pins the installed direct and transitive packages used for verification. Activate the environment or invoke its Python executable directly for Django commands.

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
backend/.venv/Scripts/python.exe backend/manage.py test core.tests.test_project_approval
```

The test runner creates its own temporary database and applies the complete migration graph.

## PostgreSQL

Set `DJANGO_DB=postgres` and configure `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, and `POSTGRES_PORT`. Migration `0002` installs PostgreSQL-specific constraints and triggers only on PostgreSQL. Migration `0006` updates the status trigger so the transactional service layer is the single writer of status history. PostgreSQL runtime migration verification requires a reachable PostgreSQL server.
