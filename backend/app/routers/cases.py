"""Casos enviados à assistência técnica pública (M4, D-015). A resposta do técnico é simulada e rotulada (D-019)."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field as PField
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..auth import current_producer
from ..db import get_session
from ..models import Case, Producer, TopicState
from ..services import farmdata as fd
from ..services import topics as tp

router = APIRouter(prefix="/api", tags=["casos"])
DB = Depends(get_session)
ME = Depends(current_producer)

# Instituições reais citadas como EXEMPLO de integração (sem convênio firmado); nenhuma pessoa é nomeada.
EXPERTS = [
    {"id": "cati", "name": "CATI · Casa da Agricultura de Araraquara", "kind": "Assistência técnica pública do Estado de SP",
     "how": "Técnico ou engenheiro agrônomo responde e, se precisar, agenda visita",
     "eta": "resposta em até 5 dias úteis (exemplo)", "free": True},
    {"id": "senar", "name": "Senar · Assistência Técnica e Gerencial", "kind": "Programa gratuito para produtor rural",
     "how": "Técnico de campo acompanha a propriedade por meses", "eta": "contato em até 10 dias (exemplo)", "free": True},
    {"id": "prefeitura", "name": "Secretaria de Agricultura do município", "kind": "Apoio municipal ao produtor",
     "how": "Orientação, máquinas da patrulha agrícola e programas locais",
     "eta": "resposta em até 7 dias (exemplo)", "free": True},
]
EXAMPLE_TAG = "(resposta de exemplo — conta de demonstração)"
REPLIES = {
    "janela_plantio": "Olá! Recebemos o seu caso. Conferimos a janela do Zarc para a sua cultura e o seu tipo de solo: plantar dentro da janela "
                      "mantém o acesso ao Proagro e à subvenção do seguro. Se puder, passe na Casa da Agricultura com o CAR e o mapa dos talhões "
                      "para confirmarmos o solo antes de fechar a data.",
    "janela_aberta": "Olá! A janela de menor risco do Zarc está aberta para essa cultura. Antes de plantar, confira a umidade do solo e a "
                     "previsão dos próximos dias; se quiser, marcamos uma visita rápida ao talhão.",
    "chuva_forte": "Olá! Vimos a previsão de chuva forte. Evite aplicar defensivos nos dias anteriores e observe se há solo exposto nos talhões "
                   "recém-preparados. Se aparecerem sinais de erosão, mande uma foto e avaliamos juntos.",
    "chuva_vs_normal": "Olá! Recebemos os números de chuva da sua região. Vale acompanhar a umidade do solo antes de decidir plantio ou irrigação; "
                       "podemos orientar sobre o manejo da água na propriedade.",
    "semente_insuficiente": "Olá! Conferimos a conta: a semente em estoque não cobre a área. Podemos orientar sobre origem de semente com "
                            "qualidade e sobre linhas de crédito de custeio. Traga a nota ou o orçamento da revenda.",
    "defensivo_registro": "Olá! Para qualquer aplicação é preciso receituário de engenheiro agrônomo e o produto precisa ter registro para a "
                          "cultura. Produto vencido não deve ser usado: a revenda recebe a embalagem (logística reversa). Podemos agendar uma vistoria.",
    "servico_drone": "Olá! Há operadores de drone registrados na região. Podemos passar a lista de prestadores e orientar o que pedir no "
                     "orçamento (área, cultura e declive do talhão).",
}
DEFAULT_REPLY = "Olá! Recebemos o seu caso e os dados oficiais que você anexou. Um técnico vai analisar e retornar com orientação."


class CaseIn(BaseModel):
    topic_key: str = PField(max_length=80)
    expert_id: str = PField(max_length=40)
    channel: str = PField(max_length=40)
    path: str | None = PField(default=None, max_length=80)
    note: str | None = PField(default=None, max_length=2000)
    consent: bool = False


def case_dict(c: Case) -> dict:
    snap = c.snapshot or {}
    return {"id": c.id, "protocol": c.protocol, "topic_key": c.topic_key, "field_id": c.field_id, "expert_id": c.expert_id,
            "channel": c.channel, "path": c.path, "note": c.note, "snapshot": snap,
            "question": snap.get("question") or snap.get("title"), "status": c.status, "reply": c.reply,
            "reply_is_example": c.reply_is_example, "created_at": c.created_at.isoformat(timespec="minutes"),
            "consent_at": c.consent_at.isoformat(timespec="minutes") if c.consent_at else None}


def _own(session: Session, me: Producer, case_id: int) -> Case:
    c = session.get(Case, case_id)
    if c is None or c.producer_id != me.id:
        raise HTTPException(404, "Caso não encontrado")
    return c


@router.get("/experts")
def experts():
    return EXPERTS


@router.get("/cases")
def list_cases(session: Session = DB, me: Producer = ME):
    rows = session.scalars(select(Case).where(Case.producer_id == me.id).order_by(Case.id.desc())).all()
    return [case_dict(c) for c in rows]


@router.post("/cases", status_code=201)
def create_case(body: CaseIn, session: Session = DB, me: Producer = ME):
    if not body.consent:
        raise HTTPException(400, "É preciso autorizar o envio dos dados ao técnico")
    if body.expert_id not in {e["id"] for e in EXPERTS}:
        raise HTTPException(422, "Órgão de assistência técnica desconhecido")
    data = tp.compute(session, me.id)
    topic = next((t for t in data["topics"] if t["key"] == body.topic_key), None)
    if topic is None:
        raise HTTPException(404, "Assunto não existe mais (os dados mudaram)")
    if body.path is not None and body.path not in {p["id"] for p in topic["paths"]}:
        raise HTTPException(422, f"Caminho '{body.path}' não existe neste assunto")
    path_title = next((p["title"] for p in topic["paths"] if p["id"] == body.path), None)
    snapshot = {"question": topic["question"], "title": topic["title"], "summary": topic["summary"], "kind": topic["kind"],
                "field": topic["field"], "why": topic["why"], "sources": topic["sources"], "evidence_note": topic.get("evidence_note"),
                "path_title": path_title, "sources_status": data["sources_status"], "generated_at": data["generated_at"]}
    n = session.scalar(select(func.count()).select_from(Case).where(Case.producer_id == me.id)) or 0
    protocol = f"AB-{1000 + n + 1}"
    while session.scalars(select(Case).where(Case.protocol == protocol)).first():  # protocolo é único no banco todo
        n += 1
        protocol = f"AB-{1000 + n + 1}"
    now = datetime.now()
    c = Case(producer_id=me.id, protocol=protocol, topic_key=body.topic_key, field_id=topic["field_id"], expert_id=body.expert_id,
             channel=body.channel, path=body.path, note=(body.note or None), snapshot=snapshot, consent_at=now,
             status="enviado", created_at=now)
    session.add(c)
    state = session.get(TopicState, (me.id, body.topic_key)) or TopicState(producer_id=me.id, topic_key=body.topic_key)
    state.choice = body.path or "encaminhado"
    session.add(state)
    session.commit()
    return case_dict(c)


@router.post("/cases/{case_id}/demo-reply")
def demo_reply(case_id: int, session: Session = DB, me: Producer = ME):
    """Simula a resposta do técnico (D-019). Sempre rotulada como exemplo."""
    c = _own(session, me, case_id)
    kind = (c.snapshot or {}).get("kind")
    c.reply = f"{REPLIES.get(kind, DEFAULT_REPLY)} {EXAMPLE_TAG}"
    c.reply_is_example = True
    c.status = "respondido"
    session.commit()
    return case_dict(c)


@router.delete("/cases", status_code=204)
def reset_cases(session: Session = DB, me: Producer = ME):
    """"Recomeçar a demonstração": só em conta demo. Apaga casos e escolhas dos assuntos."""
    if not me.is_demo:
        raise HTTPException(403, "Só contas de demonstração podem recomeçar")
    session.execute(delete(Case).where(Case.producer_id == me.id))
    session.execute(delete(TopicState).where(TopicState.producer_id == me.id))
    session.commit()
