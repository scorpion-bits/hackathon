"""APIs abertas consultadas ao vivo (sem chave), com cache em disco para funcionar sem internet.

- NASA POWER: chuva observada nos últimos 30 dias × normal climatológica do lugar ("está mais seco que o normal?")
- IBGE Malhas: contorno oficial do município (GeoJSON) para o mapa
- ANA/Embrapa: área irrigada por pivôs centrais por município, 1985–2019 (SNIRH, ArcGIS REST)

Sem rede: devolve o último cache (status "stale") ou available=False — nunca inventa número.
"""
from __future__ import annotations

import json
import time
from datetime import date, timedelta

import httpx

from ..db import DATA

CACHE_DIR = DATA / "cache"
POWER = "https://power.larc.nasa.gov/api/temporal"
IBGE_MALHA = "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{geocode}"
ANA_PIVOTS = "https://www.snirh.gov.br/arcgis/rest/services/SPR/Irrigada_Pivos_por_Municipios/MapServer/0/query"
PIVOT_YEARS = [1985, 1990, 1995, 2000, 2005, 2010, 2014, 2017, 2019]
# campos de quantidade vêm truncados (qtpivo_198…qtpivo_206), na mesma ordem dos anos de área (arha_1985…arha_2019)
PIVOT_COUNT_FIELDS = [f"qtpivo_{n}" for n in range(198, 207)]
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

SOURCES = {
    "nasa_power": {"key": "nasa_power", "name": "NASA POWER — chuva diária (satélite + reanálise) e climatologia",
                   "agency": "NASA Langley Research Center", "url": "https://power.larc.nasa.gov"},
    "ana_pivos": {"key": "ana_pivos", "name": "Levantamento da Agricultura Irrigada por Pivôs Centrais (1985–2019)",
                  "agency": "ANA / Embrapa", "url": "https://metadados.snirh.gov.br/geonetwork/srv/api/records/e2d38e3f-5e62-41ad-87ab-990490841073"},
    "ibge_malhas": {"key": "ibge_malhas", "name": "Malha municipal", "agency": "IBGE",
                    "url": "https://servicodados.ibge.gov.br/api/docs/malhas?versao=3"},
}


