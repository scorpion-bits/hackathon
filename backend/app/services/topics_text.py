"""Textos dos assuntos (M3): modelos de frase preenchidos com os números das fontes. Sem IA.

Regras de redação (D-008/D-015): informação, nunca receita — nada de produto novo nem dose.
Cada assunto tem um único caminho `recommended` = "o mais alinhado aos dados oficiais".
👥 Quem entende de campo: revise estes textos e aponte o que soa como receita.
"""
from __future__ import annotations

from datetime import date

PRIORITY_ORDER = {"agir": 0, "atencao": 1, "oportunidade": 2, "info": 3}


def br(x: float, nd: int = 1) -> str:
    """Número no jeito brasileiro: 3,1 · 62 · 1.346."""
    if abs(x - round(x)) < 1e-9 or nd == 0:
        return f"{round(x):,}".replace(",", ".")
    return f"{x:,.{nd}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def dm(d: date) -> str:
    return d.strftime("%d/%m")


def money(x: float) -> str:
    return "R$ " + f"{x:,.0f}".replace(",", ".")


def risk_phrase(r: int) -> str:
    return "fora da janela do Zarc" if r == 0 else f"risco de {r}%"


FEMININE = ("soja", "mandioca", "cana", "laranja", "aveia", "cevada", "mamona")


def plant_question(crop: str, field: str) -> str:
    """"Quando plantar a soja do Talhão 1?" — artigo pela cultura; tira o "1ª Safra" do nome do Zarc."""
    name = crop.lower().split(" 1ª")[0].split(" 2ª")[0]
    return f"Quando plantar {'a' if name.startswith(FEMININE) else 'o'} {name} do {field}?"


def path(pid: str, title: str, detail: str, pros=(), cons=(), then=(), recommended: bool = False) -> dict:
    p = {"id": pid, "title": title, "detail": detail, "pros": list(pros), "cons": list(cons), "then": list(then)}
    if recommended:
        p["recommended"] = True
    return p


ZARC_RULE = "Plantar fora da janela do Zarc pode tirar o acesso ao Proagro e à subvenção do seguro rural."


# ---------------- Zarc ----------------
def janela_plantio(field: str, crop: str, now_label: str, now_risk: int, start: date, end: date, best: int,
                   wait_days: int, steps: list[tuple[str, int]], alt: tuple[str, int] | None) -> dict:
    if now_risk == 0:
        title = f"{crop} no {field}: a janela do Zarc abre em {dm(start)}"
        summary = f"Hoje ({now_label}) está fora da janela indicada. A partir de {dm(start)}, o risco é de {best}%."
    else:
        title = f"{crop} no {field}: espere até {dm(start)} para plantar"
        summary = f"Plantar agora tem risco de {now_risk}% de perda pelo clima. A partir de {dm(start)}, cai para {best}%."
    paths = [
        path("esperar", f"Plantar a partir de {dm(start)}",
             f"Esperar {wait_days} dias e plantar no período de menor risco indicado pelo Zarc (até {dm(end)}).",
             pros=[f"Risco vai de {risk_phrase(now_risk)} para {best}%", "Dentro da janela oficial: mantém Proagro e seguro com subvenção"],
             cons=["A colheita também fica mais tarde"],
             then=[f"Lembrete em {dm(start)}: começa o período de {best}% para o {field}",
                   "Se a previsão de chuva mudar, avisamos antes"], recommended=True),
        path("agora", f"Plantar agora ({now_label})", "Manter o plano de plantar já.",
             pros=["Colheita mais cedo"],
             cons=[f"Hoje: {risk_phrase(now_risk)}" + (f" — em até {now_risk} de cada 100 anos há perda pelo clima" if now_risk else ""),
                   "Fora da janela de menor risco: seguro tende a custar mais ou não cobrir"],
             then=["Acompanhamos a chuva a cada 3 dias e avisamos se piorar"]),
    ]
    if alt:
        acrop, arisk = alt
        paths.append(path("trocar", f"Avaliar {acrop} no {field}",
                          f"Para este município e solo, o Zarc indica {acrop} com risco de {arisk}% já agora.",
                          pros=[f"Pode plantar já, com risco de {arisk}%"],
                          cons=[f"Precisa de semente de {acrop}", "Muda o planejamento de rotação do talhão"],
                          then=[f"Mostramos o calendário de risco de {acrop} para o {field}"]))
    why = [f"Hoje ({now_label}): {risk_phrase(now_risk)}"]
    if steps:
        why.append("Próximos períodos: " + " → ".join(f"{lbl} {r}%" if r else f"{lbl} fora" for lbl, r in steps))
    why.append(ZARC_RULE)
    return {"title": title, "summary": summary, "question": plant_question(crop, field),
            "paths": paths, "why": why}


