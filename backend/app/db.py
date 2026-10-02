"""Conexões: app.db (dados da propriedade, leitura/escrita) e opendata.db (dados abertos, somente leitura)."""
import os
import sqlite3
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"
APP_DB = Path(os.environ.get("AGROIA_APP_DB", DATA / "app.db"))
OPENDATA_DB = Path(os.environ.get("AGROIA_OPENDATA_DB", DATA / "opendata.db"))

engine = create_engine(f"sqlite:///{APP_DB}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def opendata() -> sqlite3.Connection:
    con = sqlite3.connect(f"file:{OPENDATA_DB}?mode=ro", uri=True, check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con
