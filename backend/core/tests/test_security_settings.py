import os
import runpy
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch

from django.core.exceptions import ImproperlyConfigured


SETTINGS_PATH = Path(__file__).resolve().parents[2] / "server" / "settings.py"


def valid_production_environment():
    generated_test_key = "".join(chr(33 + (index * 17) % 90) for index in range(64))
    return {
        "DJANGO_ENV": "production",
        "DJANGO_DEBUG": "false",
        "DJANGO_SECRET_KEY": generated_test_key,
        "DJANGO_ALLOWED_HOSTS": "app.example.test",
        "CORS_ALLOWED_ORIGINS": "https://frontend.example.test",
        "DJANGO_DB": "sqlite",
    }


def load_settings(environment):
    with patch.dict(os.environ, environment, clear=True):
        return runpy.run_path(str(SETTINGS_PATH))


class DjangoSecuritySettingsTests(TestCase):
    def test_development_defaults_are_local_and_use_an_ephemeral_secret(self):
        first = load_settings({"DJANGO_DB": "sqlite"})
        second = load_settings({"DJANGO_DB": "sqlite"})

        self.assertTrue(first["DEBUG"])
        self.assertNotEqual(first["SECRET_KEY"], second["SECRET_KEY"])
        self.assertEqual(first["ALLOWED_HOSTS"], ["localhost", "127.0.0.1"])
        self.assertEqual(
            first["CORS_ALLOWED_ORIGINS"],
            ["http://localhost:4028", "http://127.0.0.1:4028"],
        )
        self.assertFalse(first["CORS_ALLOW_ALL_ORIGINS"])

    def test_production_settings_require_explicit_secret_hosts_and_origins(self):
        base = valid_production_environment()
        for missing in ("DJANGO_SECRET_KEY", "DJANGO_ALLOWED_HOSTS", "CORS_ALLOWED_ORIGINS"):
            environment = {**base}
            del environment[missing]
            with self.subTest(missing=missing), self.assertRaises(ImproperlyConfigured):
                load_settings(environment)

    def test_production_enables_https_cookie_and_hsts_controls(self):
        configured = load_settings(valid_production_environment())

        self.assertFalse(configured["DEBUG"])
        self.assertFalse(configured["CORS_ALLOW_ALL_ORIGINS"])
        self.assertTrue(configured["SECURE_SSL_REDIRECT"])
        self.assertEqual(configured["SECURE_HSTS_SECONDS"], 31536000)
        self.assertTrue(configured["SESSION_COOKIE_SECURE"])
        self.assertTrue(configured["CSRF_COOKIE_SECURE"])

    def test_production_rejects_debug_wildcard_hosts_and_non_https_origins(self):
        cases = (
            {"DJANGO_DEBUG": "true"},
            {"DJANGO_ALLOWED_HOSTS": "*"},
            {"CORS_ALLOWED_ORIGINS": "http://frontend.example.test"},
            {"CORS_ALLOWED_ORIGINS": "https://*"},
            {"DJANGO_SECRET_KEY": "x" * 64},
        )
        for override in cases:
            with self.subTest(override=tuple(override)), self.assertRaises(ImproperlyConfigured):
                load_settings({**valid_production_environment(), **override})

    def test_boolean_and_reverse_proxy_settings_are_validated(self):
        with self.assertRaises(ImproperlyConfigured):
            load_settings({"DJANGO_DB": "sqlite", "DJANGO_DEBUG": "sometimes"})

        proxied = load_settings({
            **valid_production_environment(),
            "DJANGO_SECURE_PROXY_SSL_HEADER": "HTTP_X_FORWARDED_PROTO=https",
        })
        self.assertEqual(proxied["SECURE_PROXY_SSL_HEADER"], ("HTTP_X_FORWARDED_PROTO", "https"))

        with self.assertRaises(ImproperlyConfigured):
            load_settings({
                **valid_production_environment(),
                "DJANGO_SECURE_PROXY_SSL_HEADER": "bad-format",
            })
