"""Public catalog + composition pricing views (read-only catalog, no auth)."""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BaseDonut, Sauce, Topping
from .serializers import BaseDonutSerializer, SauceSerializer, ToppingSerializer
from .services import CompositionError, validate_and_price


class ActiveListMixin:
    model = None
    serializer_class = None

    def get(self, request, *args, **kwargs):
        qs = self.model.objects.filter(is_active=True).order_by("sort_order", "name", "id")
        serializer = self.serializer_class(qs, many=True, context={"request": request})
        return Response(serializer.data)


class BaseDonutListView(ActiveListMixin, APIView):
    authentication_classes = []
    permission_classes = []
    model = BaseDonut
    serializer_class = BaseDonutSerializer


class SauceListView(ActiveListMixin, APIView):
    authentication_classes = []
    permission_classes = []
    model = Sauce
    serializer_class = SauceSerializer


class ToppingListView(ActiveListMixin, APIView):
    authentication_classes = []
    permission_classes = []
    model = Topping
    serializer_class = ToppingSerializer


class CatalogView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, *args, **kwargs):
        ctx = {"request": request}
        bases = BaseDonut.objects.filter(is_active=True).order_by("sort_order", "name", "id")
        sauces = Sauce.objects.filter(is_active=True).order_by("sort_order", "name", "id")
        toppings = Topping.objects.filter(is_active=True).order_by("sort_order", "name", "id")
        return Response(
            {
                "currency": "IRR",
                "base_donuts": BaseDonutSerializer(bases, many=True, context=ctx).data,
                "sauces": SauceSerializer(sauces, many=True, context=ctx).data,
                "toppings": ToppingSerializer(toppings, many=True, context=ctx).data,
            }
        )


class ValidatePriceView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        data = request.data if isinstance(request.data, dict) else {}
        # Never trust client-submitted prices: ignore any price/total fields.
        try:
            result = validate_and_price(
                data.get("base_donut_id"),
                data.get("sauce_id"),
                data.get("topping_ids", []),
            )
        except CompositionError as e:
            return Response(
                {"code": "invalid_composition", "message": e.message, "details": {"field": e.field}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(result, status=status.HTTP_200_OK)
