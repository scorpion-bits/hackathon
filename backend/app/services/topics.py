"""Motor de assuntos (M3): dados da conta × fontes reais → assuntos do início guiado e da tela Resolver.

Uma função por regra. Cada assunto leva evidências com fonte e data, 2–3 caminhos (topics_text.py) e o órgão
de ATER indicado. Regras de dados (D-022): fonte fora → a regra não gera assunto e `sources_status` diz
`offline`; com cache antigo (`stale`) o assunto sai com "dado real de <data>". Nada de número inventado.
"""
from __future__ import annotations

import calendar
import time
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Event, Farm, Field, Interview, StockItem, TopicState
from . import context as ctx
from . import farmdata as fd
from . import live
from . import opendata as od
from . import topics_text as tx
from . import weather

HEAVY_RAIN_MM = 40
DRY_DAY_MM = 2
EXPIRY_DAYS = 30
CACHE_TTL = 600  # 10 min por conta (consultas externas)
EXPERT = {"janela_plantio": "cati", "janela_aberta": "cati", "chuva_forte": "cati", "chuva_vs_normal": "cati",
          "semente_insuficiente": "senar", "defensivo_registro": "cati", "servico_drone": "prefeitura"}

_cache: dict[int, tuple[float, tuple, dict]] = {}


def clear_cache() -> None:
    _cache.clear()


def _external(producer_id: int, farm: Farm) -> dict:
    """Previsão (Open-Meteo) e chuva × normal (NASA POWER) da propriedade, guardadas 10 min por conta."""
    loc = (round(farm.lat, 3), round(farm.lon, 3))
    hit = _cache.get(producer_id)
    if hit and hit[1] == loc and time.time() - hit[0] < CACHE_TTL:
        return hit[2]
    data = {"weather": weather.forecast(farm.lat, farm.lon), "nasa": live.rain_vs_normal(farm.lat, farm.lon)}
    if data["weather"].get("available") and data["nasa"].get("available"):  # fonte fora não fica 10 min "offline" no cache
        _cache[producer_id] = (time.time(), loc, data)
    return data


# ---------------- utilidades ----------------
def _src(key: str, date_txt: str | None = None) -> dict:
    s = live.SOURCES[key] if key in live.SOURCES else od.source(key)
    return {"key": key, "name": s.get("name", key), "agency": s.get("agency"), "date": date_txt or s.get("extracted_at")}


ACCOUNT_SRC = {"key": "conta", "name": "Dados da sua conta (declarados por você)", "agency": None, "date": None}


def _dec_range(n: int, year: int) -> tuple[date, date]:
    month, part = (n - 1) // 3 + 1, (n - 1) % 3
    start = date(year, month, [1, 11, 21][part])
    end = date(year, month, [10, 20, calendar.monthrange(year, month)[1]][part])
    return start, end


def _ahead(today: date, count: int = 36) -> list[tuple[int, date, date]]:
    """Decêndios a partir do atual: (número 1..36, início, fim), virando o ano."""
    out, n, year = [], od.decendio(today), today.year
    for _ in range(count):
        s, e = _dec_range(n, year)
        out.append((n, s, e))
        n += 1
        if n > 36:
            n, year = 1, year + 1
    return out


def _stale_note(status: str, fetched: str | None) -> str | None:
    if status == "stale":
        return f"Dado real de {_when(fetched)}; a fonte está fora do ar agora."
    if status == "simulated":
        return "Previsão SIMULADA (teste automatizado)."
    return None


def _when(fetched: str | None) -> str:
    try:
        return datetime.fromisoformat(fetched).strftime("%d/%m %Hh%M")
    except (TypeError, ValueError):
        return fetched or "data desconhecida"


def _planted(session: Session, f: Field) -> bool:
    return fd.field_status(session, f)["stage"] == "plantado"


