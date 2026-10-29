from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import AppUser


class Command(BaseCommand):
    help = "List demo accounts, or deactivate them with --apply."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Deactivate matching accounts.")

    def handle(self, *args, **options):
        User = get_user_model()
        users = list(
            User.objects.filter(username__endswith="_demo")
            .select_related("app_profile__role_code")
            .order_by("username")
        )
        if not users:
            self.stdout.write("No demo accounts found.")
            return

        for user in users:
            try:
                role = user.app_profile.role_code_id
                profile_active = user.app_profile.is_active
            except AppUser.DoesNotExist:
                role = "(no AppUser profile)"
                profile_active = "N/A"
            self.stdout.write(
                f"username={user.username} role={role} is_active={user.is_active} "
                f"profile_is_active={profile_active} last_login={user.last_login}"
            )

        if options["apply"]:
            with transaction.atomic():
                for user in users:
                    if user.is_active:
                        user.is_active = False
                        user.save(update_fields=["is_active"])
                    AppUser.objects.filter(user=user, is_active=True).update(is_active=False)
            self.stdout.write(self.style.SUCCESS(f"Deactivated {len(users)} demo account(s)."))
        else:
            self.stdout.write("Dry run only; no accounts changed. Use --apply to deactivate these accounts.")