def janela_aberta(field: str, crop: str, now_label: str, risk: int, end: date) -> dict:
    return {
        "title": f"{crop} no {field} já está na janela de menor risco",
        "summary": f"Risco de {risk}% para plantar de hoje até {dm(end)}, o menor indicado pelo Zarc para este solo.",
        "question": plant_question(crop, field),
        "why": [f"Hoje ({now_label}) e até {dm(end)}: risco de {risk}%, o menor da tabela do Zarc para {crop} aqui", ZARC_RULE],
        "paths": [
            path("janela", f"Plantar entre hoje e {dm(end)}", "Aproveitar o período de menor risco que já começou.",
                 pros=[f"Risco de {risk}%", "Dentro da janela oficial do Zarc"],
                 then=[f"Lembrete 10 dias antes de {dm(end)}: fim da janela de {risk}%"], recommended=True),
            path("depois", f"Deixar para perto de {dm(end)}", "Mais tempo para preparar a área.",
                 pros=["Mais tempo de preparo"], cons=[f"Depois de {dm(end)} o risco muda ou sai da janela do Zarc"],
                 then=[f"Lembrete em {dm(end)}"]),
        ],
    }


# ---------------- clima ----------------
def chuva_forte(day: date, mm: float, dry_before: list[tuple[date, float]], after: tuple[date, float] | None,
                prepared: tuple[str, date] | None) -> dict:
    paths = []
    if dry_before:
        last = dry_before[-1][0]
        days_txt = ", ".join(f"{dm(d)} ({br(v)} mm)" for d, v in dry_before)
        paths.append(path("antes", f"Adiantar o trabalho de campo até {dm(last)}",
                          f"Dias com pouca chuva prevista antes do dia {dm(day)}: {days_txt}.",
                          pros=["O que for aplicado tem tempo de agir antes da chuva"], cons=["Precisa reorganizar a semana"],
                          then=[f"Lembrete em {dm(dry_before[0][0])}, 7h", "Aviso se a previsão desses dias mudar"]))
    after_txt = f" Previsão para {dm(after[0])}: {br(after[1])} mm." if after else ""
    paths.append(path("depois", f"Esperar passar a chuva de {dm(day)}",
                      f"Fazer aplicações só depois que o solo drenar.{after_txt}",
                      pros=["Sem risco de a chuva lavar o que foi aplicado"], cons=["Atrasa o trabalho alguns dias"],
                      then=["Lembrete no primeiro dia seco depois da chuva"]))
    if prepared:
        fname, pdate = prepared
        paths.append(path("proteger", f"Proteger o solo exposto do {fname}",
                          f"O {fname} teve preparo de solo em {dm(pdate)}: com {br(mm)} mm em um dia, há risco de erosão.",
                          pros=["Reduz perda de solo e de adubo"], cons=["Mão de obra extra nesta semana"],
                          then=[f"Tarefa criada: cobertura do {fname} antes de {dm(day)}"]))
    paths[0]["recommended"] = True
    why = [f"Previsão para a sua propriedade: {br(mm)} mm em {dm(day)}"]
    if prepared:
        why.append(f"{prepared[0]} com preparo de solo em {dm(prepared[1])} — solo exposto")
    return {"title": f"Chuva forte prevista para {dm(day)} (≈{br(mm, 0)} mm)",
            "summary": "Evite aplicar produtos na véspera. Solo recém-preparado pode ter erosão.",
            "question": f"Como se preparar para a chuva de {dm(day)}?", "why": why, "paths": paths}


