"""Entrevista e talhões na API (M2). Rodar: cd backend && pytest -q"""
import math
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
TMP_DB = ROOT / "data" / "test_app.db"
os.environ["AGROIA_APP_DB"] = str(TMP_DB)
os.environ["AGROIA_WEATHER_FIXTURE"] = "1"

RIBEIRAO = {"name": "Ribeirão Preto", "uf": "SP", "ibge": "3543402", "lat": -21.17, "lon": -47.81}


def square(lon: float, lat: float, side_deg: float = 0.003) -> list[list[float]]:
    return [[lon, lat], [lon + side_deg, lat], [lon + side_deg, lat + side_deg], [lon, lat + side_deg], [lon, lat]]


def planar_ha(ring) -> float:
    """Área por projeção local (equiretangular) — referência independente para o cálculo do servidor."""
    lat0 = math.radians(sum(p[1] for p in ring[:-1]) / (len(ring) - 1))
    pts = [(p[0] * 111320 * math.cos(lat0), p[1] * 110574) for p in ring]
    return abs(sum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:]))) / 2 / 10000


@pytest.fixture(scope="module")
def client():
    from app.db import engine
    engine.dispose()  # outro módulo de teste pode ter apagado o banco com conexões abertas
    subprocess.run([sys.executable, str(ROOT / "scripts" / "seed_demo.py")], check=True, env=os.environ.copy())
    from fastapi.testclient import TestClient

    from app.main import app
    yield TestClient(app)
    engine.dispose()
    TMP_DB.unlink(missing_ok=True)


def new_account(client) -> dict:
    token = client.post("/api/auth/demo", json={"scenario": "nova"}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def answers(fields, municipality=RIBEIRAO):
    return {"profile": "familiar", "municipality": municipality, "fields": fields, "credit": [], "machines": [],
            "concerns": ["seca"], "goals": ["perdas"]}


def test_onboarding_creates_farm_and_fields(client):
    h = new_account(client)
    assert client.get("/api/onboarding", headers=h).json() == {"answers": None, "farm": None, "fields": []}
    ring = square(-47.85, -21.20)
    r = client.post("/api/onboarding", headers=h, json=answers([
        {"id": 1, "name": "Talhão 1", "areaHa": 9, "ring": ring, "color": "#2E7D4F", "crop": "soja", "soil": "argiloso", "irrigation": "nao"},
        {"id": 2, "name": "Talhão 2", "areaHa": 9, "ring": square(-47.84, -21.20), "crop": "milho", "soil": "nao_sei", "irrigation": "pivo"},
    ]))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["farm"]["geocode"] == "3543402" and body["farm"]["municipality"] == "Ribeirão Preto"
    assert abs(body["farm"]["lat"] - (-21.1985)) < 0.01
    f1, f2 = body["fields"]
    assert abs(f1["area_ha"] - planar_ha(ring)) / planar_ha(ring) < 0.02
    assert f1["crop"] == "Soja" and f1["crop_key"] == "soja" and f1["has_zarc"] is True
    assert f2["crop"] == "Milho 1ª Safra" and f2["irrigated"] is True and f2["irrigation"] == "pivo" and f2["soil"] is None
    assert body["answers"]["concerns"] == ["seca"]
    me = client.get("/api/me", headers=h).json()
    assert me["has_interview"] and me["counts"]["fields"] == 2
    assert abs(me["farm"]["total_area_ha"] - f1["area_ha"] - f2["area_ha"]) < 0.02
    # a mesma lista via /api/fields (usada pelo editor)
    assert [f["id"] for f in client.get("/api/fields", headers=h).json()] == [f1["id"], f2["id"]]


def test_redo_interview_replaces_without_duplicating(client):
    h = new_account(client)
    client.post("/api/onboarding", headers=h, json=answers([
        {"id": 1, "name": "A", "ring": square(-47.85, -21.20), "crop": "soja"},
        {"id": 2, "name": "B", "ring": square(-47.84, -21.20), "crop": "milho"}]))
    first = client.get("/api/fields", headers=h).json()
    keep = first[0]
    r = client.post("/api/onboarding", headers=h, json=answers([
        {"id": keep["id"], "name": "A renomeado", "ring": square(-47.85, -21.20), "crop": "feijao"},
        {"id": 999, "name": "Novo", "ring": square(-47.83, -21.20), "crop": "soja"}]))
    fields = r.json()["fields"]
    assert len(fields) == 2 and len(client.get("/api/fields", headers=h).json()) == 2
    assert fields[0]["id"] == keep["id"] and fields[0]["name"] == "A renomeado" and fields[0]["crop"] == "Feijão"
    assert first[1]["id"] not in {f["id"] for f in fields}


def test_crop_without_zarc_does_not_break(client):
    h = new_account(client)
    nowhere = {"name": "Município sem Zarc", "uf": "SP", "ibge": "3599999", "lat": -22.0, "lon": -48.0}
    r = client.post("/api/onboarding", headers=h, json=answers([
        {"id": 1, "name": "Horta", "ring": square(-48.0, -22.0), "crop": "hortalicas"},
        {"id": 2, "name": "Soja", "ring": square(-47.99, -22.0), "crop": "soja"}], nowhere))
    assert r.status_code == 200, r.text
    horta, soja = r.json()["fields"]
    assert horta["crop"] == "Hortaliças" and horta["has_zarc"] is False
    assert soja["crop"] == "Soja" and soja["has_zarc"] is False
    # e numa cidade com Zarc, hortaliças também não quebra
    r = client.post("/api/onboarding", headers=h, json=answers([{"id": 1, "name": "Horta", "ring": square(-47.85, -21.2), "crop": "hortalicas"}]))
    assert r.status_code == 200 and r.json()["fields"][0]["has_zarc"] is False


def test_fields_editor_uses_crop_key(client):
    h = new_account(client)
    client.post("/api/onboarding", headers=h, json=answers([{"id": 1, "name": "A", "ring": square(-47.85, -21.20), "crop": "soja"}]))
    geometry = {"type": "Polygon", "coordinates": [square(-47.83, -21.20)]}
    r = client.post("/api/fields", headers=h, json={"name": "Novo", "geometry": geometry, "crop_key": "milho", "irrigation": "gotejamento"})
    assert r.status_code == 201 and r.json()["crop"] == "Milho 1ª Safra" and r.json()["irrigated"] is True
    fid = r.json()["id"]
    r = client.put(f"/api/fields/{fid}", headers=h, json={"name": "Novo", "geometry": geometry, "crop_key": "cafe", "irrigation": "nao"})
    assert r.status_code == 200 and r.json()["crop_key"] == "cafe" and r.json()["irrigated"] is False
    assert client.delete(f"/api/fields/{fid}", headers=h).status_code == 204
    assert len(client.get("/api/fields", headers=h).json()) == 1


def test_demo_joao_untouched(client):
    token = client.post("/api/auth/demo", json={"scenario": "existente"}).json()["token"]
    h = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/me", headers=h).json()["producer"]["demo_scenario"] == "existente"
    fields = client.get("/api/fields", headers=h).json()
    assert [f["crop_key"] for f in fields] == ["soja", "milho", "feijao"]
    assert fields[2]["irrigation"] == "aspersao"
