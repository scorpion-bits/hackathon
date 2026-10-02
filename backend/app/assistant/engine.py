"""Orquestrador do assistente.

Modo LLM: qualquer API compatível com OpenAI (Groq, Gemini, OpenRouter, Ollama Cloud…), com tool calling.
  AGROBITS_LLM_BASE_URL, AGROBITS_LLM_API_KEY, AGROBITS_LLM_MODEL (AGROIA_LLM_* continuam valendo)
Modo offline (plano B, D-004): roteamento por palavras-chave → ferramentas → resposta em modelo de texto.
Em ambos, números vêm SOMENTE das ferramentas; a resposta traz as fontes usadas.
"""
from __future__ import annotations

import json
import os
import re
from datetime import date, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Field, StockItem
from ..services import farmdata as fd
from ..services import opendata as od
from .tools import openai_tools, run_tool

SYSTEM_PROMPT = """Você é a IA do AgroBits, que ajuda pequenos produtores a entender dados abertos oficiais sobre a propriedade deles.
Hoje é {today}. Propriedade: {farm} ({municipality}). Safra atual: {season}.

REGRAS:
- Você EXPLICA dados; NÃO decide pelo produtor. Para decidir (plantar, adubar, aplicar), diga: "Leve para um técnico — de graça"
  (assistência técnica pública, tela Resolver / Meus casos).
- Nunca indique produto nem dose de agrotóxico ou adubo, nem diagnostique praga/doença: exige receituário agronômico (Lei 7.802/89).
  Pode dizer se um produto tem registro no Agrofit para a cultura.
- Use as ferramentas para obter QUALQUER número (clima, Zarc, estoque, assuntos). Nunca invente números.
- Cite a fonte e a data de cada dado. Diga quando é PREVISÃO e quando é ESTIMATIVA. Se uma fonte estiver fora, avise.
- Se faltar informação, diga o que falta. Linguagem simples, frases curtas, português do Brasil; comece pela resposta direta.
- Zarc: 20/30/40 = risco de perda por clima (%); 0 = fora da janela indicada.
{context}"""

MAX_STEPS = 6


def _env(name: str, default: str | None = None) -> str | None:
    """Lê AGROBITS_LLM_<name>; aceita AGROIA_LLM_<name> por compatibilidade."""
    return os.environ.get(f"AGROBITS_LLM_{name}") or os.environ.get(f"AGROIA_LLM_{name}") or default


def llm_model() -> str | None:
    return _env("MODEL") if _env("API_KEY") else None


def llm_enabled() -> bool:
    return bool(_env("API_KEY") and _env("MODEL"))


def _dedupe(sources: list[dict]) -> list[dict]:
    seen, out = set(), []
    for s in sources:
        k = s.get("key") or s.get("name")
        if k and k not in seen:
            seen.add(k)
            out.append(s)
    return out


def _context_text(context: dict | None) -> str:
    if not context:
        return ""
    return "\nCONTEXTO DA TELA (o produtor clicou em 'Perguntar à IA' a partir daqui): " + json.dumps(context, ensure_ascii=False)


def chat(session: Session, message: str, history: list[dict], context: dict | None = None) -> dict:
    draft = draft_from_text(session, message)
    if llm_enabled():
        try:
            out = _chat_llm(session, message, history, context)
            out["draft"] = draft
            return out
        except Exception as exc:  # noqa: BLE001 — cai para o modo offline
            out = _chat_offline(session, message, context)
            out["warning"] = f"Modelo de IA indisponível ({type(exc).__name__}); resposta no modo offline."
            out["draft"] = draft
            return out
    if draft:
        return {"answer": _draft_text(draft), "sources": [], "tools": [], "mode": "offline", "draft": draft}
    out = _chat_offline(session, message, context)
    out["draft"] = None
    return out


def _draft_text(d: dict) -> str:
    kinds = {"plantio": "um plantio", "aplicacao": "uma aplicação", "colheita": "uma colheita", "compra": "uma compra"}
    parts = [f"Entendi que você quer registrar {kinds[d['kind']]}"]
    if d.get("field_name"):
        parts.append(f"no {d['field_name']}")
    if d.get("quantity") and d.get("item_name"):
        parts.append(f"usando {d['quantity']:g} {d['unit']} de {d['item_name']}")
    text = " ".join(parts) + f" em {date.fromisoformat(d['date']).strftime('%d/%m/%Y')}. Confira os dados abaixo e confirme."
    if d["missing"]:
        text += " Falta informar: " + ", ".join(d["missing"]) + "."
    return text


