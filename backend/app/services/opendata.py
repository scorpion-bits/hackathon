"""Consultas aos dados abertos (opendata.db): Zarc, Agrofit, região, fontes."""
from __future__ import annotations

import unicodedata
from datetime import date
from functools import lru_cache

from ..db import OPENDATA_DB
from ..db import opendata as _connect

SOIL_CODES = {"arenoso": "1", "medio": "2", "argiloso": "3"}
# D-006: culturas zoneadas por classe de água disponível (AD1..AD6) — aproximação a partir da textura
SOIL_AD_APPROX = {"arenoso": "12", "medio": "14", "argiloso": "16"}
SOIL_LABELS = {"1": "Arenoso", "2": "Textura média", "3": "Argiloso", "11": "AD1", "12": "AD2", "13": "AD3",
               "14": "AD4", "15": "AD5", "16": "AD6"}
CYCLE_LABELS = {"13": "Perene", "19": "Semiperene", "20": "Grupo I (precoce)", "21": "Grupo II (médio)",
                "22": "Grupo III (tardio)", "24": "Grupo IV", "25": "Grupo V", "26": "Grupo VI"}


def decendio(d: date) -> int:
    """Decêndio do ano (1..36): dias 1–10, 11–20, 21–fim de cada mês."""
    return (d.month - 1) * 3 + min((d.day - 1) // 10, 2) + 1


def decendio_label(n: int) -> str:
    month = (n - 1) // 3 + 1
    part = (n - 1) % 3
    meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    return f"{['1–10', '11–20', '21–fim'][part]}/{meses[month - 1]}"


_loaded_mtime = 0.0


def opendata():
    """Conexão somente leitura; se o banco foi reconstruído (fetch_opendata.py), descarta os caches."""
    global _loaded_mtime
    mtime = OPENDATA_DB.stat().st_mtime
    if mtime != _loaded_mtime:
        _loaded_mtime = mtime
        for fn in (zarc_crops, latest_safra, source):
            fn.cache_clear()
    return _connect()


def norm(text: str) -> str:
    return unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().lower().strip()


@lru_cache(maxsize=256)
def zarc_crops(geocode: str) -> list[str]:
    with opendata() as con:
        rows = con.execute("SELECT DISTINCT crop FROM zarc_risk WHERE geocode=? ORDER BY crop", (geocode,)).fetchall()
    return [r["crop"] for r in rows]


def zarc_for(geocode: str, crop: str, soil: str | None, irrigated: bool) -> dict:
    """Escolhe a linha do Zarc mais adequada ao talhão e devolve os 36 decêndios com risco (0/20/30/40)."""
    if not crop:
        return {"available": False, "reason": "Talhão sem cultura definida."}
    with opendata() as con:
        rows = [dict(r) for r in con.execute(
            "SELECT safra, crop, cycle, soil, management, ordinance, risk FROM zarc_risk WHERE geocode=? AND crop=?",
            (geocode, crop))]
    if not rows:
        return {"available": False, "reason": f"Não há zoneamento (Zarc) para {crop} neste município nas safras disponíveis."}
    notes = []
    # safra mais recente com zoneamento para esta cultura (o fetch_opendata.py mantém as duas últimas publicadas)
    safra = max(r["safra"] for r in rows)
    newest = latest_safra()
    if safra != newest:
        notes.append(f"Safra {newest} ainda sem zoneamento publicado para esta cultura; usando {safra}.")
    rows = [r for r in rows if r["safra"] == safra]
    management = "Irrigado" if irrigated else "Sequeiro"
    if any(r["management"] == management for r in rows):
        rows = [r for r in rows if r["management"] == management]
    elif irrigated:
        notes.append("Sem zoneamento para manejo irrigado; mostrando sequeiro.")
    soil_estimated = False
    if soil:
        code = SOIL_CODES.get(soil)
        if any(r["soil"] == code for r in rows):
            rows = [r for r in rows if r["soil"] == code]
        else:
            ad = SOIL_AD_APPROX.get(soil)
            if any(r["soil"] == ad for r in rows):
                rows = [r for r in rows if r["soil"] == ad]
                soil_estimated = True
                notes.append(f"Zarc desta cultura usa classes de água disponível; {SOIL_LABELS[ad]} estimada a partir da textura '{soil}'.")
    else:
        notes.append("Tipo de solo do talhão não informado — risco pode variar por solo.")
    cycle = "21" if any(r["cycle"] == "21" for r in rows) else sorted(r["cycle"] for r in rows)[0]
    row = next(r for r in rows if r["cycle"] == cycle)
    risk = [int(c) * 10 for c in row["risk"]]
    return {
        "available": True, "safra": safra, "crop": crop, "cycle": cycle, "cycle_label": CYCLE_LABELS.get(cycle, cycle),
        "soil_code": row["soil"], "soil_label": SOIL_LABELS.get(row["soil"], row["soil"]), "soil_estimated": soil_estimated,
        "management": row["management"], "ordinance": row["ordinance"], "risk": risk,
        "labels": [decendio_label(i) for i in range(1, 37)], "notes": notes,
        "source": source("zarc"),
    }


def risk_text(value: int) -> str:
    return {0: "fora da janela indicada", 20: "risco baixo (20%)", 30: "risco médio (30%)", 40: "risco alto (40%)"}.get(value, f"{value}%")


def agrofit_check(product: str, crop: str | None = None, limit: int = 8) -> dict:
    key = f"%{norm(product)}%"
    with opendata() as con:
        rows = [dict(r) for r in con.execute(
            "SELECT registration, brand, crop, ingredient, product_class, tox_class, env_class, organic, pests "
            "FROM agrofit WHERE brand_norm LIKE ? ORDER BY brand LIMIT 400", (key,))]
    if not rows:
        return {"found": False, "product": product, "source": source("agrofit")}
    brands = sorted({r["brand"] for r in rows})
    registered_for_crop = None
    crop_rows = []
    if crop:
        ck = norm(crop.split(" ")[0])
        crop_rows = [r for r in rows if norm(r["crop"]).startswith(ck) or norm(r["crop"]) == "todas as culturas"]
        registered_for_crop = bool(crop_rows)
    first = (crop_rows or rows)[0]
    return {
        "found": True, "product": product, "brands": brands[:5], "registration": first["registration"],
        "ingredient": first["ingredient"], "product_class": first["product_class"], "tox_class": first["tox_class"],
        "env_class": first["env_class"], "organic": first["organic"], "crop": crop,
        "registered_for_crop": registered_for_crop,
        "crops": sorted({r["crop"] for r in rows})[:limit],
        "pests_for_crop": (crop_rows[0]["pests"] if crop_rows else None),
        "disclaimer": "Informação de registro. Uso de agrotóxico exige receituário agronômico (Lei 7.802/1989).",
        "source": source("agrofit"),
    }


def agrofit_registration(registration: str, crops: list[str]) -> dict:
    """Produto pelo número de registro no Agrofit e para quais destas culturas ele é registrado."""
    with opendata() as con:
        rows = [dict(r) for r in con.execute(
            "SELECT registration, brand, crop, ingredient, product_class, tox_class, pests FROM agrofit "
            "WHERE registration=? ORDER BY brand", (registration,))]
    if not rows:
        return {"found": False, "registration": registration, "source": source("agrofit")}
    matches = []
    for crop in crops:
        ck = norm(crop.split(" ")[0])
        hit = next((r for r in rows if norm(r["crop"]).startswith(ck) or norm(r["crop"]) == "todas as culturas"), None)
        if hit:
            matches.append({"crop": crop, "agrofit_crop": hit["crop"], "pests": hit["pests"]})
    first = rows[0]
    return {
        "found": True, "registration": registration, "brand": first["brand"], "ingredient": first["ingredient"],
        "product_class": first["product_class"], "tox_class": first["tox_class"],
        "crops": sorted({r["crop"] for r in rows}), "matches": matches, "source": source("agrofit"),
    }


def agrofit_search(term: str, limit: int = 15) -> list[dict]:
    with opendata() as con:
        rows = con.execute(
            "SELECT DISTINCT registration, brand, product_class, tox_class FROM agrofit WHERE brand_norm LIKE ? "
            "ORDER BY brand LIMIT ?", (f"%{norm(term)}%", limit)).fetchall()
    return [dict(r) for r in rows]


def region(geocode: str) -> dict:
    with opendata() as con:
        r = con.execute("SELECT * FROM region_stats WHERE geocode=?", (geocode,)).fetchone()
        uf_drones = None
        if r:
            uf_drones = con.execute("SELECT SUM(drones) FROM region_stats WHERE uf=?", (r["uf"],)).fetchone()[0]
            br = con.execute("SELECT SUM(drones), SUM(drones>0), COUNT(*) FROM region_stats").fetchone()
    if not r:
        return {"available": False}
    d = dict(r)
    d.update({
        "available": True, "uf_drones": uf_drones, "br_drones": br[0], "br_municipalities_with_drones": br[1],
        "br_municipalities": br[2], "zarc_crops": zarc_crops(geocode),
        "sources": [source("sipeagro_aviacao"), source("psr"), source("zarc")],
        "notes": ["Drones/aviões: sede do operador registrado no MAPA (pode atuar em outros municípios).",
                  "Seguro rural: municípios com menos de 3 apólices não são exibidos (privacidade)."],
    })
    return d


@lru_cache(maxsize=1)
def latest_safra() -> str:
    with opendata() as con:
        return con.execute("SELECT MAX(safra) FROM zarc_risk").fetchone()[0]


@lru_cache(maxsize=16)
def source(key: str) -> dict:
    with opendata() as con:
        r = con.execute("SELECT * FROM data_sources WHERE key=?", (key,)).fetchone()
    return dict(r) if r else {"key": key}


def all_sources() -> list[dict]:
    with opendata() as con:
        return [dict(r) for r in con.execute("SELECT * FROM data_sources")]
