"""Health check endpoint (Phase 1). No auth, no DB, no secrets."""
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """GET /api/v1/health/ -> {"status": "ok", "version": "v1", "service": "donatic-api"}."""

    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        return Response(
            {"status": "ok", "version": "v1", "service": "donatic-api"},
            status=200,
        )
