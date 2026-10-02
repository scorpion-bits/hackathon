"""API REST do AgroBits. Contrato resumido em docs/api.md (documentação interativa em /docs)."""
from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field as PField
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import current_producer
from ..db import get_session
from ..models import AlertState, Event, Field, ProfileFact, Season, StockItem, StockMovement
from ..services import farmdata as fd
from ..services import live
from ..services import opendata as od
from ..services.insights import compute_alerts, plan_planting
from ..services.weather import forecast

# Toda rota enxerga só os dados da conta atual (auth.current_producer → session.info["producer_id"]).
router = APIRouter(prefix="/api", dependencies=[Depends(current_producer)])
DB = Depends(get_session)


def farm_or_404(session: Session):
    try:
        return fd.get_farm(session)
    except LookupError as exc:
        raise HTTPException(404, str(exc)) from exc


def owned(session: Session, obj) -> bool:
    """O objeto pertence à conta atual? (talhão, evento, item, safra → fazenda; fato → produtor)"""
    if hasattr(obj, "farm_id"):
        farm = fd.find_farm(session)
        return farm is not None and obj.farm_id == farm.id
    if hasattr(obj, "producer_id"):
        return obj.producer_id == session.info.get("producer_id")
    return True


def get_or_404(session: Session, model, obj_id: int):
    obj = session.get(model, obj_id)
    if obj is None or not owned(session, obj):
        raise HTTPException(404, f"{model.__name__} {obj_id} não encontrado")
    return obj


# ---------------- propriedade / painel ----------------
@router.get("/farm")
def get_farm(session: Session = DB):
    farm = fd.find_farm(session)
    if farm is None:
        return None  # conta nova, ainda sem propriedade
    season = fd.current_season(session, farm.id)
    seasons = session.scalars(select(Season).where(Season.farm_id == farm.id).order_by(Season.start)).all()
    return {
        "id": farm.id, "name": farm.name, "municipality": farm.municipality, "uf": farm.uf, "geocode": farm.geocode,
        "lat": farm.lat, "lon": farm.lon, "total_area_ha": farm.total_area_ha,
        "producer": {"id": farm.producer.id, "name": farm.producer.name, "is_demo": farm.producer.is_demo},
        "current_season": {"id": season.id, "name": season.name} if season else None,
        "seasons": [{"id": s.id, "name": s.name, "start": s.start.isoformat(), "end": s.end.isoformat()} for s in seasons],
    }


@router.get("/dashboard")
def dashboard(session: Session = DB):
    farm = farm_or_404(session)
    season = fd.current_season(session, farm.id)
    fields = [fd.field_dict(session, f) for f in session.scalars(select(Field).where(Field.farm_id == farm.id))]
    items = [fd.item_dict(i) for i in session.scalars(select(StockItem).where(StockItem.farm_id == farm.id))]
    weather = forecast(farm.lat, farm.lon)
    alerts = compute_alerts(session, farm, weather)
    events = session.scalars(select(Event).where(Event.farm_id == farm.id)
                             .order_by(Event.date.desc(), Event.id.desc()).limit(8)).all()
    costs = fd.costs_report(session, farm, season)
    reg = od.region(farm.geocode)
    return {
        "season": season.name if season else None,
        "kpis": {
            "fields": len(fields), "area_ha": round(sum(f["area_ha"] for f in fields), 2),
            "planted": sum(1 for f in fields if f["status"]["stage"] == "plantado"),
            "stock_value": round(sum(i["stock_value"] or 0 for i in items), 2),
            "items_attention": sum(1 for i in items if i["low_stock"] or (i["days_to_expiry"] is not None and i["days_to_expiry"] <= 30 and i["quantity"] > 0)),
            "season_purchased": costs["purchased_total"], "season_applied": costs["applied_total"],
            "alerts_open": sum(1 for a in alerts if not a["read"]),
        },
        "fields": fields,
        "alerts": alerts[:6],
        "recent_events": [fd.event_dict(e) for e in events],
        "weather": weather,
        "region": {k: reg.get(k) for k in ("available", "municipality", "uf", "drones", "planes", "authorizations_last_year",
                                            "insurance_policies", "insurance_top_crops", "zarc_crops", "uf_drones",
                                            "br_municipalities_with_drones", "br_municipalities", "sources", "notes")},
    }


