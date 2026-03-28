"""AI Style Advisor chat endpoint."""
import json
import os

import anthropic
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Product

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """You are a friendly personal style advisor for an online clothing store. Your job is to recommend products from our catalog that perfectly match the customer.

You gather information through a natural conversation — ask ONE question at a time. Collect:
1. Age (to understand style maturity)
2. Gender / how they like to dress
3. Size (S/M/L/XL)
4. Skin tone (fair, light, medium, olive, tan, deep) — use this to recommend flattering colors
5. Style preference (casual, smart-casual, sporty, formal)
6. Budget range

Color guidance by skin tone:
- Fair/Light: navy, burgundy, forest green, soft pastels — avoid stark white or neon
- Medium/Olive: earthy tones, warm reds, mustard, olive green — avoid muddy browns
- Tan/Deep: bright colors, white, cobalt blue, jewel tones — avoid dark navy or black overload

Once you have enough info (at least skin tone + size + one preference), recommend 2-3 specific products from the catalog with a short reason for each. Format recommendations like this:

**[Product Title]** — $[price]
*Why it works for you:* [1 sentence reason based on their skin tone/style]

Keep responses short, warm, and conversational. Never ask more than one question at a time."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Stream a chat response from the style advisor."""
    # Fetch products for context
    result = await db.execute(select(Product).where(Product.status == "active"))
    products = result.scalars().all()

    catalog = []
    for p in products:
        catalog.append({
            "title": p.title,
            "type": p.product_type,
            "price": p.price_min,
            "inventory": p.inventory_total,
        })

    catalog_text = "\n".join(
        f"- {p['title']} ({p['type']}) — ${p['price']:.2f} | Stock: {p['inventory']}"
        for p in catalog
    )

    system = f"{SYSTEM_PROMPT}\n\nCurrent catalog:\n{catalog_text}"

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        from app.config import get_settings
        api_key = get_settings().ANTHROPIC_API_KEY

    client = anthropic.Anthropic(api_key=api_key)

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=system,
        messages=messages,
    )

    return {"reply": response.content[0].text}
