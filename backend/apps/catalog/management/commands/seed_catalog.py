"""Seed a small deterministic development catalog (idempotent).

Safe to run repeatedly: uses update_or_create keyed on slug and never
deletes or deactivates existing records. Only fills blank visual fields
so an administrator's customizations are preserved.

Prices are demo values in integer IRR (not real business data).
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import BaseDonut, Sauce, Topping

BASES = [
    {"slug": "classic-ring", "name": "Classic Ring", "price": 85000,
     "description": "Our signature fluffy ring donut.",
     "visual_key": "base:classic", "color": "#E8B06E", "sort_order": 1},
    {"slug": "cocoa-ring", "name": "Cocoa Ring", "price": 95000,
     "description": "Chocolate dough ring for cocoa lovers.",
     "visual_key": "base:cocoa", "color": "#8A5A3B", "sort_order": 2},
    {"slug": "glazed-twist", "name": "Glazed Twist", "price": 90000,
     "description": "Twisted donut with a light glaze.",
     "visual_key": "base:twist", "color": "#EFC084", "sort_order": 3},
    {"slug": "filled-pillow", "name": "Filled Pillow", "price": 105000,
     "description": "Soft square pillow donut, ready for sauce.",
     "visual_key": "base:pillow", "color": "#EDBE85", "sort_order": 4},
]

SAUCES = [
    {"slug": "strawberry", "name": "Strawberry", "price": 15000,
     "description": "Sweet strawberry glaze.", "visual_key": "sauce:strawberry",
     "color": "#F6A8BE", "sort_order": 1},
    {"slug": "chocolate", "name": "Chocolate", "price": 18000,
     "description": "Rich chocolate coating.", "visual_key": "sauce:chocolate",
     "color": "#6B3E2E", "sort_order": 2},
    {"slug": "vanilla", "name": "Vanilla", "price": 12000,
     "description": "Mellow vanilla glaze.", "visual_key": "sauce:vanilla",
     "color": "#F7E3C3", "sort_order": 3},
]

TOPPINGS = [
    {"slug": "pearls", "name": "Sugar Pearls", "price": 10000, "visual_key": "topping:pearls", "color": "#FFFFFF", "sort_order": 1},
    {"slug": "cocoa-nibs", "name": "Cocoa Nibs", "price": 12000, "visual_key": "topping:nibs", "color": "#4A2C21", "sort_order": 2},
    {"slug": "pistachio", "name": "Pistachio Crush", "price": 20000, "visual_key": "topping:pistachio", "color": "#9DBE8C", "sort_order": 3},
    {"slug": "gold-dust", "name": "Gold Dust", "price": 25000, "visual_key": "topping:gold", "color": "#B98A2F", "sort_order": 4},
    {"slug": "sesame", "name": "Toasted Sesame", "price": 8000, "visual_key": "topping:sesame", "color": "#EBCB9B", "sort_order": 5},
    {"slug": "berry-coulis", "name": "Berry Coulis Drops", "price": 14000, "visual_key": "topping:berry", "color": "#C2255C", "sort_order": 6},
    {"slug": "coconut", "name": "Coconut Flakes", "price": 9000, "visual_key": "topping:coconut", "color": "#FFF6EF", "sort_order": 7},
    {"slug": "hazelnut", "name": "Hazelnut Crunch", "price": 16000, "visual_key": "topping:hazelnut", "color": "#8A5A3B", "sort_order": 8},
]


class Command(BaseCommand):
    help = "Seed the development catalog (idempotent, demo data)."

    @transaction.atomic
    def handle(self, *args, **options):
        counts = {"bases": 0, "sauces": 0, "toppings": 0}
        for item in BASES:
            _, created = self._upsert(BaseDonut, item)
            counts["bases"] += created
        for item in SAUCES:
            _, created = self._upsert(Sauce, item)
            counts["sauces"] += created
        for item in TOPPINGS:
            _, created = self._upsert(Topping, item)
            counts["toppings"] += created
        self.stdout.write(
            self.style.SUCCESS(
                f"Catalog seed complete: "
                f"{BaseDonut.objects.count()} bases, {Sauce.objects.count()} sauces, "
                f"{Topping.objects.count()} toppings "
                f"(created this run: {counts['bases']}/{counts['sauces']}/{counts['toppings']})."
            )
        )

    def _upsert(self, model, item):
        slug = item["slug"]
        defaults = {k: v for k, v in item.items() if k != "slug"}
        obj, created = model.objects.get_or_create(slug=slug, defaults={**defaults, "is_active": True})
        if not created:
            # Preserve admin customizations: only fill visual fields when blank,
            # never touch price/name/availability/sort of existing records.
            changed = False
            for field in ("visual_key", "color", "description"):
                if not getattr(obj, field) and defaults.get(field):
                    setattr(obj, field, defaults[field])
                    changed = True
            if changed:
                obj.save()
        return obj, created
