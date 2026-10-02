"""Cálculos derivados: saldo/preço médio de estoque, situação do talhão, custos, safra atual."""
from __future__ import annotations

import math
from collections import defaultdict
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Event, Farm, Field, Season, Simulation, StockItem, StockMovement


def today() -> date:
    return date.today()


def get_farm(session: Session) -> Farm:
    farm = session.scalars(select(Farm).limit(1)).first()
    if farm is None:
        raise LookupError("Nenhuma propriedade cadastrada — rode scripts/seed_demo.py")
    return farm


def current_season(session: Session, farm_id: int, on: date | None = None) -> Season | None:
    on = on or today()
    seasons = session.scalars(select(Season).where(Season.farm_id == farm_id).order_by(Season.start)).all()
    for s in seasons:
        if s.start <= on <= s.end:
            return s
    return seasons[-1] if seasons else None


# ---------- estoque ----------
def item_balance(item: StockItem) -> float:
    total = 0.0
    for m in item.movements:
        total += m.quantity if m.kind in ("entrada", "ajuste") else -m.quantity
    return round(total, 3)


def item_avg_price(item: StockItem) -> float | None:
    entries = [m for m in item.movements if m.kind == "entrada" and m.unit_price is not None]
    qty = sum(m.quantity for m in entries)
    return round(sum(m.quantity * m.unit_price for m in entries) / qty, 4) if qty else None


def item_dict(item: StockItem) -> dict:
    balance = item_balance(item)
    avg = item_avg_price(item)
    days_to_expiry = (item.expiry_date - today()).days if item.expiry_date else None
    return {
        "id": item.id, "name": item.name, "category": item.category, "unit": item.unit,
        "quantity": balance, "min_quantity": item.min_quantity, "avg_price": avg,
        "stock_value": round(balance * avg, 2) if avg is not None else None,
        "expiry_date": item.expiry_date.isoformat() if item.expiry_date else None,
        "days_to_expiry": days_to_expiry, "supplier": item.supplier, "crop": item.crop,
        "agrofit_registration": item.agrofit_registration,
        "low_stock": balance < item.min_quantity,
    }


def movement_dict(m: StockMovement) -> dict:
    price = m.unit_price if m.unit_price is not None else item_avg_price(m.item)
    return {
        "id": m.id, "item_id": m.item_id, "item_name": m.item.name, "unit": m.item.unit,
        "category": m.item.category, "kind": m.kind, "quantity": m.quantity,
        "unit_price": m.unit_price, "value": round(m.quantity * price, 2) if price is not None else None,
        "date": m.date.isoformat(), "supplier": m.supplier, "note": m.note, "event_id": m.event_id,
        "field_id": m.event.field_id if m.event else None,
    }


# ---------- talhões ----------
def field_status(session: Session, field: Field) -> dict:
    events = session.scalars(
        select(Event).where(Event.field_id == field.id, Event.type.in_(["plantio", "colheita"]))
        .order_by(Event.date.desc(), Event.id.desc())
    ).all()
    last = events[0] if events else None
    if last and last.type == "plantio":
        days = (today() - last.date).days
        crop = last.details.get("crop") or field.crop
        return {"stage": "plantado", "crop": crop, "since": last.date.isoformat(), "days": days,
                "label": f"{crop} · {days} dias após plantio"}
    if last and last.type == "colheita":
        return {"stage": "colhido", "crop": last.details.get("crop") or field.crop, "since": last.date.isoformat(),
                "days": (today() - last.date).days, "label": f"Colhido em {last.date.strftime('%d/%m/%Y')} · aguardando plantio"}
    return {"stage": "vazio", "crop": field.crop, "since": None, "days": None,
            "label": f"Planejado: {field.crop}" if field.crop else "Sem cultura definida"}


def field_dict(session: Session, field: Field) -> dict:
    return {
        "id": field.id, "name": field.name, "geometry": field.geometry, "area_ha": field.area_ha,
        "crop": field.crop, "soil": field.soil, "irrigated": field.irrigated,
        "seed_rate_kg_ha": field.seed_rate_kg_ha, "color": field.color, "notes": field.notes,
        "status": field_status(session, field),
    }


