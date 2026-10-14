"""Root URL configuration (Phase 2: health + catalog)."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/<str:version>/health/", include("apps.health.urls")),
    path("api/<str:version>/", include("apps.catalog.urls")),
]
