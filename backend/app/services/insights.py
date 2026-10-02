"""Alertas (regras documentadas em docs/05-architecture.md) e Planejador de plantio."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AlertState, Event, Farm, Field, StockItem
from . import opendata as od
from .farmdata import field_status, item_dict, today
from .weather import forecast

HEAVY_RAIN_MM = 50
FROST_C = 3


def _alert(key, kind, severity, title, why, link, field_ids=(), item_ids=(), source=None, read=False):
    return {"key": key, "kind": kind, "severity": severity, "title": title, "why": why, "link": link,
            "field_ids": list(field_ids), "item_ids": list(item_ids), "source": source, "read": read}


def compute_alerts(session: Session, farm: Farm, weather: dict | None = None) -> list[dict]:
    read_keys = {a.key for a in session.scalars(select(AlertState))}
    alerts: list[dict] = []
    fields = session.scalars(select(Field).where(Field.farm_id == farm.id)).all()

    for item in session.scalars(select(StockItem).where(StockItem.farm_id == farm.id)):
        d = item_dict(item)
        if d["low_stock"]:
            alerts.append(_alert(f"low:{item.id}", "estoque", "atencao", f"Estoque baixo: {item.name}",
                                 f"Restam {d['quantity']:g} {item.unit} (mínimo definido: {item.min_quantity:g} {item.unit}).",
                                 "/estoque", item_ids=[item.id]))
        dte = d["days_to_expiry"]
        if dte is not None and d["quantity"] > 0 and dte <= 30:
            sev = "critico" if dte < 0 else "atencao"
            when = f"venceu há {-dte} dias" if dte < 0 else f"vence em {dte} dias ({item.expiry_date.strftime('%d/%m')})"
            alerts.append(_alert(f"exp:{item.id}", "validade", sev, f"{item.name} {when}",
                                 f"Há {d['quantity']:g} {item.unit} em estoque. Planeje o uso ou a devolução/descarte correto.",
                                 "/estoque", item_ids=[item.id]))

    for f in fields:
        st = field_status(session, f)
        if st["stage"] != "plantado" or not st["crop"]:
            continue
        planted = date.fromisoformat(st["since"])
        if (today() - planted).days > 60:
            continue
        z = od.zarc_for(farm.geocode, st["crop"], f.soil, f.irrigated)
        if not z.get("available"):
            continue
        r = z["risk"][od.decendio(planted) - 1]
        if r == 0 or r >= 30:
            sev = "critico" if r in (0, 40) else "atencao"
            alerts.append(_alert(
                f"zarc:{f.id}:{planted.isoformat()}", "zarc", sev,
                f"{f.name}: plantio em período de {od.risk_text(r)}",
                f"O Zarc ({z['safra']}) indica {od.risk_text(r)} para {st['crop']} plantado em "
                f"{od.decendio_label(od.decendio(planted))} neste município e solo. Plantio fora do Zarc pode afetar "
                "acesso ao Proagro e à subvenção do seguro rural.",
                "/producao", field_ids=[f.id], source=z["source"]))

    weather = weather if weather is not None else forecast(farm.lat, farm.lon)
    if weather.get("available"):
        planted_ids = [f.id for f in fields if field_status(session, f)["stage"] == "plantado"]
        for day in weather["daily"][:7]:
            if (day["rain_mm"] or 0) >= HEAVY_RAIN_MM:
                alerts.append(_alert(f"rain:{day['date']}", "clima", "atencao",
                                     f"Chuva forte prevista em {date.fromisoformat(day['date']).strftime('%d/%m')}: {day['rain_mm']:.0f} mm",
                                     "Risco de erosão e lavagem de produtos aplicados; evite aplicações na véspera. "
                                     "Talhões recém-plantados são os mais sensíveis.",
                                     "/clima", field_ids=planted_ids, source=weather["source"]))
            if day["tmin"] is not None and day["tmin"] <= FROST_C:
                alerts.append(_alert(f"cold:{day['date']}", "clima", "atencao",
                                     f"Temperatura baixa em {date.fromisoformat(day['date']).strftime('%d/%m')}: mín. {day['tmin']:.0f} °C",
                                     "Possibilidade de geada em baixadas.", "/clima", source=weather["source"]))
    order = {"critico": 0, "atencao": 1, "info": 2}
    for a in alerts:
        a["read"] = a["key"] in read_keys
    return sorted(alerts, key=lambda a: (a["read"], order[a["severity"]]))


def plan_planting(session: Session, farm: Farm, field: Field, crop: str | None = None,
                  seed_rate_kg_ha: float | None = None, horizon: int = 12, weather: dict | None = None) -> dict:
    """Otimização simples e explicável: escolhe o decêndio de menor risco Zarc nos próximos `horizon` decêndios,
    preferindo o mais cedo; cruza com previsão de chuva e saldo de sementes no estoque."""
    crop = crop or field.crop
    z = od.zarc_for(farm.geocode, crop, field.soil, field.irrigated)
    result: dict = {"field": field.name, "field_id": field.id, "crop": crop, "area_ha": field.area_ha, "zarc": z}
    if not z.get("available"):
        result["recommendation"] = z.get("reason")
        return result

    start = today()
    options = []
    seen = set()
    d = start
    while len(options) < horizon:
        dec = od.decendio(d)
        if dec not in seen:
            seen.add(dec)
            day_start = d if not options else d.replace(day=[1, 11, 21][(dec - 1) % 3])
            options.append({"decendio": dec, "label": od.decendio_label(dec), "start": day_start.isoformat(),
                            "risk": z["risk"][dec - 1]})
        d += timedelta(days=1)

    weather = weather if weather is not None else forecast(farm.lat, farm.lon)
    if weather.get("available"):
        by_day = {w["date"]: w for w in weather["daily"]}
        for o in options:
            s = date.fromisoformat(o["start"])
            days = [by_day.get((s + timedelta(days=i)).isoformat()) for i in range(10)]
            days = [x for x in days if x]
            if days:
                o["rain_mm"] = round(sum(x["rain_mm"] or 0 for x in days), 1)
                o["heavy_rain"] = any((x["rain_mm"] or 0) >= HEAVY_RAIN_MM for x in days)
                o["forecast_days"] = len(days)

    valid = [o for o in options if o["risk"] > 0]
    if not valid:
        result["recommendation"] = "Nenhum período indicado pelo Zarc nas próximas semanas para esta cultura/solo."
        result["options"] = options
        return result
    best_risk = min(o["risk"] for o in valid)
    best = next(o for o in valid if o["risk"] == best_risk and not o.get("heavy_rain"))  if any(
        o["risk"] == best_risk and not o.get("heavy_rain") for o in valid) else next(o for o in valid if o["risk"] == best_risk)
    now = options[0]

    # sementes
    rate = seed_rate_kg_ha or field.seed_rate_kg_ha
    seeds = [item_dict(i) for i in session.scalars(select(StockItem).where(
        StockItem.farm_id == farm.id, StockItem.category == "semente"))]
    key = od.norm(crop.split(" ")[0])
    seeds = [s for s in seeds if s["crop"] and od.norm(s["crop"]).startswith(key)]
    available = sum(s["quantity"] for s in seeds if s["unit"] == "kg")
    seed_info = {"rate_kg_ha": rate, "rate_origin": "declarado pelo produtor" if rate else None,
                 "available_kg": round(available, 1), "items": [s["name"] for s in seeds]}
    if rate:
        need = round(rate * field.area_ha, 1)
        seed_info.update({"needed_kg": need, "missing_kg": round(max(0.0, need - available), 1)})

    parts = []
    if now["risk"] == best["risk"]:
        parts.append(f"Plantar agora ({now['label']}) já está no menor risco disponível: {od.risk_text(now['risk'])}.")
    else:
        parts.append(f"Agora ({now['label']}): {od.risk_text(now['risk'])}. Melhor janela: a partir de "
                     f"{date.fromisoformat(best['start']).strftime('%d/%m')} ({best['label']}), {od.risk_text(best['risk'])}.")
    if best.get("rain_mm") is not None:
        parts.append(f"Chuva prevista nos 10 dias da janela: {best['rain_mm']:.0f} mm"
                     + (" — atenção: há dia com chuva forte." if best.get("heavy_rain") else "."))
    if seed_info.get("missing_kg"):
        parts.append(f"Sementes: precisa de {seed_info['needed_kg']:g} kg para {field.area_ha:g} ha; "
                     f"há {available:g} kg — faltam {seed_info['missing_kg']:g} kg.")
    elif rate:
        parts.append(f"Sementes suficientes: {available:g} kg disponíveis para {seed_info['needed_kg']:g} kg necessários.")
    result.update({"options": options, "best": best, "now": now, "seed": seed_info,
                   "recommendation": " ".join(parts), "weather_status": weather.get("status")})
    return result
