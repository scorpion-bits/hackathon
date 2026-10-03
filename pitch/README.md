# Pitch AgroBits (6min30 + margem; máximo 7 min)

Apresentação em HTML (Reveal.js local, funciona **sem internet**), vídeo-vitrine de 24 s e PDF exportado.
Roteiro, falas, tempos, demonstração e plano B: **`docs/pitch/plano.md`** · fonte de cada número: `data/fontes.md`.

## Apresentar
```bash
cd pitch && python3 -m http.server 8090      # Windows: py -m http.server 8090
# abrir http://localhost:8090  (dois cliques em index.html também abre, mas vídeo e notas funcionam melhor pelo servidor)
```
| Tecla | Ação |
|---|---|
| → / espaço | avança (cada clique revela um elemento) |
| ← | volta |
| **F** | tela cheia |
| **S** | janela do apresentador: fala de cada slide + cronômetro |
| **T** | tema claro ↔ escuro (o claro é o padrão; trocar na sala se o projetor lavar as cores) |
| Esc | visão geral dos slides |

- **Slide 7 (`#/7`, vídeo):** toca sozinho ao entrar (24 s, com música de fundo e efeitos: ligar o som do notebook/caixa); avançar quando terminar.
- **Slide 10 (`#/10`, demo ao vivo):** trocar para o navegador do app (`http://localhost:5173`, "Entrar como João"). Se a demo falhar, fique no slide e narre os 5 passos pelo celular da tela.
- Capa, chamada da solução, vídeo e fechamento são sempre escuros; o manifesto é verde — nos dois temas.

## Arquivos
```
index.html               17 slides + notas do apresentador (<aside class="notes">)
css/theme.css            identidade AgroBits (paleta oficial; cartões isométricos e cubos como no app)
js/deck.js               Reveal + moldura, cubos, mapa, CSV do Zarc, funil do João, contadores, vídeo
data/data.js             números do app, GERADO (não editar)
data/fontes.md           cada número com fonte e data
assets/img/app/          telas REAIS do app (celular 390 px, 3×)
assets/video/            agrobits-showcase.mp4 (+ .webm reserva, pôster, storyboard do PDF)
video/promo.html         o vídeo como animação HTML (seek(t) quadro a quadro)
vendor/reveal/           Reveal.js 5.1 local
dist/                    AgroBits-pitch.pdf (claro) · AgroBits-pitch-escuro.pdf
scripts/                 build_data · capture_app · capture_extra · export_video · export_pdf
```

## Regerar (depois de mudar o app ou os dados)
```bash
.venv/bin/python pitch/scripts/build_data.py      # números (banco do app + Censo/Asbraer citados; com a API no ar, conta os assuntos do dia)
python3 pitch/scripts/capture_app.py              # telas reais do roteiro (com ./dev.sh no ar)
python3 pitch/scripts/capture_extra.py            # entrevista, IA, dados abertos e mapa vivo
python3 pitch/scripts/export_video.py             # vídeo 1920×1080, 30 fps (Playwright + ffmpeg); --derived só refaz webm/pôster/storyboard; o áudio sai de make_sfx.py
python3 pitch/scripts/export_pdf.py               # PDF claro (padrão); "dark" gera o escuro
```
