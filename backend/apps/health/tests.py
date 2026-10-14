"""Health endpoint tests: shape, content-type, no sensitive leakage."""
from django.test import TestCase


class HealthEndpointTests(TestCase):
    url = "/api/v1/health/"

    def test_health_returns_200_with_expected_shape(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"status": "ok", "version": "v1", "service": "donatic-api"},
        )

    def test_health_content_type_is_json(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        content_type = response.headers.get("Content-Type", "")
        self.assertIn("application/json", content_type)

    def test_health_response_leaks_no_secrets_or_tracebacks(self):
        response = self.client.get(self.url)
        body = response.content.decode("utf-8").lower()
        for marker in (
            "secret",
            "password",
            "traceback",
            "django_secret",
            "database_url",
            "exception",
        ):
            self.assertNotIn(marker, body)
