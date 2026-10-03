"""IA (M5): modo offline responde às perguntas do roteiro com fonte; histórico isolado por conta."""
import os
from datetime import date

import pytest

from tests.test_topics import NASA_OFF, TMP_DB, client, fixed_day  # noqa: F401  (fixtures compartilhadas)

for var in ("AGROBITS_LLM_API_KEY", "AGROIA_LLM_API_KEY"):
    os.environ.pop(var, None)


def ask(client, text, headers=None):
    r = client.post("/api/assistant/chat", json={"message": text}, headers=headers or {})
    assert r.status_code == 200, r.text
    return r.json()


def test_status_offline_without_key(client):
    s = client.get("/api/assistant/status").json()
    assert s["mode"] == "offline" and s["llm"] is False and s["model"] is None


def test_agrobits_env_alias(monkeypatch):
    from app.assistant.engine import llm_enabled, llm_model
    monkeypatch.setenv("AGROBITS_LLM_API_KEY", "k")
    monkeypatch.setenv("AGROBITS_LLM_MODEL", "m1")
    assert llm_enabled() and llm_model() == "m1"


def test_script_questions_have_sources(client):
    plant = ask(client, "Quando eu planto o milho do Talhão 2?")
    assert plant["mode"] == "offline" and any("zarc" in s["key"] for s in plant["sources"])
    zarc = ask(client, "O que é o Zarc?")
    assert "Zoneamento" in zarc["answer"] and zarc["sources"]
    assert ask(client, "Choveu mais que o normal?")["answer"]
    dose = ask(client, "Posso usar o fungicida no feijão?")
    assert "receituário" in dose["answer"] and "técnico" in dose["answer"]
    todo = ask(client, "O que eu faço?")
    assert "técnico" in todo["answer"] and todo["sources"]


def test_history_isolated_by_account(client):
    ask(client, "O que é o Zarc?")
    h = client.get("/api/assistant/history").json()
    assert any("Zarc" in m["content"] for m in h)
    token = client.post("/api/auth/demo", json={"scenario": "nova"}).json()["token"]
    other = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/assistant/history", headers=other).json() == []
    out = ask(client, "O que é o Zarc?", other)
    assert "propriedade" in out["answer"]  # conta sem fazenda: pede para configurar
    assert [m for m in client.get("/api/assistant/history", headers=other).json()] == []


def test_topic_tools(client):
    from app.db import SessionLocal
    from app.assistant.tools import run_tool
    from app.auth import default_producer
    with SessionLocal() as s:
        s.info["producer_id"] = default_producer(s).id
        res, srcs = run_tool(s, "get_topics", {})
        assert res["topics"] and srcs
        res2, srcs2 = run_tool(s, "explain_topic", {"key": res["topics"][0]["key"]})
        assert res2["next_step"] and srcs2
        assert "error" in run_tool(s, "explain_topic", {"key": "nao-existe"})[0]


def test_tools_accept_short_crop_name(client):
    """O LLM manda 'milho'; o Zarc guarda 'Milho 1ª Safra' — a ferramenta precisa resolver."""
    from app.db import SessionLocal
    from app.assistant.tools import run_tool
    from app.auth import default_producer
    with SessionLocal() as s:
        s.info["producer_id"] = default_producer(s).id
        z, srcs = run_tool(s, "get_zarc", {"field": "Talhão 2", "crop": "milho"})
        assert z.get("proximos_periodos") and srcs
        p, _ = run_tool(s, "plan_planting", {"field": "Talhão 2", "crop": "milho"})
        assert p.get("options")


def test_get_field_zarc_today_uses_planned_crop(client):
    """Talhão colhido (milho 2ª safra) e planejado para milho 1ª safra: o risco de hoje é o da cultura PLANEJADA,
    igual ao que a tela Resolver mostra (antes a IA dizia 'fora da janela' usando a safra já colhida)."""
    from app.db import SessionLocal
    from app.assistant.tools import run_tool
    from app.auth import default_producer
    with SessionLocal() as s:
        s.info["producer_id"] = default_producer(s).id
        f, _ = run_tool(s, "get_field", {"field": "Talhão 2"})
        z, _ = run_tool(s, "get_zarc", {"field": "Talhão 2"})
        if f.get("zarc_today"):
            assert f["zarc_today"]["crop"] == z["crop"]
            assert f["zarc_today"]["risk"] == z["proximos_periodos"][0]["risco"]