def chuva_vs_normal(observed: float, normal: float, ratio: float, start: str, end: str, days: int,
                    irrigated_field: str | None) -> dict:
    pct = round(ratio * 100)
    base = f"De {start} a {end} ({days} dias) choveu {br(observed)} mm; o normal para o período é {br(normal)} mm ({pct}%)."
    if ratio < 1:
        paths = [path("solo_umido", "Plantar só com o solo úmido",
                      "Esperar uma chuva que molhe bem o solo antes de semear.",
                      pros=["Semente não fica parada em solo seco"], cons=["Pode atrasar o plantio"],
                      then=["Avisamos quando a previsão indicar chuva boa"], recommended=True)]
        if irrigated_field:
            paths.append(path("irrigar", f"Priorizar a irrigação no {irrigated_field}",
                              "Você declarou irrigação neste talhão.", pros=["Compensa a falta de chuva"],
                              cons=["Custo de energia e de água"], then=["Lembrete para conferir a umidade do solo"]))
        paths.append(path("zarc", "Seguir o calendário do Zarc",
                          "O Zarc já considera a variação histórica de chuva do município.",
                          pros=["Mantém Proagro e seguro"], cons=["Não olha a chuva deste ano"], then=[]))
        return {"title": f"Mês mais seco que o normal: {pct}% da chuva esperada", "summary": base,
                "question": "O que fazer com a falta de chuva?", "paths": paths, "why": [base]}
    paths = [
        path("vistoriar", "Vistoriar as lavouras nesta semana",
             "Folha molhada por muito tempo favorece doenças. O técnico confirma antes de qualquer aplicação.",
             pros=["Pega um problema cedo"], cons=["Tempo de vistoria"],
             then=["Checklist de vistoria por talhão"], recommended=True),
        path("escoamento", "Conferir estradas e escoamento", "Chuva acima do normal aumenta a enxurrada.",
             pros=["Evita erosão e atoleiro"], cons=["Mão de obra extra"], then=["Tarefa criada: conferir escoamento"]),
        path("acompanhar", "Só acompanhar", "Seguir a rotina e olhar a previsão.", then=["Aviso se vier chuva forte"]),
    ]
    return {"title": f"Mês mais chuvoso que o normal: {pct}% da chuva esperada", "summary": base,
            "question": "O que muda com tanta chuva?", "paths": paths, "why": [base]}


# ---------------- estoque ----------------
def semente_insuficiente(field: str, crop: str, area: float, rate: float, need: float, have: float,
                         avg_price: float | None, credit: list[str]) -> dict:
    missing = need - have
    buy = round(missing * 1.1)
    can_plant = have / rate if rate else 0
    cost = f" Custo estimado de {money(buy * avg_price)} pelo preço médio que você já pagou." if avg_price else ""
    paths = [
        path("comprar", f"Comprar {br(buy, 0)} kg (falta + 10% de margem)",
             f"Cobre os {br(missing)} kg que faltam e uma sobra para replantar falhas.{cost}",
             pros=["Planta o talhão inteiro"], cons=["Gasto agora"],
             then=[f"Semente de {crop.lower()} adicionada à lista de compras"], recommended=True),
        path("reduzir", f"Plantar só {br(can_plant)} ha com o que tem",
             f"Usar os {br(have)} kg em estoque e deixar o resto do talhão para outra cultura.",
             pros=["Sem gasto agora"], cons=[f"Planta {round(100 * (1 - can_plant / area))}% a menos de área"],
             then=[f"{field} dividido no planejamento"]),
    ]
    labels = {"pronaf": "PRONAF", "coop": "crédito da cooperativa", "proagro": "Proagro", "seguro": "seguro rural"}
    lines = [labels[c] for c in credit if c in ("pronaf", "coop")]
    if lines:
        paths.append(path("credito", "Incluir a semente no custeio", f"Você usa {' e '.join(lines)}: a semente pode entrar no financiamento.",
                          pros=["Paga depois da colheita"], cons=["Depende do prazo de liberação"],
                          then=["Resumo para levar ao banco ou à cooperativa: área, cultura e quantidade"]))
    return {
        "title": f"Sementes de {crop.lower()} não bastam para o {field}",
        "summary": f"Para {br(area)} ha você precisa de ~{br(need, 0)} kg; tem {br(have, 0)} kg. Faltam ~{br(missing, 0)} kg.",
        "question": f"Como resolver a falta de semente de {crop.lower()}?",
        "why": [f"Área desenhada por você: {br(area, 2)} ha", f"Taxa de semeadura que você informou: {br(rate)} kg/ha",
                f"Seu estoque: {br(have)} kg de semente de {crop.lower()}"],
        "paths": paths,
    }


