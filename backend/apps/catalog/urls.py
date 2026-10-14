from django.urls import path

from .views import (
    BaseDonutListView,
    CatalogView,
    SauceListView,
    ToppingListView,
    ValidatePriceView,
)

urlpatterns = [
    path("catalog/", CatalogView.as_view(), name="catalog"),
    path("base-donuts/", BaseDonutListView.as_view(), name="base-donut-list"),
    path("sauces/", SauceListView.as_view(), name="sauce-list"),
    path("toppings/", ToppingListView.as_view(), name="topping-list"),
    path(
        "donut-compositions/validate-price/",
        ValidatePriceView.as_view(),
        name="validate-price",
    ),
]
