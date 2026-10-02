"""Contas (M1): cadastro, login, contas demo e isolamento entre contas. Rodar: cd backend && pytest -q"""
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
TMP_DB = ROOT / "data" / "test_app.db"
os.environ["AGROIA_APP_DB"] = str(TMP_DB)
os.environ["AGROIA_WEATHER_FIXTURE"] = "1"

SQUARE = {"type": "Polygon", "coordinates": [[[-48.24, -21.83], [-48.239, -21.83], [-48.239, -21.829], [-48.24, -21.829], [-48.24, -21.83]]]}


@pytest.fixture(scope="module")
def client():
    subprocess.run([sys.executable, str(ROOT / "scripts" / "seed_demo.py")], check=True, env=os.environ.copy())
    from fastapi.testclient import TestClient

    from app.db import engine
    from app.main import app
    yield TestClient(app)
    engine.dispose()
    TMP_DB.unlink(missing_ok=True)


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_register_login_and_conflict(client):
    r = client.post("/api/auth/register", json={"name": "Maria Teste", "contact": "Maria@Teste.com", "password": "segredo1"})
    assert r.status_code == 201
    token = r.json()["token"]
    assert client.post("/api/auth/register", json={"name": "Outra", "contact": "maria@teste.com", "password": "xxxxxx1"}).status_code == 409
    assert client.post("/api/auth/login", json={"contact": "maria@teste.com", "password": "errada"}).status_code == 401
    r = client.post("/api/auth/login", json={"contact": " maria@teste.com ", "password": "segredo1"})
    assert r.status_code == 200 and r.json()["token"] != token

    me = client.get("/api/me", headers=auth(token)).json()
    assert me["producer"]["name"] == "Maria Teste" and me["producer"]["is_demo"] is False
    assert me["farm"] is None and me["has_interview"] is False
    assert me["counts"] == {"fields": 0, "stock_items": 0, "events": 0, "cases": 0}
    assert client.get("/api/farm", headers=auth(token)).json() is None

    client.post("/api/auth/logout", headers=auth(token))
    assert client.get("/api/me", headers=auth(token)).status_code == 401


def test_demo_new_account_is_empty(client):
    token = client.post("/api/auth/demo", json={"scenario": "nova"}).json()["token"]
    me = client.get("/api/me", headers=auth(token)).json()
    assert me["producer"]["is_demo"] is True and me["farm"] is None and me["has_interview"] is False
    assert client.get("/api/fields", headers=auth(token)).status_code == 404


def test_demo_existing_account(client):
    token = client.post("/api/auth/demo", json={"scenario": "existente"}).json()["token"]
    me = client.get("/api/me", headers=auth(token)).json()
    assert me["producer"]["is_demo"] is True and me["has_interview"] is True
    assert me["farm"]["geocode"] == "3503208"
    assert me["counts"]["fields"] == 3 and me["counts"]["cases"] == 1 and me["counts"]["stock_items"] == 10
    areas = [f["area_ha"] for f in client.get("/api/fields", headers=auth(token)).json()]
    # polígonos de mock.ts; o mock mostrava 5,36 / 3,08 / 2,05 ha escritos à mão, a área calculada fica perto
    assert all(abs(a - b) < 0.3 for a, b in zip(areas, [5.36, 3.08, 2.05])), areas
    # login com a senha de demonstração mostrada na tela
    assert client.post("/api/auth/login", json={"contact": "joao@demo.agrobits", "password": "demo1234"}).status_code == 200


def test_reloading_demo_undoes_changes(client):
    token = client.post("/api/auth/demo", json={"scenario": "existente"}).json()["token"]
    f = client.get("/api/fields", headers=auth(token)).json()[0]
    assert client.delete(f"/api/fields/{f['id']}", headers=auth(token)).status_code == 204
    client.post("/api/fields", headers=auth(token), json={"name": "Novo", "geometry": SQUARE})
    client.post("/api/fields", headers=auth(token), json={"name": "Outro", "geometry": SQUARE})
    assert client.get("/api/me", headers=auth(token)).json()["counts"]["fields"] == 4
    token2 = client.post("/api/auth/demo", json={"scenario": "existente"}).json()["token"]
    names = [x["name"] for x in client.get("/api/fields", headers=auth(token2)).json()]
    assert names == ["Talhão 1", "Talhão 2", "Talhão 3"]
    assert client.get("/api/me", headers=auth(token)).status_code == 200  # quem já estava logado continua


def test_account_cannot_touch_other_account(client):
    joao = client.post("/api/auth/demo", json={"scenario": "existente"}).json()["token"]
    field = client.get("/api/fields", headers=auth(joao)).json()[0]
    event = client.get("/api/events", headers=auth(joao)).json()[0]
    item = client.get("/api/stock/items", headers=auth(joao)).json()[0]
    other = client.post("/api/auth/register", json={"name": "Ana", "contact": "16999990000", "password": "abcdef1"}).json()["token"]
    h = auth(other)
    assert client.put(f"/api/fields/{field['id']}", headers=h, json={"name": "x", "geometry": SQUARE}).status_code == 404
    assert client.delete(f"/api/fields/{field['id']}", headers=h).status_code == 404
    assert client.get(f"/api/fields/{field['id']}/zarc", headers=h).status_code == 404
    assert client.delete(f"/api/events/{event['id']}", headers=h).status_code == 404
    assert client.delete(f"/api/stock/items/{item['id']}", headers=h).status_code == 404
    assert client.get("/api/me", headers=auth(joao)).json()["counts"]["fields"] == 3


def test_invalid_token_is_401(client):
    assert client.get("/api/fields", headers=auth("nao-existe")).status_code == 401
