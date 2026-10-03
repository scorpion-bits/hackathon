"""Ferramentas determinísticas que a IA pode chamar. Cada uma devolve dados + fonte (cartão de fontes)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Event, Field, ProfileFact, StockItem
from ..services import farmdata as fd
from ..services import opendata as od
from ..services import live
from ..services.insights import compute_alerts, plan_planting
from ..services.weather import forecast

SYSTEM_SOURCE = {"key": "agroia", "name": "Registros da propriedade (AgroBits)", "agency": "declarado pelo produtor"}


def _field_by_name(session: Session, farm_id: int, name_or_id) -> Field | None:
    fields = session.scalars(select(Field).where(Field.farm_id == farm_id)).all()
    key = str(name_or_id).lower().replace("talhão", "").replace("talhao", "").strip()
    for f in fields:
        if str(f.id) == key or f.name.lower() == str(name_or_id).lower() or f.name.lower().endswith(" " + key):
            return f
    return None


def _crop(farm, field: Field, crop: str | None) -> str | None:
    """Cultura no nome oficial do Zarc: o modelo costuma mandar 'milho', o Zarc guarda 'Milho 1ª Safra'."""
    if not crop:
        return field.crop
    from ..services.context import crop_key, zarc_name
    key = crop_key(crop)
    if key and key == crop_key(field.crop):
        return field.crop
    return zarc_name(key, farm.geocode) if key and key != "outra" else crop


def farm_overview(session: Session, **_):
    farm = fd.get_farm(session)
    season = fd.current_season(session, farm.id)
    fields = [fd.field_dict(session, f) for f in session.scalars(select(Field).where(Field.farm_id == farm.id))]
    facts = session.scalars(select(ProfileFact).where(ProfileFact.producer_id == farm.producer_id)).all()
    return {
        "farm": farm.name, "municipality": f"{farm.municipality}/{farm.uf}", "season": season.name if season else None,
        "today": fd.today().isoformat(),
        "fields": [{"name": f["name"], "area_ha": f["area_ha"], "crop": f["crop"], "soil": f["soil"],
                    "irrigated": f["irrigated"], "status": f["status"]["label"]} for f in fields],
        "profile": {p.label: p.value for p in facts},
    }, [SYSTEM_SOURCE]


def get_field(session: Session, field: str, **_):
    farm = fd.get_farm(session)
    f = _field_by_name(session, farm.id, field)
    if not f:
        return {"error": f"Talhão '{field}' não encontrado."}, []
    d = fd.field_dict(session, f)
    d.pop("geometry")
    events = session.scalars(select(Event).where(Event.field_id == f.id).order_by(Event.date.desc()).limit(8)).all()
    d["timeline"] = [{"date": e.date.isoformat(), "type": e.type, "title": e.title, "details": e.details,
                      "inputs": [f"{m.quantity:g} {m.item.unit} {m.item.name}" for m in e.movements]} for e in events]
    # risco de HOJE vale para a cultura que está no talhão (se plantado) ou para a PLANEJADA — nunca a da safra já colhida
    crop = (d["status"]["crop"] if d["status"]["stage"] == "plantado" else None) or f.crop
    z = od.zarc_for(farm.geocode, crop, f.soil, f.irrigated)
    if z.get("available"):
        dec = od.decendio(fd.today())
        d["zarc_today"] = {"crop": z["crop"], "risk": od.risk_text(z["risk"][dec - 1]), "decendio": od.decendio_label(dec),
                           "safra": z["safra"], "notes": z["notes"]}
    return d, [SYSTEM_SOURCE] + ([z["source"]] if z.get("available") else [])


def get_stock(session: Session, category: str | None = None, **_):
    farm = fd.get_farm(session)
    items = [fd.item_dict(i) for i in session.scalars(select(StockItem).where(StockItem.farm_id == farm.id))]
    if category:
        items = [i for i in items if i["category"] == category]
    return {"items": [{k: i[k] for k in ("name", "category", "quantity", "unit", "min_quantity", "expiry_date",
                                         "days_to_expiry", "low_stock", "avg_price", "crop")} for i in items]}, [SYSTEM_SOURCE]


def get_costs(session: Session, season: str | None = None, **_):
    farm = fd.get_farm(session)
    s = fd.current_season(session, farm.id)
    if season:
        from ..models import Season
        s = session.scalars(select(Season).where(Season.farm_id == farm.id, Season.name == season)).first() or s
    return fd.costs_report(session, farm, s), [SYSTEM_SOURCE]


def get_zarc(session: Session, field: str, crop: str | None = None, **_):
    farm = fd.get_farm(session)
    f = _field_by_name(session, farm.id, field)
    if not f:
        return {"error": f"Talhão '{field}' não encontrado."}, []
    z = od.zarc_for(farm.geocode, _crop(farm, f, crop), f.soil, f.irrigated)
    if not z.get("available"):
        return z, []
    dec = od.decendio(fd.today())
    upcoming = [{"periodo": od.decendio_label(((dec - 1 + i) % 36) + 1), "risco": od.risk_text(z["risk"][(dec - 1 + i) % 36])}
                for i in range(9)]
    return {"field": f.name, "crop": z["crop"], "safra": z["safra"], "solo": z["soil_label"],
            "solo_estimado": z["soil_estimated"], "ciclo": z["cycle_label"], "manejo": z["management"],
            "portaria": z["ordinance"], "proximos_periodos": upcoming, "notas": z["notes"]}, [z["source"]]


def get_weather(session: Session, **_):
    farm = fd.get_farm(session)
    w = forecast(farm.lat, farm.lon)
    if not w.get("available"):
        return w, []
    return {"status": w["status"], "current": w["current"], "next_7_days": w["daily"][:7],
            "rain_next_7d_mm": w["rain_next_7d_mm"]}, [w["source"]]


def rain_history(session: Session, **_):
    farm = fd.get_farm(session)
    r = live.rain_vs_normal(farm.lat, farm.lon)
    if not r.get("available"):
        return r, []
    r = {k: v for k, v in r.items() if k != "daily"}
    return r, [r.pop("source")]


def plan(session: Session, field: str, crop: str | None = None, **_):
    farm = fd.get_farm(session)
    f = _field_by_name(session, farm.id, field)
    if not f:
        return {"error": f"Talhão '{field}' não encontrado."}, []
    p = plan_planting(session, farm, f, _crop(farm, f, crop))
    srcs = [SYSTEM_SOURCE] + ([p["zarc"]["source"]] if p["zarc"].get("available") else [])
    if p.get("weather_status") and p["weather_status"] != "offline":
        srcs.append(od.source("open_meteo"))
    p.pop("zarc", None)
    return p, srcs


def check_agrofit(session: Session, product: str, crop: str | None = None, **_):
    r = od.agrofit_check(product, crop)
    return r, [r["source"]]


def region_stats(session: Session, **_):
    farm = fd.get_farm(session)
    r = od.region(farm.geocode)
    return r, r.get("sources", [])


def get_alerts(session: Session, **_):
    farm = fd.get_farm(session)
    return {"alerts": [{k: a[k] for k in ("title", "why", "severity", "kind")} for a in compute_alerts(session, farm)]}, [SYSTEM_SOURCE]


def _topics(session: Session):
    from ..services import topics as tp
    farm = fd.get_farm(session)
    return tp.compute(session, farm.producer_id)


def get_topics(session: Session, **_):
    data = _topics(session)
    srcs = {s["key"]: s for t in data["topics"] for s in t["sources"]}
    return {"topics": [{"key": t["key"], "priority": t["priority"], "title": t["title"], "summary": t["summary"],
                        "field": t["field"], "choice": t["choice"]} for t in data["topics"]],
            "sources_status": data["sources_status"]}, list(srcs.values())


def explain_topic(session: Session, key: str, **_):
    t = next((x for x in _topics(session)["topics"] if x["key"] == key), None)
    if t is None:
        return {"error": f"Assunto '{key}' não existe (use get_topics para ver as chaves)."}, []
    ev = {k: v for k, v in t["evidence"].items() if k not in ("series", "labels", "days")}
    return {"title": t["title"], "summary": t["summary"], "why": t["why"], "evidence": ev,
            "paths": [{"title": p["title"], "detail": p["detail"]} for p in t["paths"]],
            "next_step": "Levar o caso a um técnico da assistência técnica pública (de graça) em 'Resolver'."}, t["sources"]


TOOLS = {
    "get_topics": (get_topics, "Assuntos que merecem atenção agora (janela de plantio, chuva forte, semente, defensivo, drone), com prioridade.", {}),
    "explain_topic": (explain_topic, "Explica um assunto (chave vinda de get_topics): por quê, dados e caminhos possíveis, com fontes.",
                      {"key": {"type": "string"}}),
    "farm_overview": (farm_overview, "Visão geral: propriedade, talhões (cultura, solo, situação), safra atual e perfil do produtor.", {}),
    "get_field": (get_field, "Detalhes de um talhão: situação, linha do tempo (plantios, aplicações, colheitas) e risco Zarc de hoje.",
                  {"field": {"type": "string", "description": "Nome ou número do talhão, ex.: 'Talhão 2' ou '2'"}}),
    "get_stock": (get_stock, "Itens do estoque com quantidade, validade e alertas.",
                  {"category": {"type": "string", "enum": ["semente", "fertilizante", "defensivo", "combustivel", "ferramenta", "irrigacao", "outro"]}}),
    "get_costs": (get_costs, "Custos da safra: comprado e aplicado por categoria e por talhão, consumo de insumos e colheitas.",
                  {"season": {"type": "string", "description": "Ex.: '2026/27' ou '2025/26'"}}),
    "get_zarc": (get_zarc, "Risco climático oficial (Zarc/MAPA) do talhão para os próximos períodos de 10 dias.",
                 {"field": {"type": "string"}, "crop": {"type": "string", "description": "Opcional: cultura diferente da cadastrada"}}),
    "get_weather": (get_weather, "Previsão do tempo para a propriedade (atual + próximos dias).", {}),
    "rain_history": (rain_history, "Chuva observada nos últimos 30 dias (NASA POWER) comparada com a normal do lugar: está mais seco ou mais chuvoso que o normal?", {}),
    "plan_planting": (plan, "Planejador de plantio: melhor janela (Zarc + previsão de chuva) e se há sementes suficientes no estoque.",
                      {"field": {"type": "string"}, "crop": {"type": "string"}}),
    "check_agrofit": (check_agrofit, "Consulta o registro de um defensivo no Agrofit/MAPA (cultura, classe toxicológica e ambiental).",
                      {"product": {"type": "string"}, "crop": {"type": "string"}}),
    "region_stats": (region_stats, "Dados abertos do município: drones/aviões agrícolas registrados, seguro rural, culturas zoneadas.", {}),
    "get_alerts": (get_alerts, "Alertas ativos da propriedade (estoque, validade, Zarc, clima).", {}),
}
REQUIRED = {"explain_topic": ["key"], "get_field": ["field"], "get_zarc": ["field"], "plan_planting": ["field"], "check_agrofit": ["product"]}


def openai_tools() -> list[dict]:
    return [{"type": "function", "function": {
        "name": name, "description": desc,
        "parameters": {"type": "object", "properties": props, "required": REQUIRED.get(name, [])}}}
        for name, (_, desc, props) in TOOLS.items()]


def run_tool(session: Session, name: str, args: dict):
    fn = TOOLS[name][0]
    try:
        return fn(session, **args)
    except Exception as exc:  # noqa: BLE001 — a IA deve receber o erro, não quebrar a conversa
        return {"error": f"{type(exc).__name__}: {exc}"}, []
