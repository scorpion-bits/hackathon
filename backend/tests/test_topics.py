"""Motor de assuntos (M3). Rodar: cd backend && pytest -q

Clima: arquivo de teste (AGROIA_WEATHER_FIXTURE, só aqui). NASA POWER: substituída por respostas montadas no teste,
para não depender da rede. Zarc, Agrofit e SIPEAGRO: base real (opendata.db).
"""
import os
import subprocess
import sys
from datetime import date
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
TMP_DB = ROOT / "data" / "test_app.db"
os.environ["AGROIA_APP_DB"] = str(TMP_DB)
os.environ["AGROIA_WEATHER_FIXTURE"] = "1"

RIBEIRAO = {"name": "Ribeirão Preto", "uf": "SP", "ibge": "3543402", "lat": -21.17, "lon": -47.81}
NASA_OFF = {"available": False, "status": "offline", "error": "sem rede (teste)"}


@pytest.fixture(scope="module")
def client():
    from app.db import engine
    engine.dispose()
    subprocess.run([sys.executable, str(ROOT / "scripts" / "seed_demo.py")], check=True, env=os.environ.copy())
    from fastapi.testclient import TestClient

    from app.main import app
    yield TestClient(app)
    engine.dispose()
    TMP_DB.unlink(missing_ok=True)


@pytest.fixture(autouse=True)
def fixed_day(monkeypatch):
    """Dia da demo (02/10/2026, início do decêndio 28) — a previsão de teste começa nesse dia."""
    from app.services import farmdata, live, topics
    monkeypatch.setattr(farmdata, "today", lambda: date(2026, 10, 2))
    monkeypatch.setattr(live, "rain_vs_normal", lambda lat, lon: NASA_OFF)
    topics.clear_cache()
    yield
    topics.clear_cache()


def by_key(data):
    return {t["key"]: t for t in data["topics"]}


def test_joao_zarc_topics_use_real_series(client):
    from app.services import opendata as od
    data = client.get("/api/topics").json()
    topics = by_key(data)
    milho = topics["plantio:2:milho"]
    real = od.zarc_for("3503208", "Milho 1ª Safra", "argiloso", False)
    assert milho["kind"] == "janela_plantio" and milho["priority"] == "agir"
    assert milho["evidence"]["series"] == real["risk"] and milho["evidence"]["safra"] == real["safra"] == "2026/2027"
    assert milho["evidence"]["today_decendio"] == 28
    now, best = real["risk"][27], min(r for r in real["risk"] if r)
    assert f"{now}%" in milho["summary"] and milho["evidence"]["window"]["risk"] == best
    assert sum(1 for p in milho["paths"] if p.get("recommended")) == 1
    assert milho["expert_id"] == "cati"
    soja = topics["janela:1:soja"]
    assert soja["kind"] == "janela_aberta" and soja["evidence"]["series"][27] == best
    assert "plantio:3:feijao" not in topics and "janela:3:feijao" not in topics  # feijão já plantado
    assert data["sources_status"]["nasa"] == "offline"
    assert not any(t["kind"] == "chuva_vs_normal" for t in data["topics"])


def test_joao_rain_seeds_agrofit_drones(client):
    topics = by_key(client.get("/api/topics").json())
    chuva = next(t for t in topics.values() if t["kind"] == "chuva_forte")
    assert chuva["key"] == "chuva:2026-10-08" and "62" in chuva["title"]
    assert any("SIMULADA" in w for w in chuva["why"])  # previsão de teste sempre rotulada
    assert chuva["field"] == "Talhão 2"  # preparo de solo em 20/09
    seeds = topics["semente:2:milho"]
    assert seeds["evidence"]["have_kg"] == 40 and seeds["evidence"]["needed_kg"] == pytest.approx(61, abs=1.5)
    agro = next(t for t in topics.values() if t["kind"] == "defensivo_registro")
    assert agro["evidence"]["registration"] == "00218" and agro["field"] == "Talhão 3"
    assert agro["evidence"]["days_to_expiry"] == 10
    drone = topics["drone:3503208"]
    assert drone["evidence"]["drones"] > 0 and drone["expert_id"] == "prefeitura"
    for t in topics.values():
        assert t["sources"] and 2 <= len(t["paths"]) <= 3


def test_new_account_other_municipality(client):
    from app.services import opendata as od
    token = client.post("/api/auth/demo", json={"scenario": "nova"}).json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/topics", headers=h).json()["topics"] == []  # sem propriedade
    ring = [[-47.85, -21.20], [-47.847, -21.20], [-47.847, -21.197], [-47.85, -21.197], [-47.85, -21.20]]
    r = client.post("/api/onboarding", headers=h, json={
        "profile": "familiar", "municipality": RIBEIRAO, "credit": [], "machines": [], "concerns": [], "goals": [],
        "fields": [{"id": 1, "name": "Talhão 1", "areaHa": 9, "ring": ring, "crop": "milho", "soil": "argiloso", "irrigation": "nao"}]})
    assert r.status_code == 200, r.text
    topics = client.get("/api/topics", headers=h).json()["topics"]
    milho = next(t for t in topics if t["kind"] in ("janela_plantio", "janela_aberta"))
    assert milho["evidence"]["series"] == od.zarc_for("3543402", "Milho 1ª Safra", "argiloso", False)["risk"]
    assert "Ribeirão Preto" in milho["evidence_note"]
    assert not any(t["kind"] == "semente_insuficiente" for t in topics)  # sem estoque
    assert not any(t["kind"] == "defensivo_registro" for t in topics)


def test_weather_offline_hides_rain(client, monkeypatch):
    from app.services import weather
    monkeypatch.setattr(weather, "forecast", lambda lat, lon: {"available": False, "status": "offline"})
    data = client.get("/api/topics").json()
    assert data["sources_status"]["clima"] == "offline"
    assert not any(t["kind"] == "chuva_forte" for t in data["topics"])
    assert any(t["kind"] == "janela_plantio" for t in data["topics"])  # Zarc segue funcionando


def test_stale_nasa_is_labelled(client, monkeypatch):
    from app.services import live
    stale = {"available": True, "status": "stale", "fetched_at": "2026-10-01T21:00", "observed_mm": 10.0,
             "normal_mm": 48.0, "ratio": 0.21, "label": "bem mais seco que o normal",
             "period": {"start": "01/09/2026", "end": "29/09/2026", "days": 29},
             "daily": [{"date": "2026-09-29", "rain_mm": 0.0}], "notes": ["Chuva estimada por satélite."]}
    monkeypatch.setattr(live, "rain_vs_normal", lambda lat, lon: stale)
    data = client.get("/api/topics").json()
    t = by_key(data)["chuva_normal:seco"]
    assert data["sources_status"]["nasa"] == "stale"
    assert any("Dado real de 01/10 21h00" in w for w in t["why"])
    assert any(p["id"] == "irrigar" for p in t["paths"])  # Talhão 3 irrigado


def test_key_stable_and_choice(client):
    a = [t["key"] for t in client.get("/api/topics").json()["topics"]]
    from app.services import topics
    topics.clear_cache()
    b = [t["key"] for t in client.get("/api/topics").json()["topics"]]
    assert a == b
    key = "plantio:2:milho"
    assert client.post(f"/api/topics/{key}/choice", json={"choice": "esperar"}).json() == {"key": key, "choice": "esperar"}
    assert client.get(f"/api/topics/{key}").json()["choice"] == "esperar"
    assert client.post(f"/api/topics/{key}/choice", json={"choice": "inventado"}).status_code == 422
    assert client.get("/api/topics/nao:existe").status_code == 404