# ---------------- talhões ----------------
class FieldIn(BaseModel):
    name: str
    geometry: dict
    crop: str | None = None
    soil: str | None = PField(None, pattern="^(arenoso|medio|argiloso)$")
    irrigated: bool = False
    seed_rate_kg_ha: float | None = None
    color: str | None = None
    notes: str | None = None


@router.get("/fields")
def list_fields(session: Session = DB):
    farm = farm_or_404(session)
    return [fd.field_dict(session, f) for f in session.scalars(select(Field).where(Field.farm_id == farm.id))]


@router.post("/fields", status_code=201)
def create_field(body: FieldIn, session: Session = DB):
    farm = farm_or_404(session)
    f = Field(farm_id=farm.id, area_ha=fd.polygon_area_ha(body.geometry), **body.model_dump())
    session.add(f)
    session.commit()
    return fd.field_dict(session, f)


@router.put("/fields/{field_id}")
def update_field(field_id: int, body: FieldIn, session: Session = DB):
    f = get_or_404(session, Field, field_id)
    for k, v in body.model_dump().items():
        setattr(f, k, v)
    f.area_ha = fd.polygon_area_ha(body.geometry)
    session.commit()
    return fd.field_dict(session, f)


@router.delete("/fields/{field_id}", status_code=204)
def delete_field(field_id: int, session: Session = DB):
    f = get_or_404(session, Field, field_id)
    for e in session.scalars(select(Event).where(Event.field_id == field_id)):
        e.field_id = None
    session.delete(f)
    session.commit()


@router.get("/fields/{field_id}/zarc")
def field_zarc(field_id: int, crop: str | None = None, session: Session = DB):
    farm = farm_or_404(session)
    f = get_or_404(session, Field, field_id)
    z = od.zarc_for(farm.geocode, crop or f.crop, f.soil, f.irrigated)
    z["today_decendio"] = od.decendio(fd.today())
    return z


@router.get("/fields/{field_id}/plan")
def field_plan(field_id: int, crop: str | None = None, seed_rate_kg_ha: float | None = None, session: Session = DB):
    farm = farm_or_404(session)
    return plan_planting(session, farm, get_or_404(session, Field, field_id), crop, seed_rate_kg_ha)


# ---------------- produção / caderno de campo ----------------
class InputUse(BaseModel):
    item_id: int
    quantity: float = PField(gt=0)


class EventIn(BaseModel):
    type: str = PField(pattern="^(plantio|aplicacao|colheita|observacao|outro)$")
    date: date
    field_id: int | None = None
    title: str | None = None
    details: dict = {}
    inputs: list[InputUse] = []
    origin: str = "manual"


EVENT_TITLES = {"plantio": "Plantio", "aplicacao": "Aplicação", "colheita": "Colheita", "observacao": "Observação", "outro": "Atividade"}


@router.get("/events")
def list_events(field_id: int | None = None, season_id: int | None = None, type: str | None = None, session: Session = DB):
    farm = farm_or_404(session)
    q = select(Event).where(Event.farm_id == farm.id)
    if field_id:
        q = q.where(Event.field_id == field_id)
    if season_id:
        q = q.where(Event.season_id == season_id)
    if type:
        q = q.where(Event.type == type)
    return [fd.event_dict(e) for e in session.scalars(q.order_by(Event.date.desc(), Event.id.desc()))]


