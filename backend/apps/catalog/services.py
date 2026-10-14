"""Server-authoritative donut composition validation + pricing (Phase 2).

Rules:
- exactly one base donut (required, must exist + active)
- zero or one sauce (must exist + active)
- zero or more toppings, no duplicates (each must exist + active)
- total = base price + sauce price + sum(toppings), integer IRR
- canonical form sorts topping ids; hash = sha256 of canonical string
  (identifies the composition, NOT a price quote)
"""
import hashlib

from .models import BaseDonut, Sauce, Topping

MAX_TOPPINGS = 8


class CompositionError(Exception):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message
        super().__init__(message)


def canonical_key(base_id: int, sauce_id: int | None, topping_ids: list[int]) -> str:
    canonical_toppings = ",".join(str(t) for t in sorted(topping_ids))
    return f"v1|base:{base_id}|sauce:{sauce_id if sauce_id is not None else '-'}|top:{canonical_toppings}"


def composition_hash(canonical: str) -> str:
    return "dn_" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def validate_and_price(base_donut_id, sauce_id, topping_ids) -> dict:
    # --- structural validation (reject malformed IDs) ---
    if isinstance(base_donut_id, bool) or not isinstance(base_donut_id, int):
        raise CompositionError("base_donut_id", "base_donut_id is required and must be an integer.")
    if sauce_id is not None and (isinstance(sauce_id, bool) or not isinstance(sauce_id, int)):
        raise CompositionError("sauce_id", "sauce_id must be an integer or null.")
    if topping_ids is None:
        topping_ids = []
    if not isinstance(topping_ids, list) or any(
        isinstance(t, bool) or not isinstance(t, int) for t in topping_ids
    ):
        raise CompositionError("topping_ids", "topping_ids must be a list of integers.")
    if len(topping_ids) != len(set(topping_ids)):
        raise CompositionError("topping_ids", "Duplicate topping ids are not allowed.")
    if len(topping_ids) > MAX_TOPPINGS:
        raise CompositionError(
            "topping_ids", f"At most {MAX_TOPPINGS} toppings are allowed."
        )

    # --- authoritative fetch (only active products) ---
    try:
        base = BaseDonut.objects.get(id=base_donut_id, is_active=True)
    except BaseDonut.DoesNotExist:
        raise CompositionError("base_donut_id", "Base donut not found or inactive.")
    sauce = None
    if sauce_id is not None:
        try:
            sauce = Sauce.objects.get(id=sauce_id, is_active=True)
        except Sauce.DoesNotExist:
            raise CompositionError("sauce_id", "Sauce not found or inactive.")
    toppings = []
    if topping_ids:
        found = list(Topping.objects.filter(id__in=topping_ids, is_active=True))
        if len(found) != len(topping_ids):
            raise CompositionError("topping_ids", "One or more toppings not found or inactive.")
        by_id = {t.id: t for t in found}
        toppings = [by_id[t] for t in sorted(topping_ids)]

    sauce_price = sauce.price if sauce else 0
    toppings_total = sum(t.price for t in toppings)
    total = base.price + sauce_price + toppings_total
    canonical = canonical_key(base.id, sauce.id if sauce else None, [t.id for t in toppings])

    return {
        "valid": True,
        "canonical": {
            "base_donut_id": base.id,
            "sauce_id": sauce.id if sauce else None,
            "topping_ids": [t.id for t in toppings],
        },
        "composition_hash": composition_hash(canonical),
        "breakdown": {
            "base": {"id": base.id, "name": base.name, "price": base.price},
            "sauce": (
                {"id": sauce.id, "name": sauce.name, "price": sauce.price} if sauce else None
            ),
            "toppings": [{"id": t.id, "name": t.name, "price": t.price} for t in toppings],
            "toppings_total": toppings_total,
            "currency": "IRR",
        },
        "total_price": total,
        "currency": "IRR",
    }
