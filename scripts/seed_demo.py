#!/usr/bin/env python3
"""Recria data/app.db com a propriedade de demonstração (DADOS FICTÍCIOS, rotulados na interface).

João (fictício) · Sítio Boa Esperança · Araraquara/SP · 3 talhões · histórico desde a safra 2025/26.
Produtos de defensivos usam nomes/registros reais do Agrofit; quantidades, preços e fornecedores são fictícios.

Uso: python scripts/seed_demo.py
"""
import math
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.db import APP_DB, Base, SessionLocal, engine  # noqa: E402
from app.models import (Event, Farm, Field, ProfileFact, Producer, Season, StockItem,  # noqa: E402
                        StockMovement)
from app.services.farmdata import polygon_area_ha  # noqa: E402

LAT, LON = -21.8320, -48.2360
SUPPLIER = "Cooperativa Regional (fictícia)"


def rect(dx_m: float, dy_m: float, w_m: float, h_m: float, skew: float = 0.0) -> dict:
    """Polígono aproximadamente retangular a (dx, dy) metros do ponto da sede."""
    mlat = 1 / 110_700
    mlon = 1 / (111_320 * math.cos(math.radians(LAT)))
    pts = [(0, 0), (w_m, skew), (w_m + skew, h_m), (skew * 0.5, h_m - skew)]
    ring = [[round(LON + (dx_m + x) * mlon, 6), round(LAT + (dy_m + y) * mlat, 6)] for x, y in pts]
    return {"type": "Polygon", "coordinates": [ring + [ring[0]]]}