def polygon_area_ha(geometry: dict) -> float:
    """Área geodésica aproximada (fórmula esférica) de um Polygon GeoJSON, em hectares."""
    ring = geometry["coordinates"][0]
    r = 6378137.0
    total = 0.0
    for (lon1, lat1), (lon2, lat2) in zip(ring, ring[1:]):
        total += math.radians(lon2 - lon1) * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2)))
    return round(abs(total * r * r / 2.0) / 10000, 2)


# ---------- eventos ----------
def event_dict(e: Event) -> dict:
    return {
        "id": e.id, "field_id": e.field_id, "season_id": e.season_id, "type": e.type,
        "date": e.date.isoformat(), "title": e.title, "details": e.details, "origin": e.origin,
        "inputs": [movement_dict(m) for m in e.movements],
    }


# ---------- custos ----------
def costs_report(session: Session, farm: Farm, season: Season | None) -> dict:
    """Comprado (entradas no período da safra) e aplicado (saídas ligadas a eventos da safra × preço médio)."""
    items = session.scalars(select(StockItem).where(StockItem.farm_id == farm.id)).all()
    fields = {f.id: f.name for f in session.scalars(select(Field).where(Field.farm_id == farm.id))}
    purchased = defaultdict(float)
    applied = defaultdict(float)
    by_field = defaultdict(float)
    consumption = defaultdict(lambda: {"quantity": 0.0, "value": 0.0})
    for item in items:
        avg = item_avg_price(item) or 0.0
        for m in item.movements:
            in_season = season is None or season.start <= m.date <= season.end
            if m.kind == "entrada" and in_season:
                purchased[item.category] += m.quantity * (m.unit_price or 0)
            if m.kind == "saida":
                ev_season = m.event.season_id if m.event else None
                if season is None or ev_season == season.id or (ev_season is None and in_season):
                    value = m.quantity * avg
                    applied[item.category] += value
                    fid = m.event.field_id if m.event else None
                    by_field[fields.get(fid, "Geral")] += value
                    c = consumption[item.name]
                    c["quantity"] += m.quantity
                    c["value"] += value
                    c["unit"] = item.unit
    harvest = []
    q = select(Event).where(Event.farm_id == farm.id, Event.type == "colheita")
    if season:
        q = q.where(Event.season_id == season.id)
    for e in session.scalars(q):
        harvest.append({"field": fields.get(e.field_id), "date": e.date.isoformat(), "crop": e.details.get("crop"),
                        "quantity": e.details.get("harvested_qty"), "unit": e.details.get("harvested_unit")})
    rnd = lambda d: {k: round(v, 2) for k, v in sorted(d.items(), key=lambda kv: -kv[1])}
    return {
        "season": season.name if season else "todas",
        "purchased_by_category": rnd(purchased), "purchased_total": round(sum(purchased.values()), 2),
        "applied_by_category": rnd(applied), "applied_total": round(sum(applied.values()), 2),
        "applied_by_field": rnd(by_field),
        "consumption": [{"item": k, **{kk: (round(vv, 2) if isinstance(vv, float) else vv) for kk, vv in v.items()}}
                        for k, v in sorted(consumption.items(), key=lambda kv: -kv[1]["value"])],
        "harvest": harvest,
        "method": "Comprado = entradas no período da safra (qtd × preço). Aplicado = saídas vinculadas a eventos da safra × preço médio de compra.",
    }


# ---------- simulações ----------
def simulation_dict(s: Simulation) -> dict:
    return {
        "id": s.id, "farm_id": s.farm_id, "field_id": s.field_id,
        "season_id": s.season_id, "name": s.name, "crop": s.crop,
        "area_ha": s.area_ha, "productivity": s.productivity,
        "price_saca": s.price_saca, "cost_ha": s.cost_ha,
        "price_var_pct": s.price_var_pct, "prod_var_pct": s.prod_var_pct,
        "sources": s.sources, "results": s.results,
        "notes": s.notes, "created_at": s.created_at.isoformat(),
    }
