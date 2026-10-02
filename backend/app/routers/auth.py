"""Contas: cadastro, login, contas de demonstração e /api/me (D-018, D-022)."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field as PField
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import demo
from ..auth import bearer, check_password, current_producer, hash_password, new_token
from ..db import get_session
from ..models import AuthToken, Case, Event, Field, Interview, Producer, StockItem
from ..services import farmdata as fd

router = APIRouter(prefix="/api")
DB = Depends(get_session)


class RegisterIn(BaseModel):
    name: str = PField(min_length=2, max_length=120)
    contact: str = PField(min_length=3, max_length=160)
    password: str = PField(min_length=6, max_length=200)


class LoginIn(BaseModel):
    contact: str
    password: str


class DemoIn(BaseModel):
    scenario: Literal["existente", "nova"]


def norm_contact(contact: str) -> str:
    c = contact.strip().lower()
    return c if "@" in c else "".join(ch for ch in c if ch.isdigit())  # celular: só dígitos


@router.post("/auth/register", status_code=201)
def register(body: RegisterIn, session: Session = DB):
    contact = norm_contact(body.contact)
    if session.scalars(select(Producer).where(Producer.contact == contact)).first():
        raise HTTPException(409, "Esse contato já tem conta")
    producer = Producer(name=body.name.strip(), contact=contact, password_hash=hash_password(body.password), is_demo=False)
    session.add(producer)
    session.commit()
    return {"token": new_token(session, producer)}


@router.post("/auth/login")
def login(body: LoginIn, session: Session = DB):
    producer = session.scalars(select(Producer).where(Producer.contact == norm_contact(body.contact))).first()
    if producer is None or not check_password(body.password, producer.password_hash):
        raise HTTPException(401, "Contato ou senha incorretos")
    return {"token": new_token(session, producer)}


@router.post("/auth/demo")
def demo_login(body: DemoIn, session: Session = DB):
    if body.scenario == "existente":
        producer = demo.load_demo(session, demo.demo_producer(session))  # sempre volta ao estado inicial
    else:
        producer = demo.new_visitor(session)
    return {"token": new_token(session, producer)}


@router.post("/auth/logout", status_code=204)
def logout(session: Session = DB, authorization: str | None = Header(None)):
    token = bearer(authorization)
    row = session.get(AuthToken, token) if token else None
    if row:
        session.delete(row)
        session.commit()


@router.get("/me")
def me(session: Session = DB, producer: Producer = Depends(current_producer)):
    farm = fd.find_farm(session, producer)
    count = lambda model, cond: session.scalar(select(func.count()).select_from(model).where(cond)) or 0
    farm_id = farm.id if farm else -1
    return {
        "producer": {"id": producer.id, "name": producer.name, "is_demo": producer.is_demo,
                     # qual botão de demo criou a conta: "existente" (João, da fixture) ou "nova" (visitante)
                     "demo_scenario": None if not producer.is_demo else ("existente" if producer.contact else "nova")},
        "farm": None if farm is None else {
            "id": farm.id, "name": farm.name, "municipality": farm.municipality, "uf": farm.uf, "geocode": farm.geocode,
            "lat": farm.lat, "lon": farm.lon, "total_area_ha": farm.total_area_ha},
        "has_interview": session.get(Interview, producer.id) is not None,
        "counts": {
            "fields": count(Field, Field.farm_id == farm_id),
            "stock_items": count(StockItem, StockItem.farm_id == farm_id),
            "events": count(Event, Event.farm_id == farm_id),
            "cases": count(Case, Case.producer_id == producer.id),
        },
    }
