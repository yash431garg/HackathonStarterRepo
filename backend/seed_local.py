#!/usr/bin/env python3
"""Seed local SQLite DB with realistic demo data — no Shopify token needed."""
import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import delete
from app.database import init_db, async_session_factory
from app.models import Product, Order, Customer

# ── Products ───────────────────────────────────────────────────────────────

PRODUCTS = [
    {"id": "gid://shopify/Product/1", "title": "Classic Logo Tee", "type": "T-Shirts", "vendor": "House Brand", "price": 29.0, "inventory": 45},
    {"id": "gid://shopify/Product/2", "title": "Everyday Hoodie", "type": "Hoodies", "vendor": "House Brand", "price": 65.0, "inventory": 22},
    {"id": "gid://shopify/Product/3", "title": "Slim Fit Chinos", "type": "Pants", "vendor": "House Brand", "price": 79.0, "inventory": 3},
    {"id": "gid://shopify/Product/4", "title": "Canvas Sneakers", "type": "Footwear", "vendor": "House Brand", "price": 89.0, "inventory": 0},
    {"id": "gid://shopify/Product/5", "title": "Leather Wallet", "type": "Accessories", "vendor": "House Brand", "price": 45.0, "inventory": 60},
    {"id": "gid://shopify/Product/6", "title": "Denim Jacket", "type": "Jackets", "vendor": "House Brand", "price": 120.0, "inventory": 8},
    {"id": "gid://shopify/Product/7", "title": "Merino Wool Sweater", "type": "Knitwear", "vendor": "House Brand", "price": 95.0, "inventory": 15},
    {"id": "gid://shopify/Product/8", "title": "Running Shorts", "type": "Activewear", "vendor": "House Brand", "price": 39.0, "inventory": 2},
    {"id": "gid://shopify/Product/9", "title": "Crossbody Bag", "type": "Bags", "vendor": "House Brand", "price": 85.0, "inventory": 18},
    {"id": "gid://shopify/Product/10", "title": "Baseball Cap", "type": "Accessories", "vendor": "House Brand", "price": 32.0, "inventory": 90},
    {"id": "gid://shopify/Product/11", "title": "Linen Shirt", "type": "Shirts", "vendor": "House Brand", "price": 55.0, "inventory": 4},
    {"id": "gid://shopify/Product/12", "title": "Tech Backpack", "type": "Bags", "vendor": "House Brand", "price": 110.0, "inventory": 12},
]

CUSTOMER_NAMES = [
    ("James", "Chen"), ("Sarah", "Kim"), ("Marcus", "Johnson"), ("Priya", "Patel"),
    ("Emily", "Wong"), ("David", "Martinez"), ("Aisha", "Thompson"), ("Ryan", "Lee"),
    ("Nina", "Garcia"), ("Tyler", "Brown"), ("Zoe", "Taylor"), ("Alex", "Wilson"),
    ("Maya", "Davis"), ("Jordan", "Miller"), ("Sam", "Anderson"), ("Casey", "White"),
    ("Morgan", "Jackson"), ("Riley", "Harris"), ("Taylor", "Clark"), ("Quinn", "Lewis"),
]


def make_order_id(n):
    return f"gid://shopify/Order/{n}"


def make_customer_id(n):
    return f"gid://shopify/Customer/{n}"


async def seed():
    await init_db()

    async with async_session_factory() as db:
        # Clear existing data
        await db.execute(delete(Order))
        await db.execute(delete(Product))
        await db.execute(delete(Customer))
        await db.commit()
        print("Cleared existing data")

        # ── Seed Products ──────────────────────────────────────────────────
        now = datetime.now(timezone.utc)
        for p in PRODUCTS:
            variants = [
                {"id": f"var_{p['id']}_{i}", "title": s, "price": p["price"],
                 "sku": f"SKU-{p['id'].split('/')[-1]}-{i}", "inventory_quantity": p["inventory"] // 3 + 1}
                for i, s in enumerate(["S", "M", "L"])
            ]
            db.add(Product(
                id=p["id"],
                title=p["title"],
                handle=p["title"].lower().replace(" ", "-"),
                status="active",
                vendor=p["vendor"],
                product_type=p["type"],
                price_min=p["price"],
                price_max=p["price"],
                variants=variants,
                collections=["Best Sellers"],
                inventory_total=p["inventory"],
                created_at=(now - timedelta(days=90)).isoformat(),
                updated_at=now.isoformat(),
            ))
        await db.commit()
        print(f"Seeded {len(PRODUCTS)} products")

        # ── Seed Customers ─────────────────────────────────────────────────
        customers = []
        for i, (first, last) in enumerate(CUSTOMER_NAMES):
            days_ago = random.randint(1, 90)
            last_order = now - timedelta(days=random.randint(1, days_ago))
            order_count = random.randint(1, 8)
            spent = round(random.uniform(30, 800), 2)
            c = Customer(
                id=make_customer_id(i + 1),
                email=f"{first.lower()}.{last.lower()}@example.com",
                first_name=first,
                last_name=last,
                orders_count=order_count,
                total_spent=spent,
                tags=["vip"] if spent > 400 else [],
                created_at=(now - timedelta(days=days_ago)).isoformat(),
                last_order_at=last_order.isoformat(),
            )
            db.add(c)
            customers.append(c)
        await db.commit()
        print(f"Seeded {len(customers)} customers")

        # ── Seed Orders (90 days of history) ──────────────────────────────
        order_count = 0
        for day in range(90, 0, -1):
            # More orders on recent days
            daily_orders = random.randint(1, 5) if day > 30 else random.randint(3, 10)
            for _ in range(daily_orders):
                order_date = now - timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
                # Pick 1-3 random products
                items = random.sample(PRODUCTS, random.randint(1, 3))
                line_items = []
                total = 0.0
                for item in items:
                    qty = random.randint(1, 2)
                    amount = item["price"] * qty
                    total += amount
                    line_items.append({
                        "product_id": item["id"],
                        "title": item["title"],
                        "variant_title": random.choice(["S", "M", "L"]),
                        "quantity": qty,
                        "price": str(item["price"]),
                        "amount": amount,
                    })
                customer = random.choice(customers)
                order_count += 1
                db.add(Order(
                    id=make_order_id(order_count),
                    order_number=str(1000 + order_count),
                    total_price=round(total, 2),
                    subtotal_price=round(total * 0.9, 2),
                    total_discounts=0.0,
                    total_tax=round(total * 0.1, 2),
                    currency="USD",
                    financial_status=random.choices(["paid", "paid", "paid", "pending", "refunded"], weights=[7, 7, 7, 2, 1])[0],
                    fulfillment_status=random.choice(["fulfilled", "unfulfilled"]),
                    line_items=line_items,
                    customer_id=customer.id,
                    customer_email=customer.email,
                    customer_name=f"{customer.first_name} {customer.last_name}",
                    processed_at=order_date.isoformat(),
                    created_at=order_date.isoformat(),
                    is_simulated=True,
                ))

        await db.commit()
        print(f"Seeded {order_count} orders across 90 days")
        print("\nDone! Restart the backend and your dashboard will have live data.")


if __name__ == "__main__":
    asyncio.run(seed())
