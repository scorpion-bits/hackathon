"""Conta atual (D-018). Token simples em `Authorization: Bearer <token>`; senha com pbkdf2 da biblioteca padrão.

Sem token → conta do João (demo), para o app antigo (/legado) continuar funcionando.
O id do produtor fica em `session.info["producer_id"]`, então serviços e ferramentas da IA
(`farmdata.get_farm(session)`) enxergam só a fazenda da conta atual.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_session
from .models import AuthToken, Producer

DEMO_CONTACT = "joao@demo.agrobits"
# Esquema "Bearer" no OpenAPI: faz aparecer o botão "Authorize" no /docs (o Swagger não envia um
# parâmetro de cabeçalho chamado Authorization). auto_error=False: sem token continua valendo o João.
BEARER = HTTPBearer(auto_error=False, description="Cole só o token (sem a palavra Bearer)")
PBKDF2_ROUNDS = 200_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
    return f"{salt}${digest}"


def check_password(password: str, stored: str | None) -> bool:
    if not stored or "$" not in stored:
        return False
    salt, digest = stored.split("$", 1)
    calc = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
    return hmac.compare_digest(calc, digest)


def new_token(session: Session, producer: Producer) -> str:
    token = secrets.token_urlsafe(32)
    session.add(AuthToken(token=token, producer_id=producer.id))
    session.commit()
    return token


def default_producer(session: Session) -> Producer | None:
    """Conta usada quando não há token: o João (demo); se não existir, a primeira conta."""
    return (session.scalars(select(Producer).where(Producer.contact == DEMO_CONTACT)).first()
            or session.scalars(select(Producer).order_by(Producer.id).limit(1)).first())


def bearer(authorization: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return None


def current_producer(session: Session = Depends(get_session),
                     credentials: HTTPAuthorizationCredentials | None = Depends(BEARER)) -> Producer:
    token = credentials.credentials.strip() if credentials else None
    if token:
        row = session.get(AuthToken, token)
        producer = session.get(Producer, row.producer_id) if row else None
        if producer is None:
            raise HTTPException(401, "Sessão expirada — entre de novo")
    else:
        producer = default_producer(session)
        if producer is None:
            raise HTTPException(503, "Nenhuma conta cadastrada — rode scripts/seed_demo.py")
    session.info["producer_id"] = producer.id
    return producer
