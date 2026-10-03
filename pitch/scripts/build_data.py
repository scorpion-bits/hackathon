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
from urllib.request import Request, urlopen

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

# --- João (conta de demonstração): talhões do fixture, área geodésica (mesma ordem de grandeza do turf no app)
def ring_area_ha(ring):
    R = 6378137.0
    tot = 0.0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        tot += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(tot * R * R / 2) / 10000


fx = json.loads((ROOT / 'backend' / 'app' / 'fixtures' / 'demo' / 'joao.json').read_text())
joao_fields = [{'name': f['name'], 'crop': f['crop'] + (' irrigado' if f.get('irrigated') else ''), 'ring': f['ring'],
                'color': f.get('color'), 'area_ha': round(ring_area_ha(f['ring']), 2)} for f in fx['fields']]
joao = {'producer': fx['producer']['name'], 'farm': fx['farm']['name'], 'municipality': fx['farm']['municipality'],
        'uf': fx['farm']['uf'], 'fields': joao_fields, 'total_ha': round(sum(f['area_ha'] for f in joao_fields), 1)}

# --- funil do João: mesmas contas de /api/opendata/funnel (services/opendata.py:funnel)
crops = list(dict.fromkeys(f['crop'] for f in fx['fields']))
firsts = list(dict.fromkeys(c.split(' ')[0] for c in crops))
zarc_mun = one(f"SELECT COUNT(*) FROM zarc_risk WHERE geocode=? AND crop IN ({','.join('?' * len(crops))})", fx['farm']['geocode'], *crops)
agro_mun = one('SELECT COUNT(*) FROM agrofit WHERE ' + ' OR '.join('crop LIKE ?' for _ in firsts), *[f'{c}%' for c in firsts])


def topics_today():
    """Quantos assuntos o app mostra hoje ao João (depende da previsão do dia): pergunta à API local, se estiver no ar.
    Atenção: entrar como João (demo) recarrega a conta de demonstração (casos enviados voltam ao estado inicial)."""
    try:
        req = lambda path, body=None, tok=None: json.load(urlopen(Request(  # noqa: E731
            'http://localhost:8000/api' + path, data=json.dumps(body).encode() if body else None,
            headers={'content-type': 'application/json', **({'authorization': f'Bearer {tok}'} if tok else {})}), timeout=20))
        tok = req('/auth/demo', {'scenario': 'existente'})['token']
        return len(req('/topics', tok=tok)['topics'])
    except Exception:  # API fora do ar: mantém o último valor gerado
        old = (PITCH / 'data' / 'data.js').read_text()
        return json.loads(old[old.index('{'):old.rindex('}') + 1]).get('joao', {}).get('funnel', {}).get('topics')


joao['funnel'] = {'total': zarc + agrofit + psr + avia, 'local': zarc_mun + agro_mun, 'zarc': zarc_mun, 'agrofit': agro_mun,
                  'topics': topics_today()}

data = {
    'generated': date.today().isoformat(),
    'joao': joao,
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
