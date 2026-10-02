from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..assistant.engine import chat, llm_enabled
from ..db import get_session
from ..models import ChatMessage

router = APIRouter(prefix="/api/assistant")


class ChatIn(BaseModel):
    message: str
    context: dict | None = None  # ex.: {"alert": {...}} ou {"field": "Talhão 2"}


@router.get("/status")
def status():
    return {"llm": llm_enabled(), "mode": "llm" if llm_enabled() else "offline"}


@router.get("/history")
def history(session: Session = Depends(get_session)):
    msgs = session.scalars(select(ChatMessage).order_by(ChatMessage.id.desc()).limit(40)).all()
    return [{"role": m.role, "content": m.content, "sources": m.sources, "created_at": m.created_at.isoformat()}
            for m in reversed(msgs)]


@router.post("/chat")
def post_chat(body: ChatIn, session: Session = Depends(get_session)):
    prev = session.scalars(select(ChatMessage).order_by(ChatMessage.id.desc()).limit(8)).all()
    hist = [{"role": m.role, "content": m.content} for m in reversed(prev)]
    out = chat(session, body.message, hist, body.context)
    session.add(ChatMessage(role="user", content=body.message, sources=[]))
    session.add(ChatMessage(role="assistant", content=out["answer"], sources=out["sources"]))
    session.commit()
    return out


@router.delete("/history", status_code=204)
def clear(session: Session = Depends(get_session)):
    session.query(ChatMessage).delete()
    session.commit()
