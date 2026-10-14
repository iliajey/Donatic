from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import BaseDonut, Sauce, Topping


class CatalogEndpointTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.base1 = BaseDonut.objects.create(
            name="B One", slug="b-one", price=85000, sort_order=2)
        cls.base2 = BaseDonut.objects.create(
            name="A Two", slug="a-two", price=95000, sort_order=1)
        cls.hidden = BaseDonut.objects.create(
            name="Old", slug="old", price=1000, is_active=False)
        cls.sauce = Sauce.objects.create(
            name="Strawberry", slug="strawberry", price=15000)
        cls.top = Topping.objects.create(
            name="Pearls", slug="pearls", price=10000)

    def test_combined_catalog_only_active_ordered(self):
        res = APIClient().get("/api/v1/catalog/")
        self.assertEqual(res.status_code, 200)
        slugs = [b["slug"] for b in res.data["base_donuts"]]
        self.assertEqual(slugs, ["a-two", "b-one"])
        self.assertNotIn("old", slugs)
        self.assertEqual(res.data["currency"], "IRR")
        self.assertEqual(len(res.data["sauces"]), 1)
        self.assertEqual(len(res.data["toppings"]), 1)
        prices = [b["price"] for b in res.data["base_donuts"]]
        self.assertTrue(all(isinstance(p, int) for p in prices))

    def test_separate_list_endpoints(self):
        c = APIClient()
        for url, slug in (("/api/v1/base-donuts/", "b-one"),
                          ("/api/v1/sauces/", "strawberry"),
                          ("/api/v1/toppings/", "pearls")):
            res = c.get(url)
            self.assertEqual(res.status_code, 200, url)
            self.assertTrue(any(i["slug"] == slug for i in res.data), url)

    def test_unknown_version_404(self):
        res = APIClient().get("/api/v9/catalog/")
        self.assertEqual(res.status_code, 404)

    def test_unknown_version_404(self):
        res = APIClient().get("/api/v9/catalog/")
        self.assertEqual(res.status_code, 404)


class ValidatePriceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.base = BaseDonut.objects.create(
            name="Classic", slug="classic", price=85000)
        cls.sauce = Sauce.objects.create(
            name="Choc", slug="choc", price=18000)
        cls.t1 = Topping.objects.create(
            name="Pearls", slug="pearls", price=10000)
        cls.t2 = Topping.objects.create(
            name="Nibs", slug="nibs", price=12000)
        cls.dead = Topping.objects.create(
            name="Dead", slug="dead", price=5000, is_active=False)

    def post(self, payload):
        return APIClient().post(
            "/api/v1/donut-compositions/validate-price/",
            payload, format="json")

    def test_full_composition_price(self):
        res = self.post({"base_donut_id": self.base.id,
                         "sauce_id": self.sauce.id,
                         "topping_ids": [self.t1.id, self.t2.id]})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["valid"])
        self.assertEqual(res.data["total_price"], 85000 + 18000 + 22000)
        self.assertEqual(res.data["breakdown"]["toppings_total"], 22000)
        self.assertEqual(res.data["currency"], "IRR")
        self.assertTrue(res.data["composition_hash"].startswith("dn_"))

    def test_base_only_valid(self):
        res = self.post({"base_donut_id": self.base.id})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_price"], 85000)
        self.assertIsNone(res.data["breakdown"]["sauce"])
        self.assertEqual(res.data["canonical"]["topping_ids"], [])

    def test_client_price_ignored(self):
        res = self.post({"base_donut_id": self.base.id,
                         "total_price": 1, "price": 1})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["total_price"], 85000)

    def test_hash_stable_and_order_normalized(self):
        a = self.post({"base_donut_id": self.base.id,
                       "topping_ids": [self.t1.id, self.t2.id]})
        b = self.post({"base_donut_id": self.base.id,
                       "topping_ids": [self.t2.id, self.t1.id]})
        self.assertEqual(a.data["composition_hash"], b.data["composition_hash"])
        self.assertEqual(a.data["canonical"]["topping_ids"],
                         sorted([self.t1.id, self.t2.id]))

    def test_price_change_reflected(self):
        before = self.post({"base_donut_id": self.base.id})
        self.base.price = 90000
        self.base.save()
        after = self.post({"base_donut_id": self.base.id})
        self.assertNotEqual(before.data["total_price"], after.data["total_price"])
        self.assertEqual(after.data["total_price"], 90000)
        self.assertEqual(before.data["composition_hash"],
                         after.data["composition_hash"])

        self.assertEqual(before.data["composition_hash"],
                         after.data["composition_hash"])


class ValidatePriceInvalidTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.base = BaseDonut.objects.create(
            name="Classic", slug="classic", price=85000)
        cls.sauce = Sauce.objects.create(
            name="Choc", slug="choc", price=18000)
        cls.t1 = Topping.objects.create(
            name="Pearls", slug="pearls", price=10000)
        cls.dead_base = BaseDonut.objects.create(
            name="Dead", slug="dead", price=1000, is_active=False)
        cls.dead_top = Topping.objects.create(
            name="Gone", slug="gone", price=1000, is_active=False)

    def post(self, payload):
        return APIClient().post(
            "/api/v1/donut-compositions/validate-price/",
            payload, format="json")

    def test_missing_base(self):
        self.assertEqual(self.post({}).status_code, 400)
        self.assertEqual(self.post({"topping_ids": []}).status_code, 400)

    def test_bad_id_types(self):
        for payload in ({"base_donut_id": "1"},
                        {"base_donut_id": True},
                        {"base_donut_id": 1.5},
                        {"base_donut_id": self.base.id, "sauce_id": "x"},
                        {"base_donut_id": self.base.id, "topping_ids": "1"},
                        {"base_donut_id": self.base.id, "topping_ids": [True]},
                        {"base_donut_id": self.base.id, "topping_ids": ["1"]}):
            res = self.post(payload)
            self.assertEqual(res.status_code, 400, payload)
            self.assertEqual(res.data["code"], "invalid_composition")

    def test_unknown_and_inactive_rejected(self):
        cases = [
            {"base_donut_id": 999999},
            {"base_donut_id": self.dead_base.id},
            {"base_donut_id": self.base.id, "sauce_id": 999999},
            {"base_donut_id": self.base.id, "topping_ids": [999999]},
            {"base_donut_id": self.base.id, "topping_ids": [self.dead_top.id]},
        ]
        for payload in cases:
            self.assertEqual(self.post(payload).status_code, 400, payload)

    def test_duplicate_toppings_rejected(self):
        res = self.post({"base_donut_id": self.base.id,
                         "topping_ids": [self.t1.id, self.t1.id]})
        self.assertEqual(res.status_code, 400)

    def test_too_many_toppings_rejected(self):
        tops = [Topping.objects.create(
            name=f"T{i}", slug=f"t-{i}", price=1000).id for i in range(9)]
        res = self.post({"base_donut_id": self.base.id, "topping_ids": tops})
        self.assertEqual(res.status_code, 400)


class SeedCommandTests(TestCase):
    def test_seed_idempotent(self):
        call_command("seed_catalog")
        counts = (BaseDonut.objects.count(), Sauce.objects.count(),
                  Topping.objects.count())
        self.assertEqual(counts, (4, 3, 8))
        call_command("seed_catalog")
        self.assertEqual(
            (BaseDonut.objects.count(), Sauce.objects.count(),
             Topping.objects.count()), counts)

    def test_seed_preserves_admin_price(self):
        call_command("seed_catalog")
        base = BaseDonut.objects.get(slug="classic-ring")
        base.price = 123456
        base.save()
        call_command("seed_catalog")
        self.assertEqual(BaseDonut.objects.get(slug="classic-ring").price, 123456)
        self.assertEqual(BaseDonut.objects.count(), 4)


class CatalogAdminTests(TestCase):
    def test_admin_requires_login(self):
        res = APIClient().get("/admin/catalog/basedonut/")
        self.assertIn(res.status_code, (301, 302))

    def test_admin_changelist_for_staff(self):
        from django.contrib.auth.models import User

        admin = User.objects.create_superuser("root", "root@x.test", "pw")
        client = APIClient()
        client.force_authenticate(user=admin)
        # Admin views use session auth; use Django test client instead.
        from django.test import Client

        c = Client()
        c.force_login(admin)
        for url in ("/admin/catalog/basedonut/", "/admin/catalog/sauce/",
                    "/admin/catalog/topping/"):
            res = c.get(url)
            self.assertEqual(res.status_code, 200, url)
