from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import api, assistant, auth, onboarding

Base.metadata.create_all(engine)

app = FastAPI(title="AgroBits API", version="0.1.0",
              description="Gestão da propriedade + IA que interpreta dados abertos (Zarc, Agrofit, SIPEAGRO, PSR).")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(api.router)
app.include_router(onboarding.router)
app.include_router(assistant.router)


@app.get("/health")
def health():
    return {"ok": True}