def cached_json(name: str, url: str, params: dict | None, ttl: float) -> tuple[dict | None, str, str | None]:
    """(dados, status, buscado_em). status: live | cache | stale | offline."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = CACHE_DIR / f"{name}.json"
    cached = json.loads(path.read_text()) if path.exists() else None
    if cached and time.time() - cached["_ts"] < ttl:
        return cached["data"], "cache", cached["_fetched_at"]
    try:
        r = httpx.get(url, params=params, timeout=15, follow_redirects=True)
        r.raise_for_status()
        data = r.json()
    except Exception:  # noqa: BLE001 — sem rede: usa o último cache, se houver
        if cached:
            return cached["data"], "stale", cached["_fetched_at"]
        return None, "offline", None
    fetched = time.strftime("%Y-%m-%dT%H:%M")
    path.write_text(json.dumps({"_ts": time.time(), "_fetched_at": fetched, "data": data}))
    return data, "live", fetched


def rain_vs_normal(lat: float, lon: float, days: int = 30, today: date | None = None) -> dict:
    """Chuva acumulada nos últimos `days` dias com dado × o esperado pela climatologia NASA POWER."""
    today = today or date.today()
    start = today - timedelta(days=days + 10)  # POWER tem ~3–5 dias de atraso: busca uma folga
    key = f"{lat:.2f}_{lon:.2f}"
    daily, status, fetched = cached_json(
        f"power_daily_{key}", f"{POWER}/daily/point",
        {"parameters": "PRECTOTCORR", "latitude": lat, "longitude": lon, "community": "AG", "format": "JSON",
         "start": start.strftime("%Y%m%d"), "end": today.strftime("%Y%m%d")}, ttl=6 * 3600)
    clim, _, _ = cached_json(
        f"power_clim_{key}", f"{POWER}/climatology/point",
        {"parameters": "PRECTOTCORR", "latitude": lat, "longitude": lon, "community": "AG", "format": "JSON"},
        ttl=30 * 24 * 3600)
    if not daily or not clim:
        return {"available": False, "status": status, "error": "NASA POWER indisponível (sem conexão e sem cache).",
                "source": SOURCES["nasa_power"]}

    series = daily["properties"]["parameter"]["PRECTOTCORR"]
    fill = daily.get("header", {}).get("fill_value", -999.0)
    valid = [(d, v) for d, v in sorted(series.items()) if v is not None and v != fill][-days:]
    if not valid:
        return {"available": False, "status": status, "error": "Sem dados recentes da NASA POWER.",
                "source": SOURCES["nasa_power"]}
    normal_per_day = clim["properties"]["parameter"]["PRECTOTCORR"]  # mm/dia, média de cada mês
    observed = sum(v for _, v in valid)
    normal = sum(normal_per_day[MONTHS[int(d[4:6]) - 1]] for d, _ in valid)
    ratio = observed / normal if normal else None
    if ratio is None:
        label = "sem referência"
    elif ratio < 0.6:
        label = "bem mais seco que o normal"
    elif ratio < 0.85:
        label = "mais seco que o normal"
    elif ratio <= 1.15:
        label = "dentro do normal"
    else:
        label = "mais chuvoso que o normal"
    fmt = lambda d: f"{d[6:8]}/{d[4:6]}/{d[:4]}"  # noqa: E731
    return {
        "available": True, "status": status, "fetched_at": fetched,
        "period": {"start": fmt(valid[0][0]), "end": fmt(valid[-1][0]), "days": len(valid)},
        "observed_mm": round(observed, 1), "normal_mm": round(normal, 1),
        "ratio": round(ratio, 2) if ratio is not None else None, "label": label,
        "daily": [{"date": f"{d[:4]}-{d[4:6]}-{d[6:]}", "rain_mm": round(v, 1)} for d, v in valid],
        "notes": ["Chuva estimada por satélite e reanálise (resolução ~50 km): indica a tendência da região, "
                  "não substitui pluviômetro na propriedade.",
                  "Normal = média climatológica de longo prazo da NASA POWER para cada mês."],
        "source": SOURCES["nasa_power"],
    }


def municipality_boundary(geocode: str) -> dict:
    """Contorno oficial do município (IBGE). Muda raramente: cache de 30 dias."""
    data, status, fetched = cached_json(
        f"ibge_malha_{geocode}", IBGE_MALHA.format(geocode=geocode),
        {"formato": "application/vnd.geo+json", "qualidade": "intermediaria"}, ttl=30 * 24 * 3600)
    if not data:
        return {"available": False, "status": status, "source": SOURCES["ibge_malhas"]}
    return {"available": True, "status": status, "fetched_at": fetched, "geojson": data, "source": SOURCES["ibge_malhas"]}


def _pivot_row(a: dict) -> dict:
    return {"geocode": str(a.get("cdmun")), "municipality": a.get("nmmun"), "uf": a.get("ufsg"),
            "series": [{"year": y, "area_ha": round(a.get(f"arha_{y}") or 0, 1), "pivots": int(a.get(c) or 0)}
                       for y, c in zip(PIVOT_YEARS, PIVOT_COUNT_FIELDS)]}


def pivots_near(lat: float, lon: float, geocode: str, radius_km: int = 50) -> dict:
    """Pivôs centrais (ANA/Embrapa) no município e nos vizinhos num raio de `radius_km`. Base de 2019: cache de 7 dias."""
    fields = ",".join(["cdmun", "nmmun", "ufsg"] + [f"arha_{y}" for y in PIVOT_YEARS] + PIVOT_COUNT_FIELDS)
    data, status, fetched = cached_json(
        f"ana_pivos_{lat:.2f}_{lon:.2f}_{radius_km}", ANA_PIVOTS,
        {"geometry": f"{lon},{lat}", "geometryType": "esriGeometryPoint", "inSR": 4326, "distance": radius_km,
         "units": "esriSRUnit_Kilometer", "spatialRel": "esriSpatialRelIntersects", "outFields": fields,
         "returnGeometry": "false", "f": "json"}, ttl=7 * 24 * 3600)
    feats = (data or {}).get("features")
    if not feats:
        return {"available": False, "status": status, "error": "Base de pivôs da ANA indisponível agora (sem conexão e sem cache).",
                "source": SOURCES["ana_pivos"]}
    rows = [_pivot_row(f["attributes"]) for f in feats]
    own = next((r for r in rows if r["geocode"] == str(geocode)), None)
    others = sorted((r for r in rows if r["geocode"] != str(geocode)), key=lambda r: -r["series"][-1]["area_ha"])
    last = lambda r: r["series"][-1]  # noqa: E731
    first = lambda r: r["series"][0]  # noqa: E731
    return {
        "available": True, "status": status, "fetched_at": fetched, "radius_km": radius_km,
        "municipality": own, "neighbors": others,
        "region": {"municipalities": len(rows),
                   "with_pivots": sum(1 for r in rows if last(r)["pivots"] > 0),
                   "pivots_1985": sum(first(r)["pivots"] for r in rows), "pivots_2019": sum(last(r)["pivots"] for r in rows),
                   "area_1985_ha": round(sum(first(r)["area_ha"] for r in rows), 1),
                   "area_2019_ha": round(sum(last(r)["area_ha"] for r in rows), 1)},
        "notes": ["Mapeamento por satélite até 2019 (série 1985–2019): não mostra pivôs instalados depois disso.",
                  f"Região = municípios que tocam um círculo de {radius_km} km em volta da propriedade."],
        "source": SOURCES["ana_pivos"],
    }
