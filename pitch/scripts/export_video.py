#!/usr/bin/env python3
"""Renderiza pitch/video/promo.html quadro a quadro (seek(t)) e gera pitch/assets/video/agrobits-10s.mp4 (1920×1080, 30 fps).
Uso: python3 pitch/scripts/export_video.py [--preview 0.5,3,6.5,9.5]  (preview: só alguns quadros em PNG)
Requer Playwright (Chromium) e ffmpeg.
"""
import glob
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FPS, DUR = 30, 10.0
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
preview = sys.argv[sys.argv.index('--preview') + 1].split(',') if '--preview' in sys.argv else None

tmp = Path(tempfile.mkdtemp(prefix='agrobits-video-'))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=chrome)
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.goto((ROOT / 'video' / 'promo.html').as_uri() + '?render=1')
    pg.wait_for_load_state('networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(500)
    stage = pg.locator('#stage')
    times = [float(x) for x in preview] if preview else [i / FPS for i in range(int(DUR * FPS))]
    for i, t in enumerate(times):
        pg.evaluate(f'seek({t})')
        out = (ROOT / 'video' / f'preview-{t:.2f}.png') if preview else tmp / f'f{i:04d}.png'
        stage.screenshot(path=str(out))
    b.close()
if not preview:
    dst = ROOT / 'assets' / 'video'
    dst.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(tmp / 'f%04d.png'),
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart',
                    str(dst / 'agrobits-10s.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '9.6', '-i', str(dst / 'agrobits-10s.mp4'), '-frames:v', '1',
                    str(dst / 'agrobits-10s-poster.jpg')], check=True)
    shutil.rmtree(tmp)
    print('ok →', dst / 'agrobits-10s.mp4')
