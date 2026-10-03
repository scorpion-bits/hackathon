# Pitch AgroBits (7 min + 1 min de margem)

Apresentação em HTML (Reveal.js local, funciona **sem internet**), vídeo de 10 s e PDF exportado.
Narrativa, tempos e validação de cada número: `docs/pitch/plano.md` · fontes dos números: `data/fontes.md`.

## Apresentar
```bash
cd pitch && python3 -m http.server 8090      # Windows: py -m http.server 8090
# abrir http://localhost:8090  (ou dar dois cliques em index.html; o vídeo e as notas funcionam melhor pelo servidor)
```
| Tecla | Ação |
|---|---|
| → / espaço | avança (cada clique revela um elemento) |
| ← | volta |
| **F** | tela cheia |
| **S** | janela do apresentador: falas de cada slide + cronômetro |
| **T** | tema claro/escuro (escolher na sala, conforme o projetor) |
| Esc | visão geral dos slides |

- **Slide 5 (vídeo):** toca sozinho ao entrar; avançar quando terminar.
- **Slide 7 (demo):** trocar para a aba do app (`http://localhost:5173`, "Entrar como João"). Se a demo falhar, fique no slide: as telas reais passam sozinhas no celular.

## Arquivos
```
index.html               slides + notas do apresentador (<aside class="notes">)
css/theme.css            identidade AgroBits (paleta oficial, escuro e claro)
js/deck.js               Reveal + mapa, contadores, celular da demo, vídeo
data/data.js             números do app, GERADO (não editar)
data/fontes.md           cada número com fonte e data
assets/img/app/          telas REAIS do app (celular 390 px, 3×)
assets/video/            agrobits-10s.mp4 (+ pôster)
video/promo.html         o vídeo como animação HTML (seek(t) quadro a quadro)
vendor/reveal/           Reveal.js 5.1 local
dist/                    AgroBits-pitch.pdf (escuro) · AgroBits-pitch-claro.pdf
scripts/                 build_data · capture_app · export_video · export_pdf
```

## Regerar (depois de mudar o app ou os dados)
```bash
.venv/bin/python pitch/scripts/build_data.py      # números (banco do app + Censo/Asbraer citados)
python3 pitch/scripts/capture_app.py              # telas reais (com ./dev.sh no ar)
python3 pitch/scripts/export_video.py             # vídeo 1920×1080, 30 fps (Playwright + ffmpeg)
python3 pitch/scripts/export_pdf.py dark          # PDF (e "light" para o claro)
```
