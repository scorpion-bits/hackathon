def test_soja_50ha():
    """Caso de aceite da especificação."""
    from app.services.simulation import run_simulation
    import pytest
    r = run_simulation(
        area_ha=50, crop="Soja", productivity=60,
        price_saca=131, cost_ha=4800,
        price_var_pct=12, prod_var_pct=15,
    )
    # Cenário médio
    assert r.medium.revenue == 393_000         # 50 * 60 * 131
    assert r.medium.cost_total == 240_000       # 50 * 4800
    assert r.medium.profit == 153_000
    assert r.medium.margin_pct == pytest.approx(38.9, abs=0.5)

    # Ponto de equilíbrio
    assert r.breakeven_sacas_ha == pytest.approx(36.64, abs=0.1)

    # Pessimista: prod 48 (-20%), preço 115.28 (-12%)
    assert r.pessimistic.margin_negative is False
    assert r.pessimistic.profit > 0

    # Todos os cenários têm custo fixo
    assert r.pessimistic.cost_total == r.medium.cost_total == r.optimistic.cost_total


def test_negative_margin():
    """Se custo > receita, sinalizar."""
    from app.services.simulation import run_simulation
    r = run_simulation(area_ha=10, crop="Soja", productivity=20,
                       price_saca=50, cost_ha=8000)
    assert r.pessimistic.margin_negative is True
    assert r.medium.margin_negative is True  # 10*20*50=10k < 10*8k=80k


def test_validation():
    from app.services.simulation import validate_input
    assert validate_input("area_ha", 0) is not None      # < 0.1
    assert validate_input("price_saca", 0) is not None    # < 1
    assert validate_input("area_ha", 100) is None         # válido