def main() -> None:
    APP_DB.unlink(missing_ok=True)
    Base.metadata.create_all(engine)
    s = SessionLocal()

    joao = Producer(name="João da Silva (fictício)", is_demo=True, phone_pref="WhatsApp")
    farm = Farm(producer=joao, name="Sítio Boa Esperança", geocode="3503208", municipality="Araraquara", uf="SP",
                lat=LAT, lon=LON, total_area_ha=14.0)
    s.add_all([joao, farm])
    s.flush()

    t1 = Field(farm_id=farm.id, name="Talhão 1", geometry=rect(-260, 40, 260, 215, 12), crop="Soja", soil="argiloso",
               color="#2E7D4F", seed_rate_kg_ha=55, notes="Área mais plana, perto da estrada.")
    t2 = Field(farm_id=farm.id, name="Talhão 2", geometry=rect(20, 40, 200, 160, 8), crop="Milho 1ª Safra", soil="argiloso",
               color="#B7791F", seed_rate_kg_ha=20, notes="Leve declive para o córrego.")
    t3 = Field(farm_id=farm.id, name="Talhão 3", geometry=rect(-120, -170, 170, 125, 6), crop="Feijão", soil="medio",
               irrigated=True, color="#3B82A6", seed_rate_kg_ha=60, notes="Irrigado por aspersão.")
    for f in (t1, t2, t3):
        f.area_ha = polygon_area_ha(f.geometry)
    s.add_all([t1, t2, t3])

    s25 = Season(farm_id=farm.id, name="2025/26", start=date(2025, 7, 1), end=date(2026, 6, 30))
    s26 = Season(farm_id=farm.id, name="2026/27", start=date(2026, 7, 1), end=date(2027, 6, 30))
    s.add_all([s25, s26])
    s.flush()

    def item(name, cat, unit, min_q=0, crop=None, expiry=None, reg=None):
        it = StockItem(farm_id=farm.id, name=name, category=cat, unit=unit, min_quantity=min_q, crop=crop,
                       expiry_date=expiry, supplier=SUPPLIER, agrofit_registration=reg)
        s.add(it)
        return it

    soja_sem = item("Semente de soja", "semente", "kg", crop="Soja")
    milho2_sem = item("Semente de milho (safrinha)", "semente", "kg", crop="Milho")
    milho_sem = item("Semente de milho (verão)", "semente", "kg", crop="Milho")
    feijao_sem = item("Semente de feijão", "semente", "kg", crop="Feijão")
    npk = item("Adubo NPK 04-14-08", "fertilizante", "kg", min_q=300)
    ureia = item("Ureia", "fertilizante", "kg", min_q=100)
    glufos = item("Glufos Bestar (herbicida)", "defensivo", "L", min_q=5, expiry=date(2027, 5, 30), reg="00225")
    elestal = item("Elestal Neo (inseticida)", "defensivo", "L", min_q=1, expiry=date(2027, 2, 15), reg="00123")
    magic = item("Magic (fungicida)", "defensivo", "L", min_q=1, expiry=date(2026, 10, 12), reg="00218")
    diesel = item("Óleo diesel", "combustivel", "L", min_q=250)
    s.flush()

    def buy(it, qty, price, d, season):
        ev = Event(farm_id=farm.id, season_id=season.id, type="compra", date=d, origin="demo",
                   title=f"Compra · {qty:g} {it.unit} de {it.name} · R$ {qty * price:,.2f}", details={"supplier": SUPPLIER})
        s.add(ev)
        s.add(StockMovement(item=it, event=ev, kind="entrada", quantity=qty, unit_price=price, date=d, supplier=SUPPLIER))

    def event(kind, d, field, season, title, details=None, uses=()):
        ev = Event(farm_id=farm.id, field_id=field.id if field else None, season_id=season.id, type=kind, date=d,
                   title=title, details=details or {}, origin="demo")
        s.add(ev)
        for it, qty in uses:
            s.add(StockMovement(item=it, event=ev, kind="saida", quantity=qty, date=d, note=title))

    # ---- safra 2025/26 ----
    buy(soja_sem, 300, 9.50, date(2025, 10, 5), s25)
    buy(npk, 2000, 2.90, date(2025, 10, 20), s25)
    buy(glufos, 20, 42.00, date(2025, 10, 20), s25)
    buy(diesel, 600, 5.85, date(2025, 10, 25), s25)
    event("plantio", date(2025, 11, 3), t1, s25, "Plantio · Soja · Talhão 1", {"crop": "Soja"},
          [(soja_sem, 290), (npk, 1500), (diesel, 180)])
    event("aplicacao", date(2025, 12, 10), t1, s25, "Aplicação · Glufos Bestar · Talhão 1", {}, [(glufos, 8)])
    buy(ureia, 600, 3.40, date(2026, 1, 15), s25)
    buy(milho2_sem, 64, 38.00, date(2026, 2, 20), s25)
    buy(elestal, 4, 118.00, date(2026, 2, 20), s25)
    event("colheita", date(2026, 3, 5), t1, s25, "Colheita · Soja · Talhão 1",
          {"crop": "Soja", "harvested_qty": 300, "harvested_unit": "sc 60 kg"}, [(diesel, 150)])
    event("plantio", date(2026, 3, 8), t2, s25, "Plantio · Milho 2ª Safra · Talhão 2", {"crop": "Milho 2ª Safra"},
          [(milho2_sem, 64), (ureia, 300), (diesel, 90)])
    event("aplicacao", date(2026, 4, 2), t2, s25, "Aplicação · Elestal Neo · Talhão 2", {}, [(elestal, 2)])
    event("colheita", date(2026, 7, 20), t2, s25, "Colheita · Milho 2ª Safra · Talhão 2",
          {"crop": "Milho 2ª Safra", "harvested_qty": 165, "harvested_unit": "sc 60 kg"}, [(diesel, 80)])

    # ---- safra 2026/27 (atual) ----
    buy(feijao_sem, 150, 14.00, date(2026, 8, 5), s26)
    buy(diesel, 300, 6.10, date(2026, 8, 5), s26)
    event("plantio", date(2026, 8, 12), t3, s26, "Plantio · Feijão (irrigado) · Talhão 3", {"crop": "Feijão"},
          [(feijao_sem, 128), (npk, 350), (diesel, 60)])
    buy(magic, 5, 96.00, date(2026, 8, 25), s26)
    event("aplicacao", date(2026, 8, 30), t3, s26, "Aplicação · Magic · Talhão 3", {}, [(magic, 1.5)])
    buy(milho_sem, 40, 39.00, date(2026, 9, 10), s26)
    buy(npk, 1000, 3.05, date(2026, 9, 15), s26)
    buy(ureia, 500, 3.50, date(2026, 9, 15), s26)
    event("outro", date(2026, 9, 20), t2, s26, "Preparo do solo · Talhão 2", {}, [(diesel, 120)])
    event("observacao", date(2026, 9, 25), t3, s26, "Observação · Talhão 3",
          {"text": "Feijão com bom desenvolvimento; algumas folhas com manchas no canto norte."})

    facts = [
        ("Nome", "João da Silva (personagem fictício de demonstração)", "declarado"),
        ("Localização", "Araraquara/SP — zona rural", "declarado"),
        ("Área total", "14 ha (3 talhões cadastrados)", "registro"),
        ("Culturas", "Soja, milho e feijão irrigado", "registro"),
        ("Irrigação", "Aspersão no Talhão 3", "declarado"),
        ("Maquinário", "Trator 75 cv, plantadeira 4 linhas, pulverizador de barra 600 L", "declarado"),
        ("Objetivos", "Reduzir perdas por clima e saber o custo de cada talhão", "declarado"),
        ("Preferência", "Explicações simples, sem termos técnicos", "declarado"),
        ("Município no Zarc", "Araraquara (IBGE 3503208) — 16 culturas zoneadas na safra 2026/27", "oficial"),
    ]
    s.add_all(ProfileFact(producer_id=joao.id, label=a, value=b, origin=c) for a, b, c in facts)
    s.commit()
    print(f"OK → {APP_DB} · talhões: " + ", ".join(f"{f.name} {f.area_ha} ha" for f in (t1, t2, t3)))


if __name__ == "__main__":
    main()
