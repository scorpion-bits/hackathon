// Pitch AgroBits: moldura (marca, capítulo, fonte, página), visualizações e Reveal.
// Todos os números vêm de window.PITCH (gerado do app por scripts/build_data.py) ou estão citados no próprio slide.
(function () {
  const P = window.PITCH
  const $ = (s, el = document) => el.querySelector(s)
  const $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const nf = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
  const printing = /print-pdf/.test(location.search)
  const root = document.documentElement

  // tema: claro por padrão; T troca (lembrado só neste navegador); ?tema=escuro|claro força (usado na exportação do PDF)
  const KEY = 'agrobits-pitch-tema'
  try { const t = localStorage.getItem(KEY); if (t) root.dataset.theme = t } catch (e) { /* sem storage */ }
  const forced = new URLSearchParams(location.search).get('tema')
  if (forced) root.dataset.theme = forced === 'escuro' ? 'dark' : 'light'
  const toggleTheme = () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(KEY, root.dataset.theme) } catch (e) { /* sem storage */ }
    drawMap()
  }

  // fonte do slide do paradoxo: o nome do arquivo original do MAPA
  $('section[data-id="paradoxo"]').dataset.source =
    `Fonte: MAPA, Zoneamento Agrícola de Risco Climático — Tábua de Risco (dados.agricultura.gov.br), arquivo original ${P.zarc_raw.file}. Linhas reais, sem edição.`

  // ---------- moldura comum: marca + capítulos no alto; fonte + página embaixo (não vai nos slides escuros nem no manifesto)
  const CHAPTERS = [['problema', 'Problema'], ['dados', 'Dados'], ['solucao', 'Solução'], ['impacto', 'Impacto']]
  const framed = $$('.slides > section[data-chapter]').filter((s) => !s.classList.contains('dark') && !s.classList.contains('manifesto'))
  framed.forEach((s, i) => {
    const top = document.createElement('div')
    top.className = 'chrome-top'
    top.innerHTML = `<div class="brand"><img src="assets/img/brand/simbolo.png" alt="">AgroBits</div>
      <div class="chapters">${CHAPTERS.map(([k, l]) => `<span class="${k === s.dataset.chapter ? 'on' : ''}">${l}</span>`).join('')}</div>`
    const foot = document.createElement('div')
    foot.className = 'chrome-foot'
    foot.innerHTML = `<span class="src">${s.dataset.source || ''}</span><span class="page">${String(i + 1).padStart(2, '0')} / ${framed.length}</span>`
    s.prepend(top); s.append(foot)
  })

  // ---------- cubo isométrico da marca (as cores do símbolo; mesmo desenho do IsoCube do app)
  const ON = ['#7BE3A8', '#4FD08A', '#1F7A45'], OFF = ['var(--off-t)', 'var(--off-l)', 'var(--off-r)']
  const faces = ([t, l, r]) => `<path d="M60 10 108 37 60 64 12 37Z" fill="${t}"/><path d="M12 37 60 64v48L12 85Z" fill="${l}"/><path d="M108 37 60 64v48l48-27Z" fill="${r}"/>`
  $$('svg[data-cube]').forEach((el) => {
    el.setAttribute('viewBox', '0 0 120 120')
    const label = el.dataset.cube
    if (label) { // cubo numerado (passos)
      el.innerHTML = `<g stroke="#0E3B22" stroke-width="6" stroke-linejoin="round">${faces(ON)}</g>
        <text x="84" y="88" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="40" fill="#fff">${label}</text>`
    } else { // P1: estabelecimento apagado; o "lit" acende ao entrar no slide
      el.innerHTML = `<g stroke="var(--off-s)" stroke-width="3" stroke-linejoin="round">${faces(OFF)}</g>` +
        (el.classList.contains('lit') ? `<g class="on" stroke="#0E3B22" stroke-width="4" stroke-linejoin="round">${faces(ON)}</g>` : '')
    }
  })

  // ---------- P3: mapa das regiões, cor = cobertura de orientação técnica (Censo 2017); Nordeste em destaque
  const lumin = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const inkFor = (rgb) => { const L = lumin(rgb); return 1.05 / (L + 0.05) >= (L + 0.05) / 0.072 ? '#FFFFFF' : '#1C2B21' }
  function drawMap() {
    const M = P.map, cov = P.censo.regioes
    const dark = root.dataset.theme === 'dark'
    const lo = dark ? [33, 52, 40] : [214, 232, 219], hi = dark ? [76, 175, 109] : [31, 92, 57]
    const mix = (v) => { const k = Math.min(1, v / 50); return lo.map((a, i) => Math.round(a + (hi[i] - a) * k)) }
    const fills = {}
    for (const name of Object.keys(M.regions)) fills[name] = name === 'Nordeste' ? (dark ? [242, 201, 76] : [183, 121, 31]) : mix(cov[name])
    const label = { Norte: [300, 300], Nordeste: [735, 330], 'Centro-Oeste': [445, 560], Sudeste: [650, 690], Sul: [500, 828] }
    let svg = `<svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="Brasil por região: cobertura de orientação técnica">`
    for (const [name, d] of Object.entries(M.regions)) svg += `<path d="${d}" fill="rgb(${fills[name]})"/>`
    for (const [name, [x, y]] of Object.entries(label)) {
      const ty = y * (M.h / 1000), ink = inkFor(fills[name])
      const halo = `stroke="rgb(${fills[name]})" stroke-width="8" paint-order="stroke" stroke-linejoin="round"` // se o rótulo vazar da região, continua legível
      svg += `<text x="${x}" y="${ty}" text-anchor="middle" font-size="58" fill="${ink}" ${halo}>${nf(cov[name], 0)}%</text><text class="n" x="${x}" y="${ty + 34}" text-anchor="middle" fill="${ink}" ${halo}>${name}</text>`
    }
    $('#map').innerHTML = svg + '</svg>'
  }
  drawMap()

  // ---------- D2: linhas cruas do arquivo oficial do Zarc, rolando
  const esc = (l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const rows = [P.zarc_raw.header, ...P.zarc_raw.rows].map((l, i) => `<div class="${i === 0 ? 'h' : ''}">${esc(l)}</div>`).join('')
  $('#csv .roll').innerHTML = rows + rows
  $('#csv-name').textContent = P.zarc_raw.file.replace(/\.zip$/, '')

  // ---------- S2: o João (conta de demonstração) e o funil do app
  const J = P.joao
  $('#j-mun').textContent = `${J.municipality}/${J.uf}`
  $('#j-farm').textContent = J.farm
  $('#j-ha').textContent = `${nf(J.total_ha, 1)} ha`
  $('#j-fields').innerHTML = J.fields.map((f) =>
    `<div class="fld"><i style="background:${f.color}"></i><b>${f.name}</b><span>${f.crop} · ${nf(f.area_ha, 2)} ha</span></div>`).join('')
  if (J.funnel) {
    $('#f-total').dataset.count = J.funnel.total; $('#f-total').textContent = nf(J.funnel.total)
    $('#f-local').dataset.count = J.funnel.local; $('#f-local').textContent = nf(J.funnel.local)
    if (J.funnel.topics) $('#f-topics').textContent = J.funnel.topics
  }

  // ---------- construção: pilha isométrica da arquitetura (dados abertos na base)
  const LAYERS = [
    ['App no celular', 'React + TypeScript · mapa · mobile first', OFF],
    ['Regras + IA', 'FastAPI · 7 regras · IA + modo offline', OFF],
    ['Pipeline reprodutível', 'Python + SQLite · hash · data da coleta', OFF],
    ['Dados abertos', 'MAPA · NASA · IBGE · ANA/Embrapa · Open-Meteo', ON],
  ]
  {
    const cx = 160, hw = 150, hd = 44, th = 34, gap = 104
    let g = ''
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      const [t, sub, c] = LAYERS[i], y = 24 + i * gap
      const top = `${cx},${y} ${cx + hw},${y + hd} ${cx},${y + 2 * hd} ${cx - hw},${y + hd}`
      const left = `${cx - hw},${y + hd} ${cx},${y + 2 * hd} ${cx},${y + 2 * hd + th} ${cx - hw},${y + hd + th}`
      const right = `${cx},${y + 2 * hd} ${cx + hw},${y + hd} ${cx + hw},${y + hd + th} ${cx},${y + 2 * hd + th}`
      const s = c === ON ? '#0E3B22' : 'var(--off-s)'
      g += `<g stroke="${s}" stroke-width="3" stroke-linejoin="round"><polygon points="${left}" fill="${c[1]}"/><polygon points="${right}" fill="${c[2]}"/><polygon points="${top}" fill="${c[0]}"/></g>
        <text class="t" x="${cx + hw + 36}" y="${y + hd + 2}">${t}</text><text class="s" x="${cx + hw + 36}" y="${y + hd + 34}">${sub}</text>`
    }
    $('#stack').innerHTML = `<svg viewBox="0 0 900 ${24 + (LAYERS.length - 1) * gap + 2 * hd + th + 10}" role="img" aria-label="Arquitetura em camadas">${g}</svg>`
  }
  if (P.repo && P.repo.commits) $('#commits').textContent = `${Math.floor(P.repo.commits / 10) * 10}+`

  // ---------- contadores (sobem até o valor ao entrar no slide)
  function count(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || ''
    const fmt = (v) => nf(dec ? v : Math.round(v), dec) + suf
    if (printing) { el.textContent = fmt(end); return }
    const t0 = performance.now(), dur = 1200
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); el.textContent = fmt(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }

  Reveal.initialize({
    width: 1920, height: 1080, margin: 0, minScale: .1, maxScale: 3,
    hash: true, controls: false, progress: true, center: false, slideNumber: false,
    transition: 'fade', transitionSpeed: 'default', backgroundTransition: 'fade',
    pdfSeparateFragments: false, pdfMaxPagesPerSlide: 1, plugins: [RevealNotes],
    keyboard: { 84: toggleTheme },
  }).then(() => onSlide(Reveal.getCurrentSlide()))

  function onSlide(s) {
    s.querySelectorAll('[data-count]').forEach(count)
    const v = $('#promo')
    // com som (a tecla/clique do apresentador libera o áudio); se o navegador barrar, toca mudo
    if (s.classList.contains('video')) { v.currentTime = 0; v.muted = false; v.play().catch(() => { v.muted = true; v.play().catch(() => {}) }) } else v.pause()
  }
  Reveal.on('slidechanged', (e) => onSlide(e.currentSlide))
})()