def _topic(key: str, kind: str, priority: str, text: dict, sources: list[dict], field: Field | None, evidence: dict,
           summary_extra: str | None = None) -> dict:
    why = list(text["why"])
    if summary_extra:
        why.append(summary_extra)
    return {"key": key, "kind": kind, "priority": priority, "title": text["title"], "summary": text["summary"],
            "question": text["question"], "why": why, "sources": sources,
            "field_id": field.id if field else None, "field": field.name if field else None,
            "evidence": evidence, "paths": text["paths"], "expert_id": EXPERT[kind], "choice": None}


# ---------------- regras ----------------
def rule_zarc(session: Session, farm: Farm, fields: list[Field]) -> list[dict]:
    """janela_plantio / janela_aberta — talhões sem lavoura em pé, com cultura zoneada no município."""
    today = fd.today()
    seq = _ahead(today)
    cur = seq[0][0]
    topics = []
    farm_crops = list(dict.fromkeys(f.crop for f in fields if f.crop))
    for f in fields:
        if not f.crop or _planted(session, f) or not ctx.has_zarc(farm.geocode, f.crop):
            continue
        z = od.zarc_for(farm.geocode, f.crop, f.soil, f.irrigated)
        if not z.get("available"):
            continue
        risk = z["risk"]
        positive = [r for r in risk if r > 0]
        if not positive:
            continue
        best, now = min(positive), risk[cur - 1]
        crop_label = f.crop.split(" ")[0]  # "Milho 1ª Safra" → "Milho" nos títulos
        ckey = ctx.crop_key(f.crop) or od.norm(f.crop).replace(" ", "_")
        sources = [_src("zarc", f"safra {z['safra']} · extraído em {od.source('zarc').get('extracted_at')}"), ACCOUNT_SRC]
        evidence = {"type": "zarc", "series": risk, "labels": z["labels"], "today_decendio": cur, "crop": f.crop,
                    "soil": z["soil_label"], "soil_declared": f.soil, "soil_estimated": z["soil_estimated"],
                    "safra": z["safra"], "cycle": z["cycle_label"], "management": z["management"],
                    "ordinance": z["ordinance"], "notes": z["notes"]}
        note = f"Zarc {z['safra']} · {farm.municipality} · {f.crop} · {z['cycle_label']} · solo {z['soil_label']}" + (
            f" (estimado a partir do solo declarado '{f.soil}')" if z["soil_estimated"] else "")
        if now == best:
            end = seq[0][2]
            for n, _, e in seq[1:]:
                if risk[n - 1] != best:
                    break
                end = e
            text = tx.janela_aberta(f.name, crop_label, od.decendio_label(cur), best, end)
            evidence["window"] = {"start": today.isoformat(), "end": end.isoformat(), "risk": best}
            t = _topic(f"janela:{f.id}:{ckey}", "janela_aberta", "oportunidade", text, sources, f, evidence)
        else:
            idx = next(i for i, (n, _, _) in enumerate(seq) if risk[n - 1] == best)
            start = seq[idx][1]
            end = seq[idx][2]
            for n, _, e in seq[idx + 1:]:
                if risk[n - 1] != best:
                    break
                end = e
            steps = [(od.decendio_label(n), risk[n - 1]) for n, _, _ in seq[1:idx + 1]][-4:]
            alt = None
            for other in farm_crops + ["Soja", "Milho 1ª Safra", "Feijão"]:
                if other == f.crop or not ctx.has_zarc(farm.geocode, other):
                    continue
                oz = od.zarc_for(farm.geocode, other, f.soil, f.irrigated)
                if oz.get("available") and 0 < oz["risk"][cur - 1] <= best:
                    alt = (other, oz["risk"][cur - 1])
                    break
            text = tx.janela_plantio(f.name, crop_label, od.decendio_label(cur), now, start, end, best,
                                     (start - today).days, steps, alt)
            evidence["window"] = {"start": start.isoformat(), "end": end.isoformat(), "risk": best}
            priority = "agir" if now in (0, 40) and (start - today).days <= 45 else "atencao"
            t = _topic(f"plantio:{f.id}:{ckey}", "janela_plantio", priority, text, sources, f, evidence)
        t["evidence_note"] = note
        topics.append(t)
    return topics


