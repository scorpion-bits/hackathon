#!/usr/bin/env python3
"""Teste ponta a ponta dos 2 cenários da demo (M6), em celular (390 px) e notebook (1280 px).

Pré-requisito: `./dev.sh` rodando (API 8000 + interface 5173) — a conta João volta ao estado inicial a cada entrada.
Uso: python3 tests/e2e_demo.py [URL]   (padrão http://localhost:5173)
Requer: pip install playwright e um Chromium (em /opt/pw-browsers ou `playwright install chromium`).
"""
import glob
import re
import sys

from playwright.sync_api import Page, expect, sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5173').rstrip('/')
VIEWPORTS = {'celular': (390, 844), 'notebook': (1280, 800)}
T = 25_000


def chromium_path() -> str | None:
    found = sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux/chrome'))
    return found[-1] if found else None


def btn(page: Page, name: str, exact: bool = False):
    return page.get_by_role('button', name=name, exact=exact)


def existing_account(page: Page, tag: str):
    """João → início → Resolver → enviar caso → Meus casos → simular resposta → mapa → IA (offline)."""
    page.goto(BASE + '/')
    expect(page).to_have_url(re.compile(r'/entrar$'), timeout=T)  # quem não entrou cai no login
    page.get_by_text('Entrar como João').click()
    expect(page.get_by_text('Vamos resolver')).to_be_visible(timeout=T)
    expect(page.get_by_text(re.compile('conta de demonstração', re.I)).locator('visible=true').first).to_be_visible()
    assert 'prototipo' not in page.url

    page.get_by_role('link', name=re.compile('Resolver')).first.click()
    expect(page).to_have_url(re.compile(r'/resolver/'), timeout=T)
    expect(page.get_by_text('Caminhos possíveis')).to_be_visible(timeout=T)
    page.get_by_role('checkbox').check()
    btn(page, 'Enviar meu caso').click()
    expect(page.get_by_text(re.compile('caso (foi )?enviado|Caso enviado|enviado', re.I)).first).to_be_visible(timeout=T)

    page.goto(BASE + '/casos')
    btn(page, 'Simular resposta (demo)').first.click()
    expect(page.get_by_text(re.compile('Respondido|respondeu|Resposta', re.I)).first).to_be_visible(timeout=T)

    page.goto(BASE + '/mapa')
    expect(page.locator('canvas, .leaflet-container').first).to_be_visible(timeout=T)

    page.goto(BASE + '/assistente')
    box = page.get_by_placeholder(re.compile('Pergunte sobre'))
    box.fill('Qual o risco para plantar milho agora?')
    box.press('Enter')
    expect(page.get_by_text(re.compile('Zarc', re.I)).last).to_be_visible(timeout=T)
    page.screenshot(path=f'/tmp/e2e_{tag}_existente.png')


def new_account(page: Page, tag: str):
    """Experimentar → entrevista em outro município → talhão → assuntos aparecem."""
    page.goto(BASE + '/entrar')
    page.get_by_text('Experimentar como novo').click()
    expect(page).to_have_url(re.compile(r'/entrevista'), timeout=T)
    btn(page, 'Começar').click(timeout=T)
    page.get_by_text('Pequeno produtor').click()
    btn(page, 'Continuar').click()
    page.get_by_role('textbox').first.fill('Ribeirão Preto')
    page.get_by_text('Ribeirão Preto / SP').click(timeout=T)
    btn(page, 'Continuar').click()

    btn(page, 'Desenhar talhão').click(timeout=T)
    m = page.locator('.leaflet-container').first.bounding_box()
    cx, cy = m['x'] + m['width'] / 2, m['y'] + m['height'] / 2
    pts = [(-50, -30), (50, -30), (50, 30), (-50, 30), (-50, -30)]
    for dx, dy in pts:
        page.mouse.click(cx + dx, cy + dy)
        page.wait_for_timeout(250)
    btn(page, 'Soja', exact=True).click(timeout=T)
    btn(page, re.compile('^Argiloso')).click()
    btn(page, 'Não irrigo').click()
    btn(page, 'Continuar').click()

    for _ in range(14):  # pula o resto; termina no resultado
        if page.get_by_text(re.compile('Gerar meu contexto')).count() and btn(page, 'Gerar meu contexto').is_enabled():
            btn(page, 'Gerar meu contexto').click()
        elif btn(page, 'Continuar').count() and btn(page, 'Continuar').first.is_enabled():
            btn(page, 'Continuar').first.click()
        elif btn(page, 'Pular').count():
            btn(page, 'Pular').first.click()
        elif btn(page, 'Desenhar depois').count():
            btn(page, 'Desenhar depois').first.click()
        page.wait_for_timeout(500)
        if btn(page, 'Ver o que fazer hoje').count():
            break
    btn(page, 'Ver o que fazer hoje').click(timeout=T)  # grava a conta no servidor e abre o início
    expect(page).to_have_url(re.compile(r'/$'), timeout=T)
    expect(page.get_by_text(re.compile('Vamos resolver')).first).to_be_visible(timeout=T)
    expect(page.get_by_text(re.compile('1 talhão · soja'))).to_be_visible(timeout=T)  # contexto da entrevista
    assert page.get_by_role('link', name=re.compile('Resolver')).count() >= 1, 'nenhum assunto apareceu'
    page.screenshot(path=f'/tmp/e2e_{tag}_nova.png')


def main() -> int:
    failures = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=chromium_path())
        for tag, (w, h) in VIEWPORTS.items():
            for name, fn in (('conta existente (João)', existing_account), ('conta nova', new_account)):
                ctx = browser.new_context(viewport={'width': w, 'height': h})
                page = ctx.new_page()
                errors: list[str] = []
                page.on('pageerror', lambda e: errors.append(str(e)))
                try:
                    fn(page, tag)
                    print(f'OK   {tag:9} {name}' + (f'  (erros JS: {errors})' if errors else ''))
                except Exception as e:  # noqa: BLE001
                    failures += 1
                    page.screenshot(path=f'/tmp/e2e_{tag}_falha_{fn.__name__}.png')
                    print(f'FALHA {tag:9} {name}: {" / ".join(str(e).splitlines()[:6])}  (print em /tmp/e2e_{tag}_falha_{fn.__name__}.png)')
                ctx.close()
        browser.close()
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
