import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import ROOT, Base, engine


def load_dotenv(path: Path = ROOT / ".env") -> None:
    """Lê o .env da raiz (chave da IA) quando a API é iniciada à mão, sem dev.sh/Docker (ex.: Windows).
    Não sobrescreve variáveis já definidas; nos testes não lê nada (eles rodam sempre em modo offline)."""
    if "pytest" in sys.modules:
        return
    if not path.exists():
        path = ROOT / ".env.avaliacao"  # chave dedicada à avaliação (ver README)
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_dotenv()
from .routers import api, assistant, auth, cases, onboarding, topics

Base.metadata.create_all(engine)

app = FastAPI(title="AgroBits API", version="0.1.0",
              description="Gestão da propriedade + IA que interpreta dados abertos (Zarc, Agrofit, SIPEAGRO, PSR).")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(api.router)
app.include_router(onboarding.router)
app.include_router(topics.router)
app.include_router(cases.router)
app.include_router(assistant.router)


@app.get("/health")
def health():
    return {"ok": True}
