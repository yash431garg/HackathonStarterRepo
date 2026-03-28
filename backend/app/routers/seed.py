"""Seed endpoint — populates DB with demo data."""
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Product, Order, Customer

router = APIRouter(prefix="/admin", tags=["admin"])

PRODUCTS = [
    {"id": "gid://shopify/Product/1", "title": "Classic Logo Tee", "type": "T-Shirts", "price": 29.0, "inventory": 45},
    {"id": "gid://shopify/Product/2", "title": "Everyday Hoodie", "type": "Hoodies", "price": 65.0, "inventory": 22},
    {"id": "gid://shopify/Product/3", "title": "Slim Fit Chinos", "type": "Pants", "price": 79.0, "inventory": 3},
    {"id": "gid://shopify/Product/4", "title": "Canvas Sneakers", "type": "Footwear", "price": 89.0, "inventory": 0},
    {"id": "gid://shopify/Product/5", "title": "Leather Wallet", "type": "Accessories", "price": 45.0, "inventory": 60},
    {"id": "gid://shopify/Product/6", "title": "Denim Jacket", "type": "Jackets", "price": 120.0, "inventory": 8},
    {"id": "gid://shopify/Product/7", "title": "Merino Wool Sweater", "type": "Knitwear", "price": 95.0, "inventory": 15},
    {"id": "gid://shopify/Product/8", "title": "Running Shorts", "type": "Activewear", "price": 39.0, "inventory": 2},
    {"id": "gid://shopify/Product/9", "title": "Crossbody Bag", "type": "Bags", "price": 85.0, "inventory": 18},
    {"id": "gid://shopify/Product/10", "title": "Baseball Cap", "type": "Accessories", "price": 32.0, "inventory": 90},
    {"id": "gid://shopify/Product/11", "title": "Linen Shirt", "type": "Shirts", "price": 55.0, "inventory": 4},
    {"id": "gid://shopify/Product/12", "title": "Tech Backpack", "type": "Bags", "price": 110.0, "inventory": 12},
]

CUSTOMER_NAMES = [
    ("James", "Chen"), ("Sarah", "Kim"), ("Marcus", "Johnson"), ("Priya", "Patel"),
    ("Emily", "Wong"), ("David", "Martinez"), ("Aisha", "Thompson"), ("Ryan", "Lee"),
    ("Nina", "Garcia"), ("Tyler", "Brown"), ("Zoe", "Taylor"), ("Alex", "Wilson"),
    ("Maya", "Davis"), ("Jordan", "Miller"), ("Sam", "Anderson"), ("Casey", "White"),
    ("Morgan", "Jackson"), ("Riley", "Harris"), ("Taylor", "Clark"), ("Quinn", "Lewis"),
]


@router.post("/seed")
async def seed_database(db: AsyncSession = Depends(get_db)):
    # Check if already seeded
    result = await db.execute(select(func.count()).select_from(Product))
    count = result.scalar()
    if count and count > 0:
        return {"ok": True, "message": f"Already seeded ({count} products exist)"}

    now = datetime.now(timezone.utc)

    # Products
    for p in PRODUCTS:
        variants = [
            {"id": f"var_{p['id']}_{i}", "title": s, "price": p["price"],
             "sku": f"SKU-{p['id'].split('/')[-1]}-{i}", "inventory_quantity": p["inventory"] // 3 + 1}
            for i, s in enumerate(["S", "M", "L"])
        ]
        db.add(Product(
            id=p["id"], title=p["title"], handle=p["title"].lower().replace(" ", "-"),
            status="active", vendor="House Brand", product_type=p["type"],
            price_min=p["price"], price_max=p["price"], variants=variants,
            collections=["Best Sellers"], inventory_total=p["inventory"],
            created_at=(now - timedelta(days=90)).isoformat(), updated_at=now.isoformat(),
        ))

    # Customers
    customers = []
    for i, (first, last) in enumerate(CUSTOMER_NAMES):
        days_ago = random.randint(1, 90)
        last_order = now - timedelta(days=random.randint(1, days_ago))
        spent = round(random.uniform(30, 800), 2)
        c = Customer(
            id=f"gid://shopify/Customer/{i+1}",
            email=f"{first.lower()}.{last.lower()}@example.com",
            first_name=first, last_name=last,
            orders_count=random.randint(1, 8), total_spent=spent,
            tags=["vip"] if spent > 400 else [],
            created_at=(now - timedelta(days=days_ago)).isoformat(),
            last_order_at=last_order.isoformat(),
        )
        db.add(c)
        customers.append(c)

    await db.flush()

    # Orders
    order_count = 0
    for day in range(90, 0, -1):
        daily_orders = random.randint(1, 5) if day > 30 else random.randint(3, 10)
        for _ in range(daily_orders):
            order_date = now - timedelta(days=day, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            items = random.sample(PRODUCTS, random.randint(1, 3))
            line_items = []
            total = 0.0
            for item in items:
                qty = random.randint(1, 2)
                amount = item["price"] * qty
                total += amount
                line_items.append({
                    "product_id": item["id"], "title": item["title"],
                    "variant_title": random.choice(["S", "M", "L"]),
                    "quantity": qty, "price": str(item["price"]), "amount": amount,
                })
            customer = random.choice(customers)
            order_count += 1
            db.add(Order(
                id=f"gid://shopify/Order/{order_count}",
                order_number=str(1000 + order_count),
                total_price=round(total, 2), subtotal_price=round(total * 0.9, 2),
                total_discounts=0.0, total_tax=round(total * 0.1, 2), currency="USD",
                financial_status=random.choices(["paid", "paid", "paid", "pending", "refunded"], weights=[7,7,7,2,1])[0],
                fulfillment_status=random.choice(["fulfilled", "unfulfilled"]),
                line_items=line_items, customer_id=customer.id,
                customer_email=customer.email,
                customer_name=f"{customer.first_name} {customer.last_name}",
                processed_at=order_date.isoformat(), created_at=order_date.isoformat(),
                is_simulated=True,
            ))

    await db.commit()
    return {"ok": True, "message": f"Seeded {len(PRODUCTS)} products, {len(customers)} customers, {order_count} orders"}
