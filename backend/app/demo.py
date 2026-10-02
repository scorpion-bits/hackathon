"""Contas de demonstração (D-022): contas comuns com is_demo=True, carregadas de fixtures para as MESMAS tabelas.

Só dados de conta (nome, talhões, estoque, histórico, casos). Dados abertos nunca vão nas fixtures.
"""
from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .auth import hash_password
from .models import (Case, ChatMessage, Event, Farm, Field, Interview, ProfileFact, Producer, Season,
                     StockItem, StockMovement, TopicState)
from .services.farmdata import polygon_area_ha

FIXTURES = Path(__file__).parent / "fixtures" / "demo"


def fixture(name: str = "joao") -> dict:
    return json.loads((FIXTURES / f"{name}.json").read_text(encoding="utf-8"))


def wipe_account_data(session: Session, producer: Producer) -> None:
    """Apaga tudo da conta, menos a própria conta e os tokens (quem está logado continua logado)."""
    farm_ids = select(Farm.id).where(Farm.producer_id == producer.id)
    item_ids = select(StockItem.id).where(StockItem.farm_id.in_(farm_ids))
    event_ids = select(Event.id).where(Event.farm_id.in_(farm_ids))
    session.execute(delete(StockMovement).where(StockMovement.item_id.in_(item_ids) | StockMovement.event_id.in_(event_ids)))
    session.execute(delete(Case).where(Case.producer_id == producer.id))
    for model in (Event, StockItem, Season, Field):
        session.execute(delete(model).where(model.farm_id.in_(farm_ids)))
    session.execute(delete(Farm).where(Farm.producer_id == producer.id))
    for model in (Interview, TopicState, ProfileFact, ChatMessage):
        session.execute(delete(model).where(model.producer_id == producer.id))
    session.flush()


def demo_producer(session: Session, name: str = "joao") -> Producer:
    """Conta demo da fixture (cria se não existir). Não mexe nos dados dela."""
    p = fixture(name)["producer"]
    producer = session.scalars(select(Producer).where(Producer.contact == p["contact"])).first()
    if producer is None:
        producer = Producer(name=p["name"], contact=p["contact"], password_hash=hash_password(p["password"]),
                            phone_pref=p.get("phone_pref"), is_demo=True)
        session.add(producer)
        session.flush()
    return producer


def load_demo(session: Session, producer: Producer, name: str = "joao") -> Producer:
    """Volta a conta ao estado da fixture: apaga os dados dela e recria. Faz commit."""
    fx = fixture(name)
    wipe_account_data(session, producer)
    p = fx["producer"]
    producer.name, producer.phone_pref, producer.is_demo = p["name"], p.get("phone_pref"), True
    producer.password_hash = hash_password(p["password"])

    farm = Farm(producer_id=producer.id, **fx["farm"])
    session.add(farm)
    session.flush()

    fields: dict[str, Field] = {}
    for f in fx["fields"]:
        geometry = {"type": "Polygon", "coordinates": [f["ring"]]}
        fields[f["key"]] = Field(farm_id=farm.id, name=f["name"], geometry=geometry, area_ha=polygon_area_ha(geometry),
                                 crop=f.get("crop"), soil=f.get("soil"), irrigated=f.get("irrigated", False), irrigation=f.get("irrigation"),
                                 color=f.get("color"), seed_rate_kg_ha=f.get("seed_rate_kg_ha"), notes=f.get("notes"))
    seasons = {s["key"]: Season(farm_id=farm.id, name=s["name"], start=date.fromisoformat(s["start"]),
                                end=date.fromisoformat(s["end"])) for s in fx["seasons"]}
    supplier = fx.get("supplier")
    items: dict[str, StockItem] = {}
    for it in fx["stock"]:
        items[it["key"]] = StockItem(
            farm_id=farm.id, name=it["name"], category=it["category"], unit=it["unit"],
            min_quantity=it.get("min_quantity", 0), crop=it.get("crop"), supplier=supplier,
            agrofit_registration=it.get("agrofit_registration"),
            expiry_date=date.fromisoformat(it["expiry_date"]) if it.get("expiry_date") else None)
    session.add_all([*fields.values(), *seasons.values(), *items.values()])
    session.flush()

    for h in fx["history"]:
        d = date.fromisoformat(h["date"])
        season = seasons[h["season"]]
        if h["op"] == "buy":
            it, qty, price = items[h["item"]], h["qty"], h["price"]
            ev = Event(farm_id=farm.id, season_id=season.id, type="compra", date=d, origin="demo",
                       title=f"Compra · {qty:g} {it.unit} de {it.name} · R$ {qty * price:,.2f}", details={"supplier": supplier})
            session.add(ev)
            session.add(StockMovement(item=it, event=ev, kind="entrada", quantity=qty, unit_price=price, date=d, supplier=supplier))
        else:
            field = fields.get(h.get("field"))
            ev = Event(farm_id=farm.id, field_id=field.id if field else None, season_id=season.id, type=h["type"], date=d,
                       title=h["title"], details=h.get("details", {}), origin="demo")
            session.add(ev)
            for key, qty in h.get("uses", []):
                session.add(StockMovement(item=items[key], event=ev, kind="saida", quantity=qty, date=d, note=h["title"]))

    session.add_all(ProfileFact(producer_id=producer.id, label=a, value=b, origin=c) for a, b, c in fx.get("facts", []))
    if fx.get("interview"):
        session.add(Interview(producer_id=producer.id, answers=fx["interview"]))
    for c in fx.get("cases", []):
        field = fields.get(c.get("field"))
        session.add(Case(
            producer_id=producer.id, protocol=c["protocol"], topic_key=c["topic_key"], field_id=field.id if field else None,
            expert_id=c["expert_id"], channel=c["channel"], path=c.get("path"), note=c.get("note"), snapshot=c.get("snapshot", {}),
            consent_at=datetime.fromisoformat(c["consent_at"]) if c.get("consent_at") else None, status=c.get("status", "enviado"),
            reply=c.get("reply"), reply_is_example=c.get("reply_is_example", False),
            created_at=datetime.fromisoformat(c["created_at"]) if c.get("created_at") else datetime.now()))
    session.commit()
    return producer


def new_visitor(session: Session) -> Producer:
    """Conta vazia de demonstração ("Experimentar como novo usuário")."""
    producer = Producer(name="Visitante", is_demo=True)
    session.add(producer)
    session.commit()
    return producer


