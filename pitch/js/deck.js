// Pitch AgroBits: inicialização do Reveal + visualizações (todas com números de window.PITCH, gerado do app).
(function () {
  const P = window.PITCH
  const $ = (s, el = document) => el.querySelector(s)
  const nf = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
  const printing = /print-pdf/.test(location.search)

  // tema claro/escuro (projetor desconhecido): tecla T; lembrado só neste navegador
  const root = document.documentElement
  try { const t = localStorage.getItem('agrobits-pitch-theme'); if (t) root.dataset.theme = t } catch (e) { /* sem storage */ }
  const toggleTheme = () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light'
    try { localStorage.setItem('agrobits-pitch-theme', root.dataset.theme) } catch (e) { /* sem storage */ }
    drawMap()
  }

  // 1 · cinco propriedades, uma acesa
  const cube = (on) => `<svg viewBox="0 0 120 120" class="${on ? '' : 'off fragment dimout'}" ${on ? '' : 'data-fragment-index="0"'}>
    <path d="M60 14 104 38 60 62 16 38Z" fill="${on ? '#7BE3A8' : 'var(--dim)'}"/><path d="M16 38 60 62v46L16 84Z" fill="${on ? '#4FD08A' : 'var(--dim)'}" opacity=".85"/>
    <path d="M104 38 60 62v46l44-24Z" fill="${on ? '#1F7A45' : 'var(--dim)'}" opacity=".7"/></svg>`
  $('#five').innerHTML = cube(true) + cube(false) + cube(false) + cube(false) + cube(false)
  // a frase "os outros 4" entra junto com o apagar das 4
  $('.s1 .fragment.up').dataset.fragmentIndex = '0'

  // 2 · mapa das regiões, cor = cobertura de orientação técnica (Censo 2017)
  function drawMap() {
    const M = P.map, cov = P.censo.regioes
    const dark = root.dataset.theme !== 'light'
    const lo = dark ? [27, 42, 32] : [220, 236, 224], hi = dark ? [76, 175, 109] : [31, 92, 57]
    const col = (v) => { const k = Math.min(1, v / 50); return `rgb(${lo.map((a, i) => Math.round(a + (hi[i] - a) * k)).join(',')})` }
    const label = { Norte: [300, 300], Nordeste: [720, 330], 'Centro-Oeste': [430, 560], Sudeste: [640, 680], Sul: [470, 870] }
    let svg = `<svg viewBox="0 0 ${M.w} ${M.h}" role="img" aria-label="Mapa do Brasil por região: cobertura de orientação técnica">`
    for (const [name, d] of Object.entries(M.regions)) {
      const f = name === 'Nordeste' ? 'var(--accent)' : col(cov[name])
      svg += `<path d="${d}" fill="${f}"/>`
    }
    for (const [name, [x, y]] of Object.entries(label)) {
      const ty = y * (M.h / 1000)
      svg += `<text x="${x}" y="${ty}" text-anchor="middle" font-size="64">${nf(cov[name], 0)}%</text><text class="n" x="${x}" y="${ty + 36}" text-anchor="middle">${name}</text>`
    }
    $('#map').innerHTML = svg + '</svg>'
  }
  drawMap()

  // 3 · linhas cruas do Zarc rolando (arquivo oficial)
  const lines = [P.zarc_raw.header, ...P.zarc_raw.rows]
  const html = lines.map((l, i) => `<div class="${i === 0 ? 'h' : ''}">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('')
  $('#csv .roll').innerHTML = html + html
  $('#csvsrc').textContent += ` ${P.zarc_raw.file}.`

  // 10 · contagem real de commits
  if (P.repo && P.repo.commits) $('#commits').textContent = `${P.repo.commits} commits`

  // contadores: animam ao entrar no slide
  function count(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || ''
    if (printing) { el.textContent = nf(end, dec) + suf; return }
    const t0 = performance.now(), dur = 1100
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - k, 3); el.textContent = nf(end * e, dec) + suf; if (k < 1) requestAnimationFrame(step) }
    requestAnimationFrame(step)
  }
  // barras do slide 2 crescem ao entrar
  function grow(slide) {
    slide.querySelectorAll('.bar .fill').forEach((f) => { const w = f.style.width; f.style.width = '0%'; requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = w })) })
  }
  // celular da demo: telas reais passam sozinhas
  let reelTimer = null
  function reel(on) {
    clearInterval(reelTimer)
    if (!on || printing) return
    const imgs = [...document.querySelectorAll('#reel img')]; let i = 0
    reelTimer = setInterval(() => { imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on') }, 2600)
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
    if (s.classList.contains('s2')) grow(s)
    reel(s.classList.contains('s7'))
    const v = $('#promo')
    if (s.classList.contains('video')) { v.currentTime = 0; v.play().catch(() => {}) } else v.pause()
  }
  Reveal.on('slidechanged', (e) => onSlide(e.currentSlide))
})()