def rule_chuva_forte(session: Session, farm: Farm, fields: list[Field], w: dict) -> list[dict]:
    if not w.get("available"):
        return []
    today = fd.today()
    days = [d for d in w["daily"] if d["date"] >= today.isoformat()][:7]
    heavy = [d for d in days if (d["rain_mm"] or 0) >= HEAVY_RAIN_MM]
    if not heavy:
        return []
    top = max(heavy, key=lambda d: d["rain_mm"])
    day = date.fromisoformat(top["date"])
    dry = [(date.fromisoformat(d["date"]), d["rain_mm"] or 0) for d in days
           if d["date"] < top["date"] and (d["rain_mm"] or 0) <= DRY_DAY_MM and d["date"] >= today.isoformat()][-3:]
    after = next(((date.fromisoformat(d["date"]), d["rain_mm"] or 0) for d in w["daily"] if d["date"] > top["date"]), None)
    # talhão com preparo de solo recente (solo exposto) — dado da conta
    prepared, pfield = None, None
    ids = {f.id: f for f in fields}
    for e in session.scalars(select(Event).where(Event.farm_id == farm.id, Event.date >= today - timedelta(days=45))
                             .order_by(Event.date.desc())):
        if e.field_id in ids and "preparo" in od.norm(e.title) and not _planted(session, ids[e.field_id]):
            pfield = ids[e.field_id]
            prepared = (pfield.name, e.date)
            break
    text = tx.chuva_forte(day, top["rain_mm"], dry, after, prepared)
    evidence = {"type": "rain", "threshold_mm": HEAVY_RAIN_MM, "status": w["status"], "fetched_at": w.get("fetched_at"),
                "days": [{"date": d["date"], "mm": d["rain_mm"], "prob": d["rain_prob"]} for d in days]}
    sources = [_src("open_meteo", _when(w.get("fetched_at")))] + ([ACCOUNT_SRC] if prepared else [])
    t = _topic(f"chuva:{top['date']}", "chuva_forte", "atencao", text, sources, pfield, evidence,
               _stale_note(w["status"], w.get("fetched_at")))
    t["evidence_note"] = f"Previsão Open-Meteo para {farm.municipality} ({farm.lat:.3f}, {farm.lon:.3f})"
    return [t]


def rule_chuva_vs_normal(session: Session, farm: Farm, fields: list[Field], nasa: dict) -> list[dict]:
    if not nasa.get("available") or nasa.get("ratio") is None:
        return []
    ratio = nasa["ratio"]
    if 0.5 <= ratio <= 1.5:
        return []
    irrigated = next((f.name for f in fields if f.irrigated), None)
    p = nasa["period"]
    text = tx.chuva_vs_normal(nasa["observed_mm"], nasa["normal_mm"], ratio, p["start"], p["end"], p["days"], irrigated)
    evidence = {"type": "rain_normal", "observed_mm": nasa["observed_mm"], "normal_mm": nasa["normal_mm"], "ratio": ratio,
                "label": nasa["label"], "period": p, "status": nasa["status"],
                "days": [{"date": d["date"], "mm": d["rain_mm"]} for d in nasa["daily"]], "notes": nasa["notes"]}
    kind = "seco" if ratio < 1 else "chuvoso"
    t = _topic(f"chuva_normal:{kind}", "chuva_vs_normal", "atencao" if ratio < 1 else "info", text,
               [_src("nasa_power", _when(nasa.get("fetched_at")))], None, evidence,
               _stale_note(nasa["status"], nasa.get("fetched_at")))
    t["why"].extend(nasa["notes"][:1])
    t["evidence_note"] = "NASA POWER · chuva por satélite e reanálise × normal climatológica"
    return [t]


