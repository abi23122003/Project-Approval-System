import getpass
import os

from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.utils import IntegrityError

from core.models import AppUser, Role


class Command(BaseCommand):
    help = "Create an application ADMIN user with an AppUser profile."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument("--first-name", default="")
        parser.add_argument("--last-name", default="")

    def handle(self, *args, **options):
        username = options["username"].strip()
        if not username:
            raise CommandError("Username cannot be blank.")
        User = get_user_model()
        if User.objects.filter(username=username).exists():
            raise CommandError(f"Username {username!r} already exists.")

        password = os.environ.get("APP_ADMIN_PASSWORD")
        if password is None:
            if not os.isatty(0):
                raise CommandError("Set APP_ADMIN_PASSWORD when running non-interactively.")
            password = getpass.getpass("Password for application admin: ")
            confirmation = getpass.getpass("Confirm password: ")
            if password != confirmation:
                raise CommandError("Passwords do not match.")

        user = User(
            username=username,
            email=options["email"].strip(),
            first_name=options["first_name"].strip(),
            last_name=options["last_name"].strip(),
        )
        try:
            password_validation.validate_password(password, user)
        except ValidationError as exc:
            raise CommandError(" ".join(exc.messages)) from exc

        try:
            with transaction.atomic():
                user.set_password(password)
                user.save()
                admin_role, _ = Role.objects.get_or_create(role_code=Role.ADMIN)
                AppUser.objects.create(user=user, role_code=admin_role, department=None)
        except IntegrityError as exc:
            raise CommandError(f"Could not create admin: {exc}") from exc

        self.stdout.write(self.style.SUCCESS(f"Created application admin {username!r}."))
