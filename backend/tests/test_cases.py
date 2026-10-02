"""Casos (M4): consentimento, protocolo sequencial, snapshot com fontes, resposta de exemplo, funil. Rodar: cd backend && pytest -q"""
from test_topics import client, fixed_day  # noqa: F401 — reaproveita o ambiente (banco temporário, clima de teste, NASA simulada)


def _auth(client):
    r = client.post("/api/auth/demo", json={"scenario": "existente"})
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_casos(client):
    h = _auth(client)
    topics = client.get("/api/topics", headers=h).json()["topics"]
    key = topics[0]["key"]
    body = {"topic_key": key, "expert_id": "cati", "channel": "whatsapp", "path": topics[0]["paths"][0]["id"], "consent": False}
    assert client.post("/api/cases", json=body, headers=h).status_code == 400
    n0 = len(client.get("/api/cases", headers=h).json())
    a = client.post("/api/cases", json=body | {"consent": True}, headers=h)
    assert a.status_code == 201
    a = a.json()
    assert a["snapshot"]["sources"] and a["snapshot"]["question"] and a["status"] == "enviado"
    b = client.post("/api/cases", json=body | {"consent": True}, headers=h).json()
    assert int(b["protocol"][3:]) == int(a["protocol"][3:]) + 1
    assert len(client.get("/api/cases", headers=h).json()) == n0 + 2
    assert client.get(f"/api/topics/{key}", headers=h).json()["choice"] == body["path"]
    r = client.post(f"/api/cases/{a['id']}/demo-reply", headers=h).json()
    assert r["status"] == "respondido" and r["reply_is_example"] and "exemplo" in r["reply"]
    assert client.delete("/api/cases", headers=h).status_code == 204
    assert client.get("/api/cases", headers=h).json() == []
    assert client.get(f"/api/topics/{key}", headers=h).json()["choice"] is None


def test_caso_assunto_inexistente_e_experts(client):
    h = _auth(client)
    r = client.post("/api/cases", json={"topic_key": "nao-existe", "expert_id": "cati", "channel": "app", "consent": True}, headers=h)
    assert r.status_code == 404
    assert {e["id"] for e in client.get("/api/experts").json()} == {"cati", "senar", "prefeitura"}


def test_funil_e_fontes(client):
    h = _auth(client)
    f = client.get("/api/opendata/funnel", headers=h).json()
    assert f["available"] and f["steps"][0]["value"] > 1_000_000 and f["steps"][2]["value"] >= 1
    src = {s["key"]: s for s in client.get("/api/opendata/sources").json()}
    assert src["zarc"]["records"] > 1_000_000 and src["zarc"]["checked_at"]