@router.post("/events", status_code=201)
def create_event(body: EventIn, session: Session = DB):
    """Registra evento; insumos usados viram SAÍDAS de estoque (custo calculado pelo preço médio)."""
    farm = farm_or_404(session)
    field = get_or_404(session, Field, body.field_id) if body.field_id else None
    season = fd.current_season(session, farm.id, body.date)
    details = dict(body.details)
    if body.type == "plantio":
        details.setdefault("crop", field.crop if field else None)
        if field and details.get("crop"):
            field.crop = details["crop"]
    title = body.title or f"{EVENT_TITLES[body.type]}" + (f" · {details.get('crop')}" if details.get("crop") else "") + (f" · {field.name}" if field else "")
    ev = Event(farm_id=farm.id, field_id=body.field_id, season_id=season.id if season else None, type=body.type,
               date=body.date, title=title, details=details, origin=body.origin)
    session.add(ev)
    for use in body.inputs:
        item = get_or_404(session, StockItem, use.item_id)
        bal = fd.item_balance(item)
        if use.quantity > bal + 1e-9:
            raise HTTPException(422, f"Estoque insuficiente de {item.name}: saldo {bal:g} {item.unit}, pedido {use.quantity:g}.")
        session.add(StockMovement(item=item, event=ev, kind="saida", quantity=use.quantity, date=body.date,
                                  note=title))
    session.commit()
    session.refresh(ev)
    return fd.event_dict(ev)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, session: Session = DB):
    ev = get_or_404(session, Event, event_id)
    for m in list(ev.movements):
        session.delete(m)
    session.delete(ev)
    session.commit()


# ---------------- estoque ----------------
class ItemIn(BaseModel):
    name: str
    category: str = PField(pattern="^(semente|fertilizante|defensivo|combustivel|ferramenta|irrigacao|outro)$")
    unit: str
    min_quantity: float = 0
    expiry_date: date | None = None
    supplier: str | None = None
    crop: str | None = None
    agrofit_registration: str | None = None


class MovementIn(BaseModel):
    kind: str = PField(pattern="^(entrada|saida|ajuste)$")
    quantity: float
    date: date
    unit_price: float | None = None
    supplier: str | None = None
    note: str | None = None
    field_id: int | None = None  # saída direta para um talhão (gera evento "aplicacao")


@router.get("/stock/items")
def list_items(session: Session = DB):
    farm = farm_or_404(session)
    return [fd.item_dict(i) for i in session.scalars(select(StockItem).where(StockItem.farm_id == farm.id).order_by(StockItem.category, StockItem.name))]


@router.post("/stock/items", status_code=201)
def create_item(body: ItemIn, session: Session = DB):
    farm = farm_or_404(session)
    item = StockItem(farm_id=farm.id, **body.model_dump())
    session.add(item)
    session.commit()
    return fd.item_dict(item)


@router.put("/stock/items/{item_id}")
def update_item(item_id: int, body: ItemIn, session: Session = DB):
    item = get_or_404(session, StockItem, item_id)
    for k, v in body.model_dump().items():
        setattr(item, k, v)
    session.commit()
    return fd.item_dict(item)


@router.delete("/stock/items/{item_id}", status_code=204)
def delete_item(item_id: int, session: Session = DB):
    session.delete(get_or_404(session, StockItem, item_id))
    session.commit()


@router.get("/stock/movements")
def list_movements(item_id: int | None = None, session: Session = DB):
    farm = farm_or_404(session)
    q = select(StockMovement).join(StockItem).where(StockItem.farm_id == farm.id)
    if item_id:
        q = q.where(StockMovement.item_id == item_id)
    return [fd.movement_dict(m) for m in session.scalars(q.order_by(StockMovement.date.desc(), StockMovement.id.desc()))]


@router.post("/stock/items/{item_id}/movements", status_code=201)
def create_movement(item_id: int, body: MovementIn, session: Session = DB):
    farm = farm_or_404(session)
    item = get_or_404(session, StockItem, item_id)
    if body.kind == "saida" and body.quantity > fd.item_balance(item) + 1e-9:
        raise HTTPException(422, f"Estoque insuficiente: saldo {fd.item_balance(item):g} {item.unit}.")
    event = None
    season = fd.current_season(session, farm.id, body.date)
    if body.kind == "entrada":
        price = f" · R$ {body.quantity * body.unit_price:,.2f}" if body.unit_price else ""
        event = Event(farm_id=farm.id, season_id=season.id if season else None, type="compra", date=body.date,
                      title=f"Compra · {body.quantity:g} {item.unit} de {item.name}{price}",
                      details={"supplier": body.supplier or item.supplier})
    elif body.kind == "saida" and body.field_id:
        field = get_or_404(session, Field, body.field_id)
        event = Event(farm_id=farm.id, field_id=field.id, season_id=season.id if season else None, type="aplicacao",
                      date=body.date, title=f"Aplicação · {item.name} · {field.name}", details={})
    if event:
        session.add(event)
    m = StockMovement(item=item, event=event, kind=body.kind, quantity=body.quantity, unit_price=body.unit_price,
                      date=body.date, supplier=body.supplier or item.supplier, note=body.note)
    session.add(m)
    session.commit()
    return fd.movement_dict(m)


