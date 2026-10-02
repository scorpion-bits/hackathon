"""Previsão do tempo (Open-Meteo, sem chave) com cache em disco.

Sem internet: devolve o último cache (marcado como desatualizado) ou available=False.
AGROIA_WEATHER_FIXTURE=1 usa um arquivo de desenvolvimento, sempre rotulado como SIMULADO.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

from ..db import DATA
from .opendata import source

CACHE = DATA / "weather_cache.json"
FIXTURE = Path(__file__).resolve().parents[2] / "tests" / "fixtures" / "weather_fixture.json"
TTL = 3600
URL = "https://api.open-meteo.com/v1/forecast"

WMO = {0: "Céu limpo", 1: "Predomínio de sol", 2: "Parcialmente nublado", 3: "Nublado", 45: "Neblina", 48: "Neblina",
       51: "Garoa fraca", 53: "Garoa", 55: "Garoa forte", 61: "Chuva fraca", 63: "Chuva", 65: "Chuva forte",
       80: "Pancadas fracas", 81: "Pancadas de chuva", 82: "Pancadas fortes", 95: "Trovoadas", 96: "Trovoadas com granizo",
       99: "Trovoadas com granizo"}


def _shape(raw: dict, status: str) -> dict:
    daily = raw["daily"]
    days = [
        {"date": d, "tmax": daily["temperature_2m_max"][i], "tmin": daily["temperature_2m_min"][i],
         "rain_mm": daily["precipitation_sum"][i], "rain_prob": (daily.get("precipitation_probability_max") or [None] * 99)[i],
         "code": daily["weather_code"][i], "summary": WMO.get(daily["weather_code"][i], "—")}
        for i, d in enumerate(daily["time"])
    ]
    cur = raw.get("current", {})
    return {
        "available": True, "status": status,  # live | cache | stale | simulated
        "fetched_at": raw.get("_fetched_at"),
        "current": {"temp": cur.get("temperature_2m"), "humidity": cur.get("relative_humidity_2m"),
                    "rain_mm": cur.get("precipitation"), "wind_kmh": cur.get("wind_speed_10m"),
                    "summary": WMO.get(cur.get("weather_code"), "—")},
        "daily": days,
        "rain_next_7d_mm": round(sum(d["rain_mm"] or 0 for d in days[:7]), 1),
        "source": source("open_meteo"),
    }


def forecast(lat: float, lon: float) -> dict:
    if os.environ.get("AGROIA_WEATHER_FIXTURE") == "1":
        return _shape(json.loads(FIXTURE.read_text()), "simulated")
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else None
    key = f"{lat:.3f},{lon:.3f}"
    if cache and cache.get("_key") == key and time.time() - cache.get("_ts", 0) < TTL:
        return _shape(cache, "cache")
    try:
        r = httpx.get(URL, timeout=8, params={
            "latitude": lat, "longitude": lon, "timezone": "America/Sao_Paulo", "forecast_days": 16,
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
        })
        r.raise_for_status()
        raw = r.json()
        raw.update({"_key": key, "_ts": time.time(), "_fetched_at": time.strftime("%Y-%m-%dT%H:%M")})
        CACHE.write_text(json.dumps(raw))
        return _shape(raw, "live")
    except Exception as exc:  # noqa: BLE001 — sem rede, segue com cache
        if cache and cache.get("_key") == key:
            data = _shape(cache, "stale")
            data["error"] = f"Sem conexão: mostrando previsão de {cache.get('_fetched_at')}"
            return data
        return {"available": False, "status": "offline", "error": f"Previsão indisponível ({type(exc).__name__}).",
                "source": source("open_meteo")}
