from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..assistant.engine import chat, llm_enabled, llm_model
from ..auth import current_producer
from ..db import get_session
from ..models import ChatMessage, Producer
from ..services import farmdata as fd

router = APIRouter(prefix="/api/assistant")
ME = Depends(current_producer)


class ChatIn(BaseModel):
    message: str
    context: dict | None = None  # ex.: {"alert": {...}} ou {"field": "Talhão 2"}


@router.get("/status")
def status():
    return {"llm": llm_enabled(), "mode": "llm" if llm_enabled() else "offline", "model": llm_model()}


@router.get("/history")
def history(session: Session = Depends(get_session), me: Producer = ME):
    msgs = session.scalars(select(ChatMessage).where(ChatMessage.producer_id == me.id).order_by(ChatMessage.id.desc()).limit(40)).all()
    return [{"role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at.isoformat()}
            for m in reversed(msgs)]


@router.post("/chat")
def post_chat(body: ChatIn, session: Session = Depends(get_session), me: Producer = ME):
    prev = session.scalars(select(ChatMessage).where(ChatMessage.producer_id == me.id).order_by(ChatMessage.id.desc()).limit(8)).all()
    hist = [{"role": m.role, "content": m.content} for m in reversed(prev)]
    if fd.find_farm(session, me) is None:
        return {"answer": "Primeiro configure sua propriedade (entrevista e talhões). Depois eu explico os dados oficiais dela.",
                "sources": [], "mode": "offline"}
    out = chat(session, body.message, hist, body.context)
    session.add(ChatMessage(producer_id=me.id, role="user", content=body.message, sources=[]))
    session.add(ChatMessage(producer_id=me.id, role="assistant", content=out["answer"], sources=out["sources"]))
    session.commit()
    return out


@router.delete("/history", status_code=204)
def clear(session: Session = Depends(get_session), me: Producer = ME):
    session.query(ChatMessage).filter(ChatMessage.producer_id == me.id).delete()
    session.commit()