# ---------------- custos / relatórios ----------------
@router.get("/reports/costs")
def report_costs(season_id: int | None = None, session: Session = DB):
    farm = farm_or_404(session)
    season = get_or_404(session, Season, season_id) if season_id else fd.current_season(session, farm.id)
    return fd.costs_report(session, farm, season)


# ---------------- alertas ----------------
@router.get("/alerts")
def list_alerts(session: Session = DB):
    return compute_alerts(session, farm_or_404(session))


@router.post("/alerts/{key}/read", status_code=204)
def mark_alert_read(key: str, session: Session = DB):
    if session.get(AlertState, key) is None:
        session.add(AlertState(key=key))
        session.commit()


# ---------------- clima ----------------
@router.get("/weather")
def weather(session: Session = DB):
    farm = farm_or_404(session)
    return forecast(farm.lat, farm.lon)


@router.get("/climate/rain-history")
def rain_history(session: Session = DB):
    """Chuva dos últimos 30 dias × normal climatológica (NASA POWER, ao vivo com cache)."""
    farm = farm_or_404(session)
    return live.rain_vs_normal(farm.lat, farm.lon)


# ---------------- dados abertos ----------------
@router.get("/opendata/crops")
def crops(session: Session = DB):
    farm = farm_or_404(session)
    return {"zarc_crops": od.zarc_crops(farm.geocode),
            "other_crops": ["Café", "Cana-de-açúcar", "Laranja", "Hortaliças", "Pastagem", "Mandioca", "Eucalipto"]}


@router.get("/opendata/agrofit")
def agrofit(product: str, crop: str | None = None):
    return od.agrofit_check(product, crop)


@router.get("/opendata/agrofit/search")
def agrofit_search(q: str):
    return od.agrofit_search(q)


@router.get("/opendata/region")
def region(session: Session = DB):
    return od.region(farm_or_404(session).geocode)


@router.get("/opendata/boundary")
def boundary(session: Session = DB):
    """Contorno oficial do município da propriedade (IBGE Malhas, ao vivo com cache)."""
    return live.municipality_boundary(farm_or_404(session).geocode)


@router.get("/opendata/sources")
def sources():
    return od.all_sources()


# ---------------- perfil ----------------
class FactIn(BaseModel):
    label: str
    value: str
    origin: str = "declarado"


@router.get("/profile")
def profile(session: Session = DB):
    farm = farm_or_404(session)
    facts = session.scalars(select(ProfileFact).where(ProfileFact.producer_id == farm.producer_id)).all()
    return {"producer": {"name": farm.producer.name, "is_demo": farm.producer.is_demo},
            "facts": [{"id": f.id, "label": f.label, "value": f.value, "origin": f.origin,
                       "updated_at": f.updated_at.isoformat()} for f in facts]}


@router.post("/profile/facts", status_code=201)
def add_fact(body: FactIn, session: Session = DB):
    farm = farm_or_404(session)
    f = ProfileFact(producer_id=farm.producer_id, **body.model_dump())
    session.add(f)
    session.commit()
    return {"id": f.id}


@router.put("/profile/facts/{fact_id}")
def update_fact(fact_id: int, body: FactIn, session: Session = DB):
    f = get_or_404(session, ProfileFact, fact_id)
    f.label, f.value, f.origin = body.label, body.value, body.origin
    session.commit()
    return {"id": f.id}


@router.delete("/profile/facts/{fact_id}", status_code=204)
def delete_fact(fact_id: int, session: Session = DB):
    session.delete(get_or_404(session, ProfileFact, fact_id))
    session.commit()
