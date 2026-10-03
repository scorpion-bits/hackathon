#!/usr/bin/env python3
"""Renderiza pitch/video/promo.html quadro a quadro (seek(t)) e gera, em pitch/assets/video/:
  agrobits-showcase.mp4 (H.264) e .webm (VP9, reserva para navegador sem H.264), 1920×1080, 30 fps, 24 s;
  -poster.jpg (1º quadro, escuro como o slide anterior) e -storyboard.jpg (6 quadros, usado no PDF).
Uso: python3 pitch/scripts/export_video.py [--preview 0.5,3,6.5,9.5 | --derived]
  --preview: só alguns quadros em PNG · --derived: só refaz webm/poster/storyboard a partir do mp4 existente.
Requer Playwright (Chromium), ffmpeg e Pillow.
"""
import glob
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
FPS, DUR = 30, 24.0
chrome = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome')) or [None])[-1]
preview = sys.argv[sys.argv.index('--preview') + 1].split(',') if '--preview' in sys.argv else None
derived_only = '--derived' in sys.argv

def derived(dst):
    """WebM de reserva, pôster (1º quadro) e storyboard de 6 quadros (para o PDF), a partir do mp4."""
    from PIL import Image, ImageDraw
    mp4 = dst / 'agrobits-showcase.mp4'
    ff = ['ffmpeg', '-y', '-loglevel', 'error']
    subprocess.run(ff + ['-i', str(mp4), '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '31', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2',
                         '-an', str(dst / 'agrobits-showcase.webm')], check=True)
    subprocess.run(ff + ['-ss', '0', '-i', str(mp4), '-frames:v', '1', '-q:v', '3', str(dst / 'agrobits-showcase-poster.jpg')], check=True)
    W, H, G = 560, 315, 24
    sheet = Image.new('RGB', (3 * W + 2 * G, 2 * H + G), (15, 26, 19))
    with tempfile.TemporaryDirectory() as d:
        for i, t in enumerate(['1.4', '3.9', '6.2', '9.6', '15.6', '20.6']):
            png = Path(d) / f'{i}.png'
            subprocess.run(ff + ['-ss', t, '-i', str(mp4), '-frames:v', '1', str(png)], check=True)
            im = Image.open(png).convert('RGB').resize((W, H), Image.LANCZOS)
            mask = Image.new('L', (W, H), 0)
            ImageDraw.Draw(mask).rounded_rectangle((0, 0, W - 1, H - 1), radius=18, fill=255)
            sheet.paste(im, ((i % 3) * (W + G), (i // 3) * (H + G)), mask)
    sheet.save(dst / 'agrobits-showcase-storyboard.jpg', quality=88)
    subprocess.run([sys.executable, str(Path(__file__).with_name('make_sfx.py'))], check=True)  # efeitos sonoros (só áudio)


if derived_only:
    derived(ROOT / 'assets' / 'video')
    print('ok → webm, pôster e storyboard')
    sys.exit(0)

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
                    str(dst / 'agrobits-showcase.mp4')], check=True)
    shutil.rmtree(tmp)
    derived(dst)
    print('ok →', dst / 'agrobits-showcase.mp4')
