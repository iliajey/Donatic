"""Root URL configuration (Phase 1: health only)."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/<str:version>/health/", include("apps.health.urls")),
]
