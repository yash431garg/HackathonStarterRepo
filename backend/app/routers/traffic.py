"""Traffic source tracking."""
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])

TRAFFIC_FILE = Path(__file__).resolve().parent.parent.parent.parent / "traffic_sources.json"


def _load() -> list:
    if TRAFFIC_FILE.exists():
        try:
            return json.loads(TRAFFIC_FILE.read_text())
        except Exception:
            return []
    return []


def _save(data: list):
    TRAFFIC_FILE.write_text(json.dumps(data))


class TrafficEvent(BaseModel):
    source: str  # e.g. "Instagram", "Google Ads", "TikTok", "Direct", "Other"


@router.post("/track-source")
async def track_source(event: TrafficEvent):
    data = _load()
    data.append({
        "source": event.source,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    _save(data)
    return {"ok": True}


@router.get("/traffic-sources")
async def get_traffic_sources():
    data = _load()
    counts: dict[str, int] = defaultdict(int)
    for entry in data:
        counts[entry["source"]] += 1
    return {
        "total": len(data),
        "sources": [{"source": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])],
    }
