#!/usr/bin/env python3
"""Captura telas REAIS do AgroBits (celular 390×844, 3×) para o pitch e o vídeo. Requer o app rodando (./dev.sh).
Uso: python3 pitch/scripts/capture_app.py [URL]  → pitch/assets/img/app/*.png
"""
import glob
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173').rstrip('/')
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'img' / 'app'
OUT.mkdir(parents=True, exist_ok=True)
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
proxy = os.environ.get('HTTPS_PROXY')

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, proxy={'server': proxy, 'bypass': 'localhost,127.0.0.1'} if proxy else None)
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, ignore_https_errors=True, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    def shot(name, full=False):
        pg.evaluate('document.fonts.ready')
        pg.screenshot(path=str(OUT / f'{name}.png'), full_page=full)
    pg.goto(BASE + '/entrar'); pg.wait_for_timeout(1500); shot('01-entrar')
    pg.get_by_text('Entrar como João').click(); pg.get_by_text('Vamos resolver').wait_for(timeout=40000); pg.wait_for_timeout(2500)
    shot('02-inicio')
    pg.get_by_role('link', name='Resolver agora').first.click(); pg.get_by_text('Caminhos possíveis').wait_for(timeout=30000); pg.wait_for_timeout(1500)
    shot('03-resolver')
    pg.get_by_role('checkbox').check(); pg.get_by_role('button', name='Enviar meu caso').click(); pg.wait_for_timeout(2500)
    pg.get_by_text('Ver como o técnico recebe').first.scroll_into_view_if_needed(); shot('04-enviado')
    pg.get_by_text('Ver como o técnico recebe').first.click(); pg.get_by_text('Quem e onde').wait_for(timeout=30000); pg.wait_for_timeout(1500)
    shot('05-tecnico')
    pg.goto(BASE + '/mapa'); pg.wait_for_timeout(45000); shot('06-mapa')  # tiles de satélite demoram no navegador sem GPU
    pg.goto(BASE + '/dados'); pg.wait_for_timeout(3000); shot('07-dados')
    # faixas para a rolagem dentro do celular (vídeo/slides): viewport alto, sem a barra de navegação de baixo
    from PIL import Image
    tall = b.new_context(viewport={'width': 390, 'height': 2600}, device_scale_factor=3, ignore_https_errors=True, is_mobile=True, has_touch=True)
    tp = tall.new_page()
    tp.goto(BASE + '/entrar'); tp.get_by_text('Entrar como João').click(); tp.get_by_text('Vamos resolver').wait_for(timeout=40000); tp.wait_for_timeout(2500)
    def strip(name):
        tp.evaluate('document.fonts.ready')
        path = OUT / f'{name}.png'
        tp.screenshot(path=str(path))
        im = Image.open(path); im.crop((0, 0, im.width, im.height - 58 * 3)).save(path)
    strip('02-inicio-full')
    tp.get_by_role('link', name='Resolver agora').first.click(); tp.get_by_text('Caminhos possíveis').wait_for(timeout=30000); tp.wait_for_timeout(1500)
    tp.get_by_role('checkbox').check(); tp.wait_for_timeout(300)
    strip('03-resolver-full')
    tp.get_by_role('button', name='Enviar meu caso').click(); tp.wait_for_timeout(2500)
    tp.get_by_text('Ver como o técnico recebe').first.click(); tp.get_by_text('Quem e onde').wait_for(timeout=30000); tp.wait_for_timeout(2000)
    strip('05-tecnico-full')
    b.close()
print('ok →', OUT)
