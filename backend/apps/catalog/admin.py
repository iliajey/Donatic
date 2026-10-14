from django.contrib import admin

from .models import BaseDonut, Sauce, Topping


class CatalogAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "price", "is_active", "sort_order", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name", "slug", "description")
    ordering = ("sort_order", "name")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("price", "is_active", "sort_order")


@admin.register(BaseDonut)
class BaseDonutAdmin(CatalogAdmin):
    pass


@admin.register(Sauce)
class SauceAdmin(CatalogAdmin):
    pass


@admin.register(Topping)
class ToppingAdmin(CatalogAdmin):
    pass
