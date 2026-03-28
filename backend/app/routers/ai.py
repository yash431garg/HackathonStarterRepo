"""AI CEO endpoint — uses Claude to analyze store data and return recommendations."""
import json
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import anthropic
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Order, Product, Customer

router = APIRouter(prefix="/ai", tags=["ai"])


def _parse_date(date_str: str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


@router.get("/analyze")
async def analyze_store(db: AsyncSession = Depends(get_db)):
    """Fetch store snapshot and ask Claude for CEO-level recommendations."""

    # ── Gather data ────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    cutoff_7d = now - timedelta(days=7)
    cutoff_30d = now - timedelta(days=30)

    # Recent orders
    result = await db.execute(
        select(Order).where(Order.processed_at >= cutoff_30d.isoformat()).order_by(Order.processed_at.desc())
    )
    orders = result.scalars().all()

    # All products
    prod_result = await db.execute(select(Product))
    products = prod_result.scalars().all()

    # All customers
    cust_result = await db.execute(select(Customer))
    customers = cust_result.scalars().all()

    # ── Compute metrics ────────────────────────────────────────────────────
    orders_7d = [o for o in orders if _parse_date(o.processed_at) and _parse_date(o.processed_at) >= cutoff_7d]
    orders_30d = orders

    revenue_7d = sum(o.total_price for o in orders_7d)
    revenue_30d = sum(o.total_price for o in orders_30d)
    aov_7d = revenue_7d / len(orders_7d) if orders_7d else 0

    # Revenue by day for trend
    daily_rev: dict[str, float] = defaultdict(float)
    for o in orders_30d:
        dt = _parse_date(o.processed_at)
        if dt:
            daily_rev[dt.strftime("%Y-%m-%d")] += o.total_price
    recent_days = sorted(daily_rev.items())[-14:]

    # Low stock products
    low_stock = []
    for p in products:
        total_inv = sum(v.get("inventory_quantity", 0) for v in (p.variants or []))
        if total_inv < 10 and p.status == "active":
            low_stock.append({"title": p.title, "inventory": total_inv})
    low_stock.sort(key=lambda x: x["inventory"])

    # Top products by revenue
    product_revenue: dict[str, dict] = {}
    for o in orders_30d:
        for item in (o.line_items or []):
            pid = item.get("product_id", "unknown")
            if pid not in product_revenue:
                product_revenue[pid] = {"title": item.get("title", "Unknown"), "revenue": 0.0, "units": 0}
            product_revenue[pid]["revenue"] += float(item.get("amount", 0))
            product_revenue[pid]["units"] += int(item.get("quantity", 0))
    top_products = sorted(product_revenue.values(), key=lambda x: x["revenue"], reverse=True)[:5]

    # Customer segments (simple RFM)
    high_value = [c for c in customers if float(c.total_spent or 0) > 200]
    at_risk = [c for c in customers if c.orders_count and c.orders_count >= 2 and c.last_order_at]
    dormant = []
    for c in at_risk:
        last_dt = _parse_date(c.last_order_at)
        if last_dt and (now - last_dt).days > 60:
            dormant.append(c)

    # Financial status breakdown
    status_counts: dict[str, int] = defaultdict(int)
    for o in orders_7d:
        status_counts[o.financial_status or "unknown"] += 1

    # ── Build context for Claude ───────────────────────────────────────────
    context = {
        "snapshot_date": now.strftime("%Y-%m-%d %H:%M UTC"),
        "revenue": {
            "last_7_days": round(revenue_7d, 2),
            "last_30_days": round(revenue_30d, 2),
            "aov_7d": round(aov_7d, 2),
            "daily_trend_14d": [{"date": d, "revenue": round(r, 2)} for d, r in recent_days],
        },
        "orders": {
            "count_7d": len(orders_7d),
            "count_30d": len(orders_30d),
            "financial_status_7d": dict(status_counts),
        },
        "inventory": {
            "total_products": len(products),
            "low_stock_products": low_stock[:10],
        },
        "top_products_30d": top_products,
        "customers": {
            "total": len(customers),
            "high_value_over_200": len(high_value),
            "dormant_60d": len(dormant),
        },
    }

    # ── Call Claude ────────────────────────────────────────────────────────
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Try loading from .env manually
        from app.config import get_settings
        settings = get_settings()
        api_key = getattr(settings, "ANTHROPIC_API_KEY", None)

    if not api_key:
        return {
            "error": "ANTHROPIC_API_KEY not set",
            "store_data": context,
            "recommendations": [],
        }

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""You are an AI CEO for a Shopify e-commerce store. Analyze this store snapshot and provide exactly 5 prioritized, actionable recommendations.

Store Data:
{json.dumps(context, indent=2)}

Return a JSON array of exactly 5 recommendations. Each must have:
- "priority": "critical" | "high" | "medium"
- "category": "inventory" | "revenue" | "customers" | "marketing" | "operations"
- "title": short title (max 8 words)
- "insight": what you observed in the data (1-2 sentences)
- "action": exactly what to do right now (1-2 sentences, specific and actionable)
- "impact": expected business impact (1 sentence)
- "action_type": one of "send_email" | "create_discount" | "restock" | "none"
- "action_params": object with params if action_type is not "none", else null
  - for send_email: {{"subject": "...", "preview": "first 100 chars of email body"}}
  - for create_discount: {{"code": "DISCOUNT20", "percentage": 20}}
  - for restock: {{"product_title": "..."}}

Return ONLY the JSON array, no other text."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        recommendations = json.loads(raw)
    except json.JSONDecodeError:
        recommendations = [{"title": "Parse error", "insight": raw, "action": "", "priority": "medium", "category": "operations", "impact": "", "action_type": "none", "action_params": None}]

    return {
        "store_data": context,
        "recommendations": recommendations,
    }