def rule_sementes(session: Session, farm: Farm, fields: list[Field], answers: dict) -> list[dict]:
    seeds = [fd.item_dict(i) for i in session.scalars(select(StockItem).where(
        StockItem.farm_id == farm.id, StockItem.category == "semente"))]
    topics = []
    for f in fields:
        if not f.crop or not f.seed_rate_kg_ha or _planted(session, f):
            continue
        ck = od.norm(f.crop.split(" ")[0])
        mine = [s for s in seeds if s["crop"] and od.norm(s["crop"]).startswith(ck) and s["unit"] == "kg"]
        if not mine:  # a conta não controla semente desta cultura: não dá para afirmar falta
            continue
        have = sum(max(0.0, s["quantity"]) for s in mine)
        need = f.area_ha * f.seed_rate_kg_ha
        if have >= need:
            continue
        prices = [s["avg_price"] for s in mine if s["avg_price"]]
        crop = f.crop.split(" ")[0]
        text = tx.semente_insuficiente(f.name, crop, f.area_ha, f.seed_rate_kg_ha, need, have,
                                       max(prices) if prices else None, answers.get("credit") or [])
        evidence = {"type": "seeds", "area_ha": round(f.area_ha, 2), "rate_kg_ha": f.seed_rate_kg_ha,
                    "needed_kg": round(need, 1), "have_kg": round(have, 1), "missing_kg": round(need - have, 1),
                    "items": [{"name": s["name"], "kg": s["quantity"]} for s in mine]}
        t = _topic(f"semente:{f.id}:{ctx.crop_key(f.crop) or ck}", "semente_insuficiente", "atencao", text,
                   [ACCOUNT_SRC], f, evidence)
        t["evidence_note"] = f"Área desenhada ({tx.br(f.area_ha, 2)} ha) × taxa informada ({tx.br(f.seed_rate_kg_ha)} kg/ha) × seu estoque"
        topics.append(t)
    return topics


def rule_defensivos(session: Session, farm: Farm, fields: list[Field]) -> list[dict]:
    today = fd.today()
    crops = [f.crop for f in fields if f.crop]
    topics = []
    for item in session.scalars(select(StockItem).where(StockItem.farm_id == farm.id, StockItem.category == "defensivo")):
        d = fd.item_dict(item)
        if not item.expiry_date or d["quantity"] <= 0 or d["days_to_expiry"] > EXPIRY_DAYS:
            continue
        if item.agrofit_registration:
            reg = od.agrofit_registration(item.agrofit_registration, crops)
        else:
            chk = od.agrofit_check(item.name.split(" (")[0])
            reg = od.agrofit_registration(chk["registration"], crops) if chk.get("found") else {"found": False}
        match = (reg.get("matches") or [None])[0]
        field = next((f for f in fields if match and f.crop == match["crop"]), None)
        days = d["days_to_expiry"]
        text = tx.defensivo(item.name, d["quantity"], item.unit, item.expiry_date, days, reg,
                            field.name if field else None, match["crop"] if match else None, match["pests"] if match else None)
        priority = "agir" if days < 0 else ("info" if field else "atencao")
        evidence = {"type": "agrofit", "item": item.name, "quantity": d["quantity"], "unit": item.unit,
                    "expiry_date": item.expiry_date.isoformat(), "days_to_expiry": days,
                    "registration": reg.get("registration"), "found": reg.get("found", False),
                    "brand": reg.get("brand"), "ingredient": reg.get("ingredient"), "product_class": reg.get("product_class"),
                    "tox_class": reg.get("tox_class"), "registered_crops": reg.get("crops", [])[:12],
                    "matches": reg.get("matches", [])}
        t = _topic(f"defensivo:{item.id}", "defensivo_registro", priority, text, [_src("agrofit"), ACCOUNT_SRC], field, evidence)
        t["evidence_note"] = f"Agrofit · MAPA · registro {reg.get('registration') or '—'}"
        topics.append(t)
    return topics


