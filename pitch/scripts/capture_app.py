#!/usr/bin/env python3
"""Captura telas REAIS do AgroBits para o pitch e o vídeo (celular 390 px, 3×). Requer o app rodando (./dev.sh).
Uso: python3 pitch/scripts/capture_app.py [URL]  → pitch/assets/img/app/*.png

- telas de "visor" (390×812): cabem no celular dos slides, abaixo da barra de status desenhada no slide;
- faixas altas (390×2600, sem a barra de navegação de baixo): rolagem dentro do celular no vídeo e no slide do técnico.
"""
import glob
import os
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173').rstrip('/')
OUT = Path(__file__).resolve().parents[1] / 'assets' / 'img' / 'app'
OUT.mkdir(parents=True, exist_ok=True)
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
proxy = os.environ.get('HTTPS_PROXY')
NAV = 58  # altura (px CSS) da barra de navegação de baixo do app no celular


def ctx(b, h):
    return b.new_context(viewport={'width': 390, 'height': h}, device_scale_factor=3, ignore_https_errors=True,
                         is_mobile=True, has_touch=True)


def login(pg):
    pg.goto(BASE + '/entrar')
    pg.get_by_text('Entrar como João').click()
    pg.get_by_text('Vamos resolver').wait_for(timeout=60000)
    pg.wait_for_timeout(2500)


def to_top(pg, text):
    """Rola o contêiner do app até o título `text` ficar no alto da tela (logo abaixo da barra da conta)."""
    pg.get_by_text(text, exact=True).first.evaluate("e => { e.scrollIntoView({block: 'start'}); const s = e.closest('main, [class*=overflow]'); if (s) s.scrollTop -= 16 }")
    pg.wait_for_timeout(600)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome, proxy={'server': proxy, 'bypass': 'localhost,127.0.0.1'} if proxy else None)

    pg = ctx(b, 812).new_page()
    def shot(name):
        pg.evaluate('document.fonts.ready')
        pg.screenshot(path=str(OUT / f'{name}.png'))
    pg.goto(BASE + '/entrar'); pg.wait_for_timeout(1500); shot('01-entrar')
    login(pg); shot('02-inicio')
    pg.get_by_role('link', name='Resolver agora').first.click(); pg.get_by_text('Caminhos possíveis').wait_for(timeout=30000); pg.wait_for_timeout(1500)
    shot('03a-resolver-dados')
    to_top(pg, 'Caminhos possíveis'); shot('03b-resolver-caminhos')
    pg.get_by_role('checkbox').check(); pg.get_by_role('checkbox').scroll_into_view_if_needed(); pg.wait_for_timeout(400)
    shot('03c-resolver-tecnico')
    pg.get_by_role('button', name='Enviar meu caso').click(); pg.get_by_text('Ver como o técnico recebe').first.wait_for(timeout=20000); pg.wait_for_timeout(1200)
    to_top(pg, 'Caso enviado'); shot('04-enviado')
    pg.get_by_text('Ver como o técnico recebe').first.click(); pg.get_by_text('Quem e onde').wait_for(timeout=30000); pg.wait_for_timeout(1800)
    shot('05-tecnico')

    # faixas altas (rolagem dentro do celular)
    tp = ctx(b, 2600).new_page()
    def strip(name):
        tp.evaluate('document.fonts.ready'); tp.wait_for_timeout(300)
        path = OUT / f'{name}.png'
        tp.screenshot(path=str(path))
        im = Image.open(path); im.crop((0, 0, im.width, im.height - NAV * 3)).save(path)
    login(tp); strip('02-inicio-full')
    tp.get_by_role('link', name='Resolver agora').first.click(); tp.get_by_text('Caminhos possíveis').wait_for(timeout=30000); tp.wait_for_timeout(1500)
    tp.get_by_role('checkbox').check(); tp.wait_for_timeout(300)
    strip('03-resolver-full')
    tp.get_by_role('button', name='Enviar meu caso').click(); tp.wait_for_timeout(2500)
    tp.get_by_text('Ver como o técnico recebe').first.click(); tp.get_by_text('Quem e onde').wait_for(timeout=30000); tp.wait_for_timeout(2000)
    strip('05-tecnico-full')
    b.close()
print('ok →', OUT)
