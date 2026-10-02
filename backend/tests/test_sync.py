"""Sincronização com o portal CKAN do MAPA e APIs ao vivo — sem rede (respostas simuladas)."""
import importlib.util
import sys
import zipfile
from pathlib import Path

from app.services import live

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("fetch_opendata", ROOT / "scripts" / "fetch_opendata.py")
fetch = importlib.util.module_from_spec(spec)
sys.modules["fetch_opendata"] = fetch  # dataclass precisa do módulo registrado
spec.loader.exec_module(fetch)

ZARC = next(s for s in fetch.SPECS if s.key == "zarc")
BASE = "https://dados.agricultura.gov.br/dataset/x/resource/{}/download/{}"


def res(name, modified):
    return {"url": BASE.format("id", name), "last_modified": modified}


def test_select_keeps_two_latest_safras_and_ignores_other_files():
    pkg = {"name": "zarc", "resources": [
        res("dados-abertos-tabua-de-risco-safra-2024-2025.csv", "2026-10-02T07:11"),
        res("dados-abertos-tabua-de-risco-safra-2025-2026.csv", "2026-10-02T07:11"),
        res("dados-abertos-tabua-de-risco-safra-2026-2027.csv", "2026-10-02T07:11"),
        res("dados-abertos-tabua-de-risco-safra-perene-olericola-sem-safra.csv", "2026-10-02T07:12"),
        res("dicionario-de-dados-tabua-de-risco-2026.pdf", "2026-09-29T11:25"),
    ]}
    got = [r["_file"] for r in fetch.select_resources([pkg], ZARC)]
    assert got == ["dados-abertos-tabua-de-risco-safra-2025-2026.csv", "dados-abertos-tabua-de-risco-safra-2026-2027.csv"]


def test_needs_check_only_when_portal_publishes_newer_version(tmp_path):
    r = {**res("a.csv", "2026-10-03T07:00:00"), "_file": "a.csv"}
    assert fetch.needs_check(r, {}, tmp_path) == "arquivo novo"
    with zipfile.ZipFile(tmp_path / "a.csv.zip", "w") as zf:  # guardado zipado
        zf.writestr("a.csv", "x;y\n1;2\n")
    assert fetch.needs_check(r, {}, tmp_path)  # sem histórico: conferir
    assert fetch.needs_check(r, {"a.csv": {"version": "2026-10-03T07:00:00"}}, tmp_path) is None
    assert fetch.needs_check(r, {"a.csv": {"version": "2026-10-02T07:00:00"}}, tmp_path)


def test_content_hash_reads_inside_zip(tmp_path):
    (tmp_path / "a.csv").write_text("x;y\n1;2\n")
    with zipfile.ZipFile(tmp_path / "a.csv.zip", "w") as zf:
        zf.write(tmp_path / "a.csv", arcname="a.csv")
    assert fetch.content_hash(tmp_path / "a.csv.zip") == fetch.content_hash(tmp_path / "a.csv")


def test_rain_vs_normal_compares_with_climatology(monkeypatch):
    daily = {"header": {"fill_value": -999.0}, "properties": {"parameter": {"PRECTOTCORR": {
        "20260928": 10.0, "20260929": 5.0, "20260930": -999.0, "20261001": 2.0}}}}
    clim = {"properties": {"parameter": {"PRECTOTCORR": {m: 5.0 for m in live.MONTHS}}}}
    monkeypatch.setattr(live, "cached_json", lambda name, *a, **k: (daily if "daily" in name else clim, "live", "2026-10-02T10:00"))
    r = live.rain_vs_normal(-21.8, -48.2, days=30)
    assert r["observed_mm"] == 17.0 and r["normal_mm"] == 15.0  # dia sem dado (-999) fica de fora
    assert r["period"]["days"] == 3 and r["label"] == "dentro do normal"


def test_live_apis_offline_never_invent_numbers(monkeypatch):
    monkeypatch.setattr(live, "cached_json", lambda *a, **k: (None, "offline", None))
    assert live.rain_vs_normal(-21.8, -48.2)["available"] is False
    assert live.municipality_boundary("3503208")["available"] is False