SLOPE_WORDS = ("declive", "inclin", "morro", "encosta", "ladeira")


def rule_drone(session: Session, farm: Farm, fields: list[Field], answers: dict) -> list[dict]:
    reg = od.region(farm.geocode)
    if not reg.get("available") or not reg.get("drones"):
        return []
    machines = answers.get("machines") or []
    if "drone" in machines:
        return []
    slope = next((f for f in fields if any(w in od.norm(f.notes or "") for w in SLOPE_WORDS)), None)
    if slope:
        reason = f"você anotou declive no {slope.name}"
    elif "nenhum" in machines:
        reason = "você não tem máquinas próprias"
    elif machines and "pulverizador" not in machines:
        reason = "você não tem pulverizador próprio"
    else:
        return []
    text = tx.servico_drone(farm.municipality, reg["drones"], farm.uf, reg["uf_drones"] or 0,
                            reg["br_municipalities_with_drones"], reg["br_municipalities"], slope.name if slope else None, reason)
    evidence = {"type": "drones", "municipality": farm.municipality, "drones": reg["drones"], "planes": reg.get("planes"),
                "uf": farm.uf, "uf_drones": reg["uf_drones"], "br_drones": reg["br_drones"],
                "br_municipalities_with_drones": reg["br_municipalities_with_drones"],
                "br_municipalities": reg["br_municipalities"], "notes": reg["notes"][:1]}
    t = _topic(f"drone:{farm.geocode}", "servico_drone", "oportunidade", text,
               [_src("sipeagro_aviacao"), ACCOUNT_SRC], slope, evidence)
    t["evidence_note"] = "SIPEAGRO · MAPA · agregado por município (sem dado pessoal)"
    return [t]


# ---------------- montagem ----------------
def compute(session: Session, producer_id: int) -> dict:
    now = datetime.now().strftime("%Y-%m-%dT%H:%M")
    farm = fd.find_farm(session)
    if farm is None:
        return {"topics": [], "sources_status": {}, "generated_at": now, "farm": None}
    fields = session.scalars(select(Field).where(Field.farm_id == farm.id).order_by(Field.id)).all()
    interview = session.get(Interview, producer_id)
    answers = interview.answers if interview else {}
    ext = _external(producer_id, farm)
    w, nasa = ext["weather"], ext["nasa"]
    status = {"clima": w.get("status", "offline") if w.get("available") else "offline",
              "nasa": nasa.get("status", "offline") if nasa.get("available") else "offline"}
    topics: list[dict] = []
    rules = [("dados_abertos", lambda: rule_zarc(session, farm, fields)),
             ("clima", lambda: rule_chuva_forte(session, farm, fields, w)),
             ("nasa", lambda: rule_chuva_vs_normal(session, farm, fields, nasa)),
             ("conta", lambda: rule_sementes(session, farm, fields, answers)),
             ("dados_abertos", lambda: rule_defensivos(session, farm, fields)),
             ("dados_abertos", lambda: rule_drone(session, farm, fields, answers))]
    status["dados_abertos"] = "local"
    for name, rule in rules:
        try:
            topics.extend(rule())
        except Exception:  # noqa: BLE001 — uma fonte quebrada não derruba os outros assuntos
            status[name] = "offline"
    choices = {s.topic_key: s.choice for s in session.scalars(select(TopicState).where(TopicState.producer_id == producer_id))}
    for t in topics:
        t["choice"] = choices.get(t["key"])
    topics.sort(key=lambda t: tx.PRIORITY_ORDER[t["priority"]])
    return {"topics": topics, "sources_status": status, "generated_at": now,
            "farm": {"id": farm.id, "municipality": farm.municipality, "uf": farm.uf, "geocode": farm.geocode,
                     "is_demo": farm.producer.is_demo}}
