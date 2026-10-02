"""Assuntos do início guiado (M3): calculados no backend com dados da conta × fontes reais."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field as PField
from sqlalchemy.orm import Session

from ..auth import current_producer
from ..db import get_session
from ..models import Producer, TopicState
from ..services import topics as tp

router = APIRouter(prefix="/api/topics", tags=["assuntos"])
DB = Depends(get_session)
ME = Depends(current_producer)


@router.get("")
def list_topics(session: Session = DB, me: Producer = ME):
    """Assuntos da conta atual, do mais urgente ao informativo, com `sources_status` de cada fonte."""
    return tp.compute(session, me.id)


def _find(session: Session, me: Producer, key: str) -> dict:
    data = tp.compute(session, me.id)
    topic = next((t for t in data["topics"] if t["key"] == key), None)
    if topic is None:
        raise HTTPException(404, "Assunto não existe mais (os dados mudaram)")
    return topic | {"sources_status": data["sources_status"], "generated_at": data["generated_at"]}


@router.get("/{key}")
def get_topic(key: str, session: Session = DB, me: Producer = ME):
    return _find(session, me, key)


class ChoiceIn(BaseModel):
    choice: str | None = PField(default=None, max_length=80)


@router.post("/{key}/choice")
def set_choice(key: str, body: ChoiceIn, session: Session = DB, me: Producer = ME):
    topic = _find(session, me, key)
    if body.choice is not None and body.choice not in {p["id"] for p in topic["paths"]} | {"encaminhado"}:
        raise HTTPException(422, f"Caminho '{body.choice}' não existe neste assunto")
    state = session.get(TopicState, (me.id, key)) or TopicState(producer_id=me.id, topic_key=key)
    state.choice = body.choice
    session.add(state)
    session.commit()
    return {"key": key, "choice": body.choice}