# ---------------- defensivo ----------------
def defensivo(name: str, qty: float, unit: str, expiry: date, days: int, reg: dict, field: str | None, crop: str | None,
              pests: str | None) -> dict:
    when = f"venceu há {-days} dias" if days < 0 else f"vence em {days} dias ({dm(expiry)})"
    if not reg.get("found"):
        info = f"Registro {reg.get('registration') or 'não informado'} não encontrado no Agrofit."
    elif field:
        info = f"Registrado no Agrofit para {crop.lower()}" + (f" ({'; '.join(x.strip() for x in pests.split(';') if x.strip())})" if pests else "") + "."
    else:
        info = "Pelo Agrofit, não é registrado para as culturas dos seus talhões."
    paths = []
    if field and days >= 0:
        paths.append(path("usar", f"Usar no {field} só se o técnico confirmar a necessidade",
                          "Vistorie o talhão; sem sinal do problema, não aplique.",
                          pros=["Uso dentro da validade e do registro", "Evita desperdício"],
                          cons=["Aplicação de agrotóxico exige receituário agronômico"],
                          then=[f"Checklist de vistoria do {field}", f"Lembrete 2 dias antes de {dm(expiry)}"], recommended=True))
    paths.append(path("devolver", "Perguntar à revenda sobre a devolução",
                      "Produto vencido não pode ser aplicado; a devolução segue a logística reversa de agrotóxicos.",
                      pros=["Descarte correto, sem multa"], cons=["Perde o valor do produto"],
                      then=["O que levar à revenda: nota fiscal e embalagem fechada"], recommended=not paths))
    why = [f"Seu estoque: {br(qty)} {unit}, validade {expiry.strftime('%d/%m/%Y')}"]
    if reg.get("found"):
        why.insert(0, f"Agrofit/MAPA: registro {reg['registration']} · {reg.get('ingredient') or ''} · {reg.get('tox_class') or ''}".strip(" ·"))
    why.append("Uso de agrotóxico exige receituário agronômico (Lei 7.802/1989).")
    return {"title": f"{name} {when}", "summary": info, "question": f"O que fazer com o {name.split(' (')[0]} que {when.split(' (')[0]}?",
            "why": why, "paths": paths}


# ---------------- região ----------------
def servico_drone(municipality: str, drones: int, uf: str, uf_drones: int, br_with: int, br_total: int,
                  field: str | None, reason: str) -> dict:
    target = f"o {field}" if field else "a propriedade"
    return {
        "title": f"{br(drones, 0)} drones agrícolas registrados em {municipality}",
        "summary": f"Serviço de pulverização por drone pode ser contratado na região — {reason}.",
        "question": "Vale contratar pulverização por drone?",
        "why": [f"SIPEAGRO/MAPA: {br(drones, 0)} drones com operador sediado em {municipality} ({br(uf_drones, 0)} em {uf})",
                f"Só {br(br_with, 0)} dos {br(br_total, 0)} municípios do Brasil têm algum operador registrado",
                f"Seu contexto: {reason}"],
        "paths": [
            path("orcamento", f"Pedir orçamento para {target}", "Útil onde o pulverizador de barra não entra bem.",
                 pros=[f"{br(drones, 0)} drones registrados no seu município", "Aplicação mais localizada"],
                 cons=["Custo por hectare costuma ser maior que o do equipamento próprio"],
                 then=["Resumo do talhão (área, cultura, declive) pronto para enviar a operadores"], recommended=True),
            path("depois", "Agora não", "Guardar a informação para a próxima safra.", then=["Volta a aparecer na próxima safra"]),
        ],
    }