# ------------------------------------------------------------------ LLM
def _chat_llm(session: Session, message: str, history: list[dict], context: dict | None) -> dict:
    farm = fd.get_farm(session)
    season = fd.current_season(session, farm.id)
    system = SYSTEM_PROMPT.format(today=fd.today().strftime("%d/%m/%Y"), farm=farm.name,
                                  municipality=f"{farm.municipality}/{farm.uf}", season=season.name if season else "-",
                                  context=_context_text(context))
    messages = [{"role": "system", "content": system}] + history[-8:] + [{"role": "user", "content": message}]
    base = _env("BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
    headers = {"Authorization": f"Bearer {_env('API_KEY')}"}
    sources, used = [], []
    for _ in range(MAX_STEPS):
        r = httpx.post(f"{base}/chat/completions", headers=headers, timeout=60, json={
            "model": _env("MODEL"), "messages": messages, "tools": openai_tools(),
            "tool_choice": "auto", "temperature": 0.2})
        r.raise_for_status()
        msg = r.json()["choices"][0]["message"]
        calls = msg.get("tool_calls") or []
        if not calls:
            return {"answer": msg.get("content") or "", "sources": _dedupe(sources), "tools": used, "mode": "llm"}
        messages.append({"role": "assistant", "content": msg.get("content") or "", "tool_calls": calls})
        for call in calls:
            name = call["function"]["name"]
            args = json.loads(call["function"].get("arguments") or "{}")
            result, srcs = run_tool(session, name, args)
            used.append(name)
            sources += srcs
            messages.append({"role": "tool", "tool_call_id": call["id"],
                             "content": json.dumps(result, ensure_ascii=False, default=str)[:12000]})
    return {"answer": "Não consegui concluir a análise. Pode reformular a pergunta?", "sources": _dedupe(sources),
            "tools": used, "mode": "llm"}


# ------------------------------------------------------------------ offline
def _find_field(session: Session, text: str, context: dict | None) -> str | None:
    m = re.search(r"talh[aã]o\s*(\d+)", text, re.I)
    if m:
        return m.group(1)
    if context and context.get("field"):
        return str(context["field"])
    if context and context.get("field_ids"):
        f = session.get(Field, context["field_ids"][0])
        return f.name if f else None
    return None


def _brl(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _chat_offline(session: Session, message: str, context: dict | None) -> dict:
    t = od.norm(message)
    field = _find_field(session, message, context)
    lines: list[str] = []
    sources: list[dict] = []
    used: list[str] = []

    def call(name, **args):
        res, srcs = run_tool(session, name, args)
        used.append(name)
        sources.extend(srcs)
        return res

    if any(w in t for w in ("o que e o zarc", "que e zarc", "o que e zarc", "zoneamento")) and "talhao" not in t:
        lines.append("O Zarc (Zoneamento Agrícola de Risco Climático, do MAPA) diz, para cada município, solo e cultura, em quais períodos "
                     "de 10 dias o plantio tem menor risco de perda por clima: 20%, 30% ou 40%. Fora da janela, o risco é maior e "
                     "você pode perder o acesso ao Proagro e à subvenção do seguro. É um risco histórico, não uma garantia.")
        call("farm_overview")
        sources.append(od.source("zarc"))
    elif any(w in t for w in ("fungicida", "defensivo", "agrotoxic", "veneno", "dose", "pulveriz", "adubo", "produto")) \
            and any(w in t for w in ("posso", "usar", "qual", "quanto", "dose", "aplicar")):
        lines.append("Não indico produto nem dose: isso exige receituário de um engenheiro agrônomo (Lei 7.802/89). "
                     "Leve para um técnico — de graça — pela tela Resolver / Meus casos.")
        reg = call("get_topics")
        d = [x for x in reg["topics"] if "defensivo" in x["key"] or "agrofit" in x["key"]]
        if d:
            lines.append("O que os dados abertos mostram: " + "; ".join(x["summary"] for x in d[:2]))
    elif any(w in t for w in ("o que eu faco", "o que fazer", "o que faco", "tecnico", "ajuda", "decidir", "enviar caso")):
        top = call("get_topics")["topics"]
        lines.append("Eu explico os dados; quem ajuda a decidir é o técnico da assistência pública, de graça. "
                     "Abra o assunto em Resolver e envie o caso: ele já vai com os dados e as fontes.")
        lines += [f"• ({x['priority']}) {x['title']}" for x in top[:3]]
    elif any(w in t for w in ("plant", "semear", "janela", "zarc", "risco")) and field:
        p = call("plan_planting", field=field)
        lines.append(p.get("recommendation") or "Sem dados de zoneamento para este talhão.")
        if p.get("options"):
            lines.append("Próximos períodos (Zarc): " + "; ".join(f"{o['label']}: {o['risk'] or 'fora'}{'%' if o['risk'] else ''}"
                                                                for o in p["options"][:6]))
    elif any(w in t for w in ("gast", "custo", "despes", "quanto paguei")):
        c = call("get_costs")
        cat = next((k for k in ("fertilizante", "defensivo", "semente", "combustivel") if k[:6] in t), None)
        if cat:
            lines.append(f"Safra {c['season']} — {cat}: comprado {_brl(c['purchased_by_category'].get(cat, 0))}; "
                         f"aplicado nas lavouras {_brl(c['applied_by_category'].get(cat, 0))}.")
        lines.append(f"Total da safra {c['season']}: comprado {_brl(c['purchased_total'])}; aplicado {_brl(c['applied_total'])}.")
        if c["applied_by_field"]:
            lines.append("Aplicado por talhão: " + "; ".join(f"{k}: {_brl(v)}" for k, v in c["applied_by_field"].items()))
        lines.append(c["method"])
    elif field and any(w in t for w in ("como esta", "situacao", "talhao")):
        f = call("get_field", field=field)
        if "error" in f:
            lines.append(f["error"])
        else:
            lines.append(f"{f['name']} ({f['area_ha']:g} ha, {f['crop'] or 'sem cultura'}): {f['status']['label']}.")
            for e in f["timeline"][:4]:
                lines.append(f"• {date.fromisoformat(e['date']).strftime('%d/%m/%Y')} — {e['title']}")
            if f.get("zarc_today"):
                lines.append(f"Zarc hoje ({f['zarc_today']['decendio']}): {f['zarc_today']['risk']}.")
            w = call("get_weather")
            if w.get("next_7_days"):
                lines.append(f"Chuva prevista nos próximos 7 dias: {w['rain_next_7d_mm']:.0f} mm.")
    elif any(w in t for w in ("estoque", "venc", "validade", "acabando", "falta", "tenho")):
        s = call("get_stock")["items"]
        low = [i for i in s if i["low_stock"]]
        exp = [i for i in s if i["days_to_expiry"] is not None and i["days_to_expiry"] <= 30 and i["quantity"] > 0]
        lines.append(f"Você tem {len(s)} itens cadastrados.")
        if low:
            lines.append("Estoque baixo: " + "; ".join(f"{i['name']} ({i['quantity']:g} {i['unit']})" for i in low))
        if exp:
            lines.append("Perto do vencimento: " + "; ".join(f"{i['name']} (vence em {i['days_to_expiry']} dias)" for i in exp))
    elif any(w in t for w in ("seco", "seca", "normal", "choveu", "ultimos dias", "últimos dias")):
        r = call("rain_history")
        if not r.get("period"):
            lines.append(r.get("error", "Histórico de chuva indisponível no momento."))
        else:
            p = r["period"]
            lines.append(f"De {p['start']} a {p['end']} choveu {r['observed_mm']:.0f} mm na sua região; o normal para o período "
                         f"é {r['normal_mm']:.0f} mm — {r['label']}.")
            lines.append(r["notes"][0])
    elif any(w in t for w in ("chuva", "tempo", "clima", "previs", "geada")):
        w = call("get_weather")
        if not w.get("next_7_days"):
            lines.append(w.get("error", "Previsão indisponível no momento."))
        else:
            lines.append(f"Chuva prevista nos próximos 7 dias: {w['rain_next_7d_mm']:.0f} mm.")
            for d in w["next_7_days"]:
                lines.append(f"• {date.fromisoformat(d['date']).strftime('%d/%m')}: {d['summary']}, {d['tmin']:.0f}–{d['tmax']:.0f} °C, {d['rain_mm']:.0f} mm")
    elif any(w in t for w in ("drone", "regiao", "municipio", "seguro")):
        r = call("region_stats")
        lines.append(f"{r['municipality']}/{r['uf']}: {int(r['drones'])} drones agrícolas registrados no MAPA "
                     f"({int(r['uf_drones'])} no estado).")
        if r.get("insurance_policies"):
            lines.append(f"Seguro rural com subvenção federal (2025): {int(r['insurance_policies'])} apólices.")
        lines += r["notes"]
    elif any(w in t for w in ("alerta", "aviso", "atencao")):
        a = call("get_alerts")["alerts"]
        lines += [f"• {x['title']} — {x['why']}" for x in a] or ["Nenhum alerta ativo."]
    else:
        o = call("farm_overview")
        lines.append(f"{o['farm']} ({o['municipality']}), safra {o['season']}:")
        lines += [f"• {f['name']}: {f['area_ha']:g} ha — {f['status']}" for f in o["fields"]]
        top = call("get_topics")["topics"]
        lines += [f"• Assunto: {x['title']}" for x in top[:3]]
        lines.append("Posso ajudar com: plantio (Zarc + clima + sementes), chuva, estoque e dados da região. Para decidir, leve ao técnico.")
    return {"answer": "\n".join(lines), "sources": _dedupe(sources), "tools": used, "mode": "offline"}


# ------------------------------------------------------------------ registro por conversa
UNIT_WORDS = {"kg": "kg", "quilo": "kg", "quilos": "kg", "litro": "L", "litros": "L", "l": "L", "saco": "saco", "sacos": "saco"}


def _match_item(items: list[StockItem], text: str) -> StockItem | None:
    """Item do estoque cujo nome mais combina com o texto; empate → o que tem saldo."""
    best, score = None, (0, False)
    for it in items:
        words = [w for w in re.findall(r"\w+", od.norm(it.name)) if len(w) > 3]
        s = (sum(1 for w in words if w in text), fd.item_balance(it) > 0)
        if s[0] and s > score:
            best, score = it, s
    return best


def draft_from_text(session: Session, message: str) -> dict | None:
    """Converte frases como 'plantei milho no talhão 2 hoje usando 60 kg de semente' em um RASCUNHO de registro.
    Nada é gravado: a interface mostra o formulário pré-preenchido para o produtor confirmar."""
    t = od.norm(message)
    kind = ("plantio" if re.search(r"\bplantei|semeei\b", t) else
            "aplicacao" if re.search(r"\b(apliquei|passei|pulverizei|joguei)\b", t) else
            "colheita" if re.search(r"\bcolhi\b", t) else
            "compra" if re.search(r"\bcomprei\b", t) else None)
    if not kind:
        return None
    farm = fd.get_farm(session)
    d = fd.today()
    if "ontem" in t:
        d -= timedelta(days=1)
    m = re.search(r"dia (\d{1,2})(?:/(\d{1,2}))?", t)
    if m:
        d = date(d.year, int(m.group(2) or d.month), int(m.group(1)))
    fm = re.search(r"talhao\s*(\d+)", t)
    field = session.scalars(select(Field).where(Field.farm_id == farm.id, Field.name.like(f"%{fm.group(1)}"))).first() if fm else None
    items = session.scalars(select(StockItem).where(StockItem.farm_id == farm.id)).all()
    qm = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|quilos?|litros?|l|sacos?)\b", t)
    qty = float(qm.group(1).replace(",", ".")) if qm else None
    unit = UNIT_WORDS.get(qm.group(2)) if qm else None
    item = _match_item(items, t)
    if kind == "plantio" and item is None:
        crop_key = next((c for c in ("milho", "soja", "feijao", "amendoim", "sorgo") if c in t), None)
        item = next((i for i in items if i.category == "semente" and crop_key and od.norm(i.crop or "").startswith(crop_key)
                     and fd.item_balance(i) > 0), None)
    price = None
    pm = re.search(r"r\$\s*([\d.]+(?:,\d+)?)", message.lower())
    if pm:
        price = float(pm.group(1).replace(".", "").replace(",", "."))
    draft = {"kind": kind, "date": d.isoformat(), "field_id": field.id if field else None,
             "field_name": field.name if field else None, "item_id": item.id if item else None,
             "item_name": item.name if item else None, "quantity": qty, "unit": unit or (item.unit if item else None),
             "total_price": price, "crop": None, "missing": []}
    if kind == "plantio":
        draft["crop"] = next((c for c in od.zarc_crops(farm.geocode) if od.norm(c).split()[0] in t), field.crop if field else None)
    if kind in ("plantio", "aplicacao", "colheita") and not field:
        draft["missing"].append("talhão")
    if kind in ("aplicacao", "compra") and not item:
        draft["missing"].append("produto do estoque")
    if unit == "saco" and item and item.unit != "saco":
        draft["missing"].append(f"peso do saco (estoque de {item.name} é em {item.unit})")
    return draft
