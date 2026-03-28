"""Inventory predictions — days until stockout based on sales velocity."""
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Order, Product

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _parse_date(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


@router.get("/predictions")
async def get_predictions(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    cutoff_7d = now - timedelta(days=7)

    # Fetch recent orders
    result = await db.execute(
        select(Order).where(Order.processed_at >= cutoff_7d.isoformat())
    )
    orders = result.scalars().all()

    # Compute units sold per product in last 7 days
    units_7d: dict[str, int] = defaultdict(int)
    for order in orders:
        for item in (order.line_items or []):
            pid = item.get("product_id", "")
            if pid:
                units_7d[pid] += int(item.get("quantity", 0))

    # Fetch all products
    prod_result = await db.execute(select(Product).where(Product.status == "active"))
    products = prod_result.scalars().all()

    predictions = []
    for p in products:
        sold_7d = units_7d.get(p.id, 0)
        daily_velocity = sold_7d / 7.0
        stock = p.inventory_total or 0

        if daily_velocity > 0:
            days_left = stock / daily_velocity
        else:
            days_left = 999  # No sales = no stockout risk

        # Status
        if days_left <= 3:
            status = "critical"
        elif days_left <= 7:
            status = "warning"
        elif days_left <= 14:
            status = "low"
        else:
            status = "ok"

        # Projection: inventory for next 14 days
        projection = []
        for day in range(15):
            projected = max(0, stock - (daily_velocity * day))
            projection.append(round(projected, 1))

        predictions.append({
            "product_id": p.id,
            "title": p.title,
            "product_type": p.product_type,
            "current_stock": stock,
            "sold_7d": sold_7d,
            "daily_velocity": round(daily_velocity, 2),
            "days_until_stockout": round(days_left, 1) if days_left < 999 else None,
            "status": status,
            "projection": projection,
        })

    # Sort: critical first, then by days_left ascending
    def sort_key(p):
        order = {"critical": 0, "warning": 1, "low": 2, "ok": 3}
        days = p["days_until_stockout"] if p["days_until_stockout"] is not None else 999
        return (order[p["status"]], days)

    predictions.sort(key=sort_key)

    return {"predictions": predictions, "generated_at": now.isoformat()}
