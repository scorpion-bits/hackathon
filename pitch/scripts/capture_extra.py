#!/usr/bin/env python3
"""Telas extras (reais) para o vídeo e o slide "como funciona": entrevista com talhões, IA, mapa vivo e dados abertos.
Uso: python3 pitch/scripts/capture_extra.py [URL]   (app no ar; a IA precisa da chave para responder pelo modelo)"""
import glob
import os
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173').rstrip('/')
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'img' / 'app'
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
proxy = os.environ.get('HTTPS_PROXY')


def dark_share(path):
    """Fração de pixels quase pretos (tiles de satélite que não carregaram)."""
    im = Image.open(path).convert('L').resize((130, 270))
    px = list(im.getdata())
    return sum(1 for v in px if v < 22) / len(px)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, proxy={'server': proxy, 'bypass': 'localhost,127.0.0.1'} if proxy else None)
    c = b.new_context(viewport={'width': 390, 'height': 812}, device_scale_factor=3, ignore_https_errors=True, is_mobile=True, has_touch=True)
    pg = c.new_page()

    # 1) entrevista: talhões no mapa (conta nova, exemplo de 3 talhões)
    pg.goto(BASE + '/entrar'); pg.get_by_text('Experimentar como novo').click()
    pg.get_by_role('button', name='Começar').click(timeout=30000)
    pg.get_by_text('Pequeno produtor').click(); pg.get_by_role('button', name='Continuar').click()
    pg.get_by_role('textbox').first.fill('Araraquara'); pg.get_by_text('Araraquara / SP').click(timeout=30000)
    pg.get_by_role('button', name='Continuar').click()
    pg.get_by_role('button', name='Usar exemplo').first.click(timeout=30000)
    for i in range(12):
        pg.wait_for_timeout(5000)
        pg.screenshot(path=str(OUT / 'f-entrevista.png'))
        if dark_share(OUT / 'f-entrevista.png') < 0.08:
            break
    print('entrevista escuro:', round(dark_share(OUT / 'f-entrevista.png'), 3))

    # 2) João: IA, mapa vivo, dados abertos
    pg.goto(BASE + '/entrar'); pg.get_by_text('Entrar como João').click(); pg.get_by_text('Vamos resolver').wait_for(timeout=60000)
    pg.goto(BASE + '/assistente'); pg.wait_for_timeout(2000)
    box = pg.get_by_placeholder('Pergunte sobre plantio, clima, produtos…')
    box.fill('Qual o risco de plantar o milho do Talhão 2 agora?'); box.press('Enter')
    pg.wait_for_timeout(25000)
    pg.screenshot(path=str(OUT / 'f-ia.png'))

    pg.goto(BASE + '/dados'); pg.wait_for_timeout(4000); pg.screenshot(path=str(OUT / 'f-dados.png'))

    pg.goto(BASE + '/mapa')
    for i in range(14):
        pg.wait_for_timeout(5000)
        pg.screenshot(path=str(OUT / 'f-mapa.png'))
        if i > 3 and dark_share(OUT / 'f-mapa.png') < 0.06:
            break
    print('mapa escuro:', round(dark_share(OUT / 'f-mapa.png'), 3))
    b.close()
print('ok')
