"""Serializers: exact integer IRR prices, never floats."""
from rest_framework import serializers

from .models import BaseDonut, Sauce, Topping


class CatalogItemSerializer(serializers.ModelSerializer):
    price = serializers.IntegerField(min_value=0)
    image_url = serializers.SerializerMethodField()

    class Meta:
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "currency",
            "image_url",
            "visual_key",
            "color",
            "is_active",
            "sort_order",
        )
        read_only_fields = ("id", "currency", "image_url", "is_active")

    currency = serializers.CharField(default="IRR", read_only=True)

    def get_image_url(self, obj) -> str | None:
        try:
            if obj.image and hasattr(obj.image, "url"):
                request = self.context.get("request")
                if request is not None:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
        except Exception:
            return None
        return None

    def validate_price(self, value):
        if value is None or not isinstance(value, int) or isinstance(value, bool) or value < 0:
            raise serializers.ValidationError("Price must be a non-negative integer (IRR).")
        return value


class BaseDonutSerializer(CatalogItemSerializer):
    class Meta(CatalogItemSerializer.Meta):
        model = BaseDonut


class SauceSerializer(CatalogItemSerializer):
    class Meta(CatalogItemSerializer.Meta):
        model = Sauce


class ToppingSerializer(CatalogItemSerializer):
    class Meta(CatalogItemSerializer.Meta):
        model = Topping
