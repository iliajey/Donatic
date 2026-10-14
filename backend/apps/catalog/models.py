"""Catalog domain: base donuts, sauces, toppings (Phase 2)."""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, MinValueValidator
from django.db import models

ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def validate_catalog_image(value):
    if not value:
        return
    if value.size and value.size > MAX_IMAGE_BYTES:
        raise ValidationError("Image must be 5 MB or smaller.")
    # NOTE: SVG is intentionally not in the allowed extensions.


class CatalogItemBase(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True, default="")
    price = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Exact price in integer IRR. Never floats.",
    )
    image = models.ImageField(
        upload_to="catalog/%Y/%m/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(ALLOWED_IMAGE_EXTENSIONS), validate_catalog_image],
    )
    visual_key = models.CharField(
        max_length=60,
        blank=True,
        default="",
        help_text="Local renderer mapping key (e.g. sauce:strawberry).",
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        default="",
        help_text="Optional hex swatch like #F6A8BE for the 2D renderer.",
    )
    is_active = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["sort_order", "name", "id"]

    def __str__(self) -> str:  # pragma: no cover - display helper
        return f"{self.name} ({self.price} IRR)"


class BaseDonut(CatalogItemBase):
    class Meta(CatalogItemBase.Meta):
        pass


class Sauce(CatalogItemBase):
    class Meta(CatalogItemBase.Meta):
        pass


class Topping(CatalogItemBase):
    class Meta(CatalogItemBase.Meta):
        pass
