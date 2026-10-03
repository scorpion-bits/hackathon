#!/usr/bin/env python3
"""Gera pitch/data/data.js com os números REAIS usados nos slides (window.PITCH), a partir do banco do app e das fontes.
Uso: python3 pitch/scripts/build_data.py   (rodar da raiz do repositório; app não precisa estar no ar)
Fontes externas (Censo Agro 2017/IBGE, Asbraer 2023) ficam fixas aqui, com a citação — ver pitch/data/fontes.md.
"""
import io
import json
import math
import sqlite3
import subprocess
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PITCH = ROOT / 'pitch'
con = sqlite3.connect(ROOT / 'data' / 'opendata.db')
one = lambda q, *a: con.execute(q, a).fetchone()[0]  # noqa: E731

# --- base local do app (mesmas contas de /api/opendata/funnel)
zarc = one('SELECT COUNT(*) FROM zarc_risk')
agrofit = one('SELECT COUNT(*) FROM agrofit')
psr = int(one('SELECT COALESCE(SUM(insurance_policies),0) FROM region_stats'))
avia = int(one('SELECT COALESCE(SUM(drones+planes),0) FROM region_stats'))
zarc_arq = one("SELECT COUNT(*) FROM zarc_risk WHERE geocode='3503208'")

# --- linhas cruas do Zarc (arquivo oficial do MAPA) para o slide do "paradoxo"
raw = sorted((ROOT / 'data' / 'raw' / 'zarc').glob('*2026-2027*.zip'))[-1]
with zipfile.ZipFile(raw) as z:
    name = z.namelist()[0]
    with z.open(name) as f:
        txt = io.TextIOWrapper(f, encoding='utf-8-sig')
        header = next(txt).strip()
        rows = [next(txt).strip() for _ in range(60)]

# --- mapa das 5 grandes regiões (IBGE malhas, qualidade mínima) → caminhos SVG (equirretangular com cos(lat))
geo = json.loads((PITCH / 'data' / 'ibge-regioes.geojson').read_text())
NAMES = {'1': 'Norte', '2': 'Nordeste', '3': 'Sudeste', '4': 'Sul', '5': 'Centro-Oeste'}
k = math.cos(math.radians(-15))
pts = [(x, y) for f in geo['features'] for poly in (f['geometry']['coordinates'] if f['geometry']['type'] == 'MultiPolygon' else [f['geometry']['coordinates']]) for ring in poly for x, y in ring]
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
W = 900
s = W / ((maxx - minx) * k)
H = (maxy - miny) * s
regions = {}
for f in geo['features']:
    polys = f['geometry']['coordinates'] if f['geometry']['type'] == 'MultiPolygon' else [f['geometry']['coordinates']]
    d = ''
    for poly in polys:
        for ring in poly:
            d += 'M' + 'L'.join(f'{(x - minx) * k * s:.1f},{(maxy - y) * s:.1f}' for x, y in ring) + 'Z'
    regions[NAMES[str(f['properties']['codarea'])]] = d

data = {
    'generated': date.today().isoformat(),
    'app': {'total': zarc + agrofit + psr + avia, 'zarc': zarc, 'agrofit': agrofit, 'psr': psr, 'aviacao': avia, 'zarc_araraquara': zarc_arq},
    'zarc_raw': {'file': raw.name, 'header': header, 'rows': rows},
    # Censo Agropecuário 2017 (IBGE), resultados definitivos; tabela por região e ATER reproduzida pela Asbraer (2023)
    'censo': {'total': 5073324, 'receberam': 1025443, 'pct': 20.1, 'pct2006': 22.0, 'gov2006': 491607, 'gov2017': 388077,
              'familiar': 3897408, 'familiar_receberam': 708318,
              'regioes': {'Norte': 10.39, 'Nordeste': 8.21, 'Sudeste': 28.64, 'Sul': 48.59, 'Centro-Oeste': 23.63}},
    'asbraer': {'extensionistas': 13690, 'beneficiarios': 2420485},
    'repo': {'commits': int(subprocess.run(['git', 'rev-list', '--count', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip() or 0)},
    'map': {'w': W, 'h': round(H, 1), 'regions': regions},
}
out = PITCH / 'data' / 'data.js'
out.write_text('// gerado por pitch/scripts/build_data.py — não editar à mão\nwindow.PITCH = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('ok →', out, f"(total {data['app']['total']:,})")
