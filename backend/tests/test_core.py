"""Testes do fio condutor e da fidelidade aos dados oficiais. Rodar: cd backend && pytest -q
Requer data/opendata.db (python scripts/pipeline_opendata.py). Usa banco temporário com o seed demo."""
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[2]
TMP_DB = ROOT / "data" / "test_app.db"
os.environ["AGROIA_APP_DB"] = str(TMP_DB)
os.environ["AGROIA_WEATHER_FIXTURE"] = "1"


@pytest.fixture(scope="module")
def client():
    subprocess.run([sys.executable, str(ROOT / "scripts" / "seed_demo.py")], check=True, env=os.environ.copy())
    from fastapi.testclient import TestClient

    from app.main import app
    yield TestClient(app)
    TMP_DB.unlink(missing_ok=True)


def test_decendio():
    from app.services.opendata import decendio
    assert decendio(date(2026, 1, 1)) == 1
    assert decendio(date(2026, 10, 2)) == 28
    assert decendio(date(2026, 10, 11)) == 29
    assert decendio(date(2026, 12, 31)) == 36


def test_zarc_matches_official_csv():
    """O risco mostrado ao produtor é idêntico ao CSV oficial do MAPA."""
    from app.services.opendata import zarc_for
    z = zarc_for("3503208", "Milho 1ª Safra", "argiloso", False)
    csv = pd.read_csv(ROOT / "data/raw/zarc/dados-abertos-tabua-de-risco-safra-2026-2027.csv.zip", sep=";",
                      encoding="utf-8-sig", dtype=str)
    row = csv[(csv.geocodigo == "3503208") & (csv.Nome_cultura == "Milho 1ª Safra") & (csv.Cod_Solo == z["soil_code"])
              & (csv.Cod_Ciclo == z["cycle"])].iloc[0]
    assert z["risk"] == [int(row[f"dec{i}"]) for i in range(1, 37)]
    assert z["safra"] == "2026/2027"


def test_stock_and_costs_follow_events(client):
    items = {i["name"]: i for i in client.get("/api/stock/items").json()}
    seed = items["Semente de milho (verão)"]
    assert seed["quantity"] == 40
    before = client.get("/api/reports/costs").json()["applied_total"]
    r = client.post("/api/events", json={"type": "plantio", "date": "2026-10-02", "field_id": 2,
                                         "details": {"crop": "Milho 1ª Safra"}, "inputs": [{"item_id": seed["id"], "quantity": 30}]})
    assert r.status_code == 201
    items = {i["name"]: i for i in client.get("/api/stock/items").json()}
    assert items["Semente de milho (verão)"]["quantity"] == 10
    after = client.get("/api/reports/costs").json()["applied_total"]
    assert round(after - before, 2) == round(30 * 39.0, 2)
    status = next(f for f in client.get("/api/fields").json() if f["id"] == 2)["status"]
    assert status["stage"] == "plantado"
    # plantio em decêndio de 40% gera alerta Zarc
    kinds = [a["kind"] for a in client.get("/api/alerts").json()]
    assert "zarc" in kinds


def test_cannot_use_more_than_stock(client):
    item = next(i for i in client.get("/api/stock/items").json() if i["name"] == "Ureia")
    r = client.post("/api/events", json={"type": "aplicacao", "date": "2026-10-02", "field_id": 1,
                                         "inputs": [{"item_id": item["id"], "quantity": item["quantity"] + 1}]})
    assert r.status_code == 422


def test_planner_flags_missing_seed(client):
    p = client.get("/api/fields/1/plan", params={"crop": "Milho 1ª Safra", "seed_rate_kg_ha": 20}).json()
    assert p["best"]["risk"] == 20
    assert p["seed"]["missing_kg"] > 0


def test_assistant_offline_uses_sources(client):
    r = client.post("/api/assistant/chat", json={"message": "Quanto gastei com fertilizante nesta safra?"}).json()
    assert r["mode"] == "offline"
    assert "R$" in r["answer"]
    assert any(s["key"] == "agroia" for s in r["sources"])


def test_privacy_no_personal_columns():
    """Nenhuma tabela de dados abertos expõe colunas de pessoa (nome, CPF, e-mail, telefone)."""
    import sqlite3
    con = sqlite3.connect(ROOT / "data" / "opendata.db")
    cols = " ".join(r[1].lower() for t in ("region_stats", "agrofit", "zarc_risk")
                    for r in con.execute(f"PRAGMA table_info({t})"))
    for banned in ("cpf", "email", "telefone", "segurado", "responsavel"):
        assert banned not in cols
