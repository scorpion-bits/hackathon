#!/usr/bin/env python3
"""Exporta o pitch para PDF (um slide por página, animações no estado final): pitch/dist/AgroBits-pitch.pdf
Uso: python3 pitch/scripts/export_pdf.py [dark|light]   (sobe um servidor local temporário; requer Playwright)
"""
import functools
import glob
import http.server
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
theme = sys.argv[1] if len(sys.argv) > 1 else 'dark'
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=httpd.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{httpd.server_address[1]}/index.html?print-pdf'
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
out = ROOT / 'dist' / ('AgroBits-pitch.pdf' if theme == 'dark' else 'AgroBits-pitch-claro.pdf')
out.parent.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome)
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.add_init_script(f"try{{localStorage.setItem('agrobits-pitch-theme','{theme}')}}catch(e){{}}")
    pg.goto(url); pg.wait_for_load_state('networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(2500)
    pg.pdf(path=str(out), width='1920px', height='1080px', print_background=True, margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
    b.close()
httpd.shutdown()
print('ok →', out)
