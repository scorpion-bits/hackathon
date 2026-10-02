"""Entrevista (M2): grava a propriedade, os talhões e as respostas da conta atual."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field as PField
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import current_producer
from ..db import get_session
from ..models import Farm, Field, Interview, Producer
from ..services import context as ctx
from ..services import farmdata as fd

router = APIRouter(prefix="/api")
DB = Depends(get_session)


class MunicipalityIn(BaseModel):
    name: str
    uf: str = PField(min_length=2, max_length=2)
    ibge: str = PField(pattern=r"^\d{7}$")
    lat: float
    lon: float


class FieldDraftIn(BaseModel):
    """Formato do front (components/interview/types.ts → FieldDraft)."""
    model_config = ConfigDict(extra="allow")
    id: int | None = None
    name: str = PField(min_length=1, max_length=80)
    ring: list[tuple[float, float]] = PField(min_length=4)  # [lng, lat], fechado
    color: str | None = None
    crop: str | None = None
    soil: str | None = None
    irrigation: str | None = None


class AnswersIn(BaseModel):
    model_config = ConfigDict(extra="allow")  # demais respostas (renda, preocupações…) são guardadas como vieram
    municipality: MunicipalityIn
    fields: list[FieldDraftIn] = []


def save_onboarding(session: Session, producer: Producer, body: AnswersIn) -> Farm:
    m = body.municipality
    rings = [f.ring for f in body.fields]
    points = [p for r in rings for p in r[:-1]]
    lon, lat = (sum(p[0] for p in points) / len(points), sum(p[1] for p in points) / len(points)) if points else (m.lon, m.lat)

    farm = fd.find_farm(session, producer)
    if farm is None:
        farm = Farm(producer_id=producer.id, name=f"Propriedade de {producer.name.split()[0]}")
        session.add(farm)
    farm.geocode, farm.municipality, farm.uf = m.ibge, m.name, m.uf.upper()
    farm.lat, farm.lon = round(lat, 6), round(lon, 6)
    session.flush()

    # substitui os talhões: o que veio com id (ou nome) desta fazenda é atualizado, o resto é criado; os que sumiram são apagados
    existing = {f.id: f for f in session.scalars(select(Field).where(Field.farm_id == farm.id))}
    kept: set[int] = set()
    for d in body.fields:
        geometry = {"type": "Polygon", "coordinates": [[list(p) for p in d.ring]]}
        field = existing.get(d.id) if d.id is not None else None
        if field is None or field.id in kept:  # id local (do mapa): tenta o talhão de mesmo nome
            field = next((f for f in existing.values() if f.name == d.name and f.id not in kept), None)
        if field is None:
            field = Field(farm_id=farm.id)
            session.add(field)
        irrigation = d.irrigation if d.irrigation in ("nao", "aspersao", "gotejamento", "pivo") else None
        field.name, field.geometry, field.color = d.name, geometry, d.color
        field.area_ha = fd.polygon_area_ha(geometry)
        field.crop = ctx.zarc_name(d.crop, m.ibge)
        field.soil = d.soil if d.soil in ("arenoso", "medio", "argiloso") else None  # solo declarado; "não sei" → vazio
        field.irrigation = irrigation
        field.irrigated = irrigation not in (None, "nao")
        session.flush()
        kept.add(field.id)
    for fid, field in existing.items():
        if fid not in kept:
            fd.unlink_field(session, fid)
            session.delete(field)
    session.flush()
    farm.total_area_ha = round(sum(f.area_ha for f in session.scalars(select(Field).where(Field.farm_id == farm.id))), 2)

    interview = session.get(Interview, producer.id) or Interview(producer_id=producer.id)
    interview.answers = body.model_dump(mode="json")
    session.add(interview)
    session.commit()
    return farm


def onboarding_dict(session: Session, producer: Producer) -> dict:
    farm = fd.find_farm(session, producer)
    interview = session.get(Interview, producer.id)
    fields = [] if farm is None else list(session.scalars(select(Field).where(Field.farm_id == farm.id).order_by(Field.id)))
    return {
        "answers": interview.answers if interview else None,
        "farm": None if farm is None else {
            "id": farm.id, "name": farm.name, "municipality": farm.municipality, "uf": farm.uf, "geocode": farm.geocode,
            "lat": farm.lat, "lon": farm.lon, "total_area_ha": farm.total_area_ha},
        "fields": [{**fd.field_dict(session, f), "has_zarc": ctx.has_zarc(farm.geocode, f.crop)} for f in fields],
    }


@router.get("/onboarding")
def get_onboarding(session: Session = DB, producer: Producer = Depends(current_producer)):
    return onboarding_dict(session, producer)


@router.post("/onboarding")
def post_onboarding(body: AnswersIn, session: Session = DB, producer: Producer = Depends(current_producer)):
    if any(fd.polygon_area_ha({"coordinates": [d.ring]}) <= 0 for d in body.fields):
        raise HTTPException(422, "Talhão sem área: desenhe pelo menos 3 pontos")
    save_onboarding(session, producer, body)
    return onboarding_dict(session, producer)
