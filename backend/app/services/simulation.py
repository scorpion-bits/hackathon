"""Motor de cálculo da simulação financeira da safra."""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class ScenarioResult:
    label: str                    # 'pessimista' | 'medio' | 'otimista'
    productivity: float           # sacas/ha
    price_saca: float             # R$/saca
    production_total: float       # sacas (Área × Produtividade)
    revenue: float                # R$ (Produção × Preço)
    cost_total: float             # R$ (Área × Custo/ha)
    profit: float                 # R$ (Receita - Custo)
    margin_pct: float             # % ((Lucro / Receita) × 100)
    margin_negative: bool         # Custo > Receita?


@dataclass
class SimulationResult:
    area_ha: float
    crop: str
    cost_ha: float
    breakeven_sacas_ha: float     # Custo/ha ÷ Preço/saca
    breakeven_text: str           # Texto explicativo
    pessimistic: ScenarioResult
    medium: ScenarioResult
    optimistic: ScenarioResult
    baseline_text: str            # "Fazer nada" — texto explicativo
    sources: dict                 # Fontes rastreáveis


def calculate_scenario(
    label: str, area_ha: float, productivity: float,
    price_saca: float, cost_ha: float
) -> ScenarioResult:
    production = area_ha * productivity
    revenue = production * price_saca
    cost_total = area_ha * cost_ha
    profit = revenue - cost_total
    margin = (profit / revenue * 100) if revenue > 0 else -100.0
    return ScenarioResult(
        label=label,
        productivity=productivity,
        price_saca=price_saca,
        production_total=production,
        revenue=revenue,
        cost_total=cost_total,
        profit=profit,
        margin_pct=round(margin, 1),
        margin_negative=profit < 0,
    )


def run_simulation(
    area_ha: float,
    crop: str,
    productivity: float,
    price_saca: float,
    cost_ha: float,
    price_var_pct: float = 12.0,
    prod_var_pct: float = 15.0,
    sources: dict | None = None,
) -> SimulationResult:
    """Executa a simulação nos 3 cenários."""
    # Cenários
    pessimistic = calculate_scenario(
        "pessimista", area_ha,
        productivity * (1 - prod_var_pct / 100),
        price_saca * (1 - price_var_pct / 100),
        cost_ha,
    )
    medium = calculate_scenario(
        "medio", area_ha, productivity, price_saca, cost_ha,
    )
    optimistic = calculate_scenario(
        "otimista", area_ha,
        productivity * (1 + prod_var_pct / 100 * 0.67),  # +10% (conservador)
        price_saca * (1 + price_var_pct / 100 * 0.9),    # ~+11%
        cost_ha,
    )
    # Ponto de equilíbrio
    breakeven = cost_ha / price_saca if price_saca > 0 else float('inf')
    breakeven_text = (
        f"Você precisa colher pelo menos {breakeven:.1f} sacas por hectare "
        f"para cobrir os custos de R$ {cost_ha:,.0f}/ha."
    )
    # Linha de base "fazer nada"
    baseline_text = (
        f"Se não plantar, o custo fixo da terra continua. "
        f"A área de {area_ha:.0f} ha ficará ociosa, "
        f"sem gerar receita para cobrir despesas fixas."
    )

    return SimulationResult(
        area_ha=area_ha, crop=crop, cost_ha=cost_ha,
        breakeven_sacas_ha=round(breakeven, 2),
        breakeven_text=breakeven_text,
        pessimistic=pessimistic,
        medium=medium,
        optimistic=optimistic,
        baseline_text=baseline_text,
        sources=sources or {},
    )

LIMITS = {
    'area_ha':        (0.1, 50_000),
    'productivity':   (1, 500),
    'price_saca':     (1, 5_000),
    'cost_ha':        (100, 100_000),
    'price_var_pct':  (0, 50),
    'prod_var_pct':   (0, 50),
}

def validate_input(field: str, value: float) -> str | None:
    """Retorna mensagem de erro ou None se válido."""
    lo, hi = LIMITS.get(field, (None, None))
    if lo is not None and value < lo:
        return f"{field} deve ser no mínimo {lo}"
    if hi is not None and value > hi:
        return f"{field} deve ser no máximo {hi}"
    return None
