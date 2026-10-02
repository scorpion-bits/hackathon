#!/usr/bin/env python3
"""Recria data/app.db e carrega a conta de demonstração do João (DADOS FICTÍCIOS, rotulados na interface).

Os dados do João ficam em backend/app/fixtures/demo/joao.json (D-022) e são carregados por app.demo.load_demo,
o mesmo código usado pelo botão "Entrar como João (demo)".
Login de demonstração: joao@demo.agrobits / demo1234.

Uso:
  python scripts/seed_demo.py              recria sempre (apaga todas as contas)
  python scripts/seed_demo.py --if-needed  só recria se o banco não existe ou o esquema mudou (SCHEMA_VERSION)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import demo  # noqa: E402
from app.db import APP_DB, SCHEMA_VERSION, Base, SessionLocal, engine, schema_outdated, schema_version, set_schema_version  # noqa: E402
from app.models import Field  # noqa: E402


def main() -> None:
    if "--if-needed" in sys.argv[1:] and not schema_outdated():
        print(f"OK → {APP_DB} já está na versão {SCHEMA_VERSION} do esquema (nada a fazer)")
        return
    old = schema_version() if APP_DB.exists() else None
    # Recria as tabelas sem apagar o arquivo: a API pode continuar rodando durante o reset da demo.
    # Apaga também tabelas antigas que não existem mais no modelo.
    with engine.begin() as con:
        con.exec_driver_sql("PRAGMA foreign_keys = OFF")
        names = [r[0] for r in con.exec_driver_sql(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        for name in names:
            con.exec_driver_sql(f'DROP TABLE IF EXISTS "{name}"')
    Base.metadata.create_all(engine)
    set_schema_version()
    with SessionLocal() as s:
        joao = demo.load_demo(s, demo.demo_producer(s))
        fields = s.query(Field).order_by(Field.id).all()
        print(f"OK → {APP_DB} (esquema {old} → {SCHEMA_VERSION}) · {joao.name} · talhões: "
              + ", ".join(f"{f.name} {f.area_ha} ha" for f in fields))


if __name__ == "__main__":
    main()
