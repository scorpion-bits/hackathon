# Plano do pitch — AgroBits (proposta para aprovação, 03/10 ~02h)

> Status: **aprovado (03/10 ~02h) e construído** em `pitch/` (Reveal.js, vídeo de 10 s, PDF em `pitch/dist/`). Apresenta: Thales (Maria como apoio).
> Mudanças na construção: o slide 4 virou dois (4a cruzamento, 4b funil); tema claro/escuro na tecla T (projetor desconhecido); celulares com telas reais em todo o produto (mobile first).
> Tempo: 7:00 de conteúdo + ~1:00 de margem (total 8 min).

## A — Diagnóstico

**O que existe de fato (verificado no código e na API):**
- Produtor entra → entrevista (município IBGE, talhões desenhados, cultura, solo declarado, irrigação) → **7 regras determinísticas**
  cruzam as bases → **assuntos** em linguagem simples → tela **Resolver** (dados → caminhos possíveis → **enviar caso** ao técnico público)
  → **Meus casos** (enviado → respondido). IA (Groq ou offline) só explica, com fonte, e nunca dá dose.
- Funil real (conta João, Araraquara): **2.044.825 registros oficiais → 6.302 ligados ao município e às culturas → 7 assuntos**.
- O caso enviado guarda um **snapshot estruturado**: pergunta, talhão, cultura, área, solo, resumo, "por quê", fontes com data,
  status de cada fonte, caminho escolhido pelo produtor, observação, canal, consentimento LGPD (`routers/cases.py`).
- Bases usadas de verdade: Zarc, Agrofit, SIPEAGRO, PSR (MAPA, local); ANA/Embrapa pivôs, Open-Meteo, NASA POWER, IBGE malhas (ao vivo + cache); NASA GIBS (mapa).

**Lacunas que afetam o pitch:**
1. **Não existe tela do técnico.** O valor para o especialista é o centro da proposta, mas hoje ele só aparece como o quadro
   "O que vai no seu caso" na tela Resolver. Recomendo uma tela simples, só leitura, "Caso recebido — visão do técnico" (~40 min).
2. **Ganho de eficiência do técnico não é medido.** Não temos número; só podemos apresentar como hipótese a validar com a CATI (pendência H).
3. **Inclusão digital:** em 2017 só 1,43 mi produtores tinham internet e 23% não sabiam ler e escrever (IBGE). A banca pode perguntar
   "e quem não tem celular/internet?". Resposta honesta: o técnico, a cooperativa ou a Casa da Agricultura usam pelo produtor; o app é mobile, leve, com voz no assistente.
4. Falta: nomes/papéis de cada pessoa (slide de organização), quem apresenta cada parte, formato da sala (projetor? claro/escuro?), se a apresentação precisa de PDF (regra do evento: **sim, PDF é entregável**).

## B — Narrativa

**Mensagem central:** *O dado público que poderia orientar o produtor já existe — mas não chega a ele, e o técnico que poderia levá-lo
atende pouquíssimos. O AgroBits transforma esse dado em um caso pronto, e leva o técnico até quem nunca teve um.*

**Avaliação da estrutura proposta:** a ordem PROBLEMA → CONTEXTO → DADOS → SOLUÇÃO → COMO FUNCIONA → IMPACTO → DIFERENCIAL está certa.
Dois ajustes:
- **Dados em 3–4 min é demais se for só "dados".** Proposta: ~3 min para problema + paradoxo + dados juntos; os dados aparecem como
  *o caminho do dado até o caso*, não como lista de bases.
- **Diferencial dentro da solução**, não no fim: o diferencial (não decide; leva ao técnico com o caso pronto) é a própria virada da história.
- **A frase-manifesto** funciona melhor como **virada** (logo depois do problema + dados, antes da demo) e **repetida no encerramento**.
  Abrir com ela gastaria o impacto antes de a banca entender o problema.

| # | Tempo | Slide | O que aparece | O que falar (essência) |
|---|---|---|---|---|
| 1 | 0:00–0:30 | **1 em 5** | 5 silhuetas de propriedade; só 1 acende. "20,1%" grande. Fonte no rodapé | "No último Censo Agropecuário, só 1 em cada 5 estabelecimentos rurais do Brasil recebeu orientação técnica. Os outros 4 decidem sozinhos quando plantar, o que aplicar, como lidar com o clima." |
| 2 | 0:30–1:10 | **E está piorando onde mais falta** | Barra 2006 22% → 2017 20,1%; governo 491.607 → 388.077 (−21%); mapa do Brasil por região: NE 8,2% · N 10,4% · SE 28,6% · CO 23,6% · S 48,6% | "A assistência pública encolheu 21% em 11 anos. No Nordeste, menos de 1 em 10 recebe. E são 13,7 mil extensionistas públicos para 3,9 milhões de estabelecimentos familiares." |
| 3 | 1:10–1:40 | **O paradoxo** | Um CSV gigante rolando (Zarc: 1.951.698 linhas) ao lado de um celular vazio | "Ao mesmo tempo, o governo publica dados que respondem a essas perguntas. O Zarc diz, para cada município, cultura e solo, o risco de perder a lavoura se plantar em cada data. São quase 2 milhões de linhas. Nenhum produtor vai abrir isso." |
| 4 | 1:40–2:50 | **Como o dado vira decisão** | Diagrama animado em camadas (isométrico): Localização (IBGE) + Talhão e cultura (o produtor) → Risco (Zarc) · Clima (Open-Meteo, NASA POWER) · Insumos (Agrofit) · Região (SIPEAGRO, PSR, ANA) → 7 regras → assunto → caso. Funil: **2.044.825 → 6.302 → 7** | "Cruzamos 9 fontes abertas com o que o produtor conta: onde fica, o que planta, que solo tem. Para o João, em Araraquara, 2 milhões de registros viram 6 mil que importam, e 7 assuntos que ele entende." |
| 5 | 2:50–3:00 | **Vídeo (10 s)** | Peça de produto (ver §Vídeo) | (silêncio) |
| 6 | 3:00–3:25 | **Manifesto** | Tela limpa, só a frase | "O AgroBits não substitui o agrônomo. Ele leva o agrônomo até quem nunca teve um." + "Ele não decide: entende a roça, explica o dado e encaminha o caso." |
| 7 | 3:25–4:55 | **Demo (90 s)** | Ao vivo (com gravação de reserva): João → assunto do milho → risco 40% → 20% a partir de 21/10 → caminhos → enviar caso → caso respondido | Narrar só o que o produtor vê; nada de código. |
| 8 | 4:55–5:35 | **O que o técnico recebe** | Antes × depois: "visita às cegas" vs. caso com talhão, cultura, área, solo, risco Zarc por data, chuva prevista e × normal, fontes com data, caminho preferido, foto/nota | "O técnico chega sabendo. Faz triagem à distância e vai até a propriedade quando precisa. Mais produtores por técnico — é isso que queremos medir com a CATI." |
| 9 | 5:35–6:05 | **Impacto (ODS)** | 3 ODS com 1 linha cada | ver §ODS |
| 10 | 6:05–6:45 | **Como construímos** | Esquerda: 6 pessoas + papéis, GitHub (main + branch), 22 decisões registradas com aprovação humana, checkpoints. Direita: faixa Dados abertos → Python → SQLite → FastAPI (regras + IA com ferramentas) → React mobile | "A tecnologia serviu a uma regra: nenhum número inventado. Todo dado tem fonte e data; fonte fora do ar, a tela avisa." |
| 11 | 6:45–7:00 | **Fechamento** | Logo + frase + próximo passo | "Próximo passo: piloto com uma Casa da Agricultura. O AgroBits leva o agrônomo até quem nunca teve um." |

Margem de ~1 min para transições, demo e perguntas rápidas.

### ODS (no máximo 3)
- **ODS 2 — Fome Zero e Agricultura Sustentável.** Meta 2.3 (produtividade e renda do pequeno produtor, acesso a conhecimento) e meta 2.a
  (cita explicitamente *serviços de extensão rural*). É o alvo direto.
- **ODS 13 — Ação contra a mudança do clima.** Meta 13.1 (resiliência e adaptação a riscos climáticos): o Zarc é literalmente risco climático
  por data de plantio; chuva prevista e anomalia de chuva entram em todo caso.
- **ODS 10 — Redução das desigualdades.** A cobertura vai de 8,2% (Nordeste) a 48,6% (Sul): levar o caso pronto ao técnico ataca essa diferença.
  *Fora dos anexos; sugestão minha. Alternativa: ODS 9 (inovação), que é verdadeiro mas descreve o meio, não o impacto.*
- Ficam de fora: 8, 12, 15, 17 — relação real, mas indireta ou sem evidência no que construímos.

### Vídeo (10 s) — conceito (prompt final só depois de conversar)
- **Onde:** slide 5, entre os dados e o manifesto. É a virada emocional: do "dado que não chega" para "o caso que chega".
- **Storyboard:** 0–3 s amanhecer numa roça pequena; produtor olha o céu e o celular. 3–7 s camadas de dados (mapa, chuva, satélite)
  sobem do chão como blocos isométricos verdes e se juntam num único cartão no celular: "caso enviado". 7–10 s um técnico recebe o cartão
  no carro/escritório e segue para a estrada de terra; cartela final AgroBits + "dado público, trabalhando para cada talhão".
- Sem pessoas reais, sem marcas de terceiros, sem interface falsa de órgão público.

## C — Validação dos dados

| Afirmação | Número | Fonte | Situação |
|---|---|---|---|
| Estabelecimentos que receberam orientação técnica | **20,1%** (2017) · 22% (2006) | IBGE, Censo Agropecuário 2017, apresentação dos resultados definitivos (Agência IBGE) | ✅ conferido no PDF oficial |
| Total de estabelecimentos / que receberam | 5.073.324 / 1.025.443 | IBGE 2017 (tabela reproduzida pela Asbraer, Câmara dos Deputados, 2023) | ✅ coerente (1.025.443 ÷ 5.073.324 = 20,2%) |
| Orientação vinda de órgãos de governo | 491.607 (2006) → 388.077 (2017), −21% | IBGE, mesma apresentação | ✅ conferido |
| Só pública, sobre o total | 7,6% (388.077 ÷ 5.073.324) | cálculo da equipe sobre IBGE | ✅ dizer "cálculo nosso" |
| Agricultura familiar | 3.897.408 estab. (76,8%); 18,2% receberam; 307.167 pública | IBGE 2017 via Asbraer 2023 | ⚠️ secundária; conferir no SIDRA se der tempo |
| Cobertura por região | N 10,4% · NE 8,2% · SE 28,6% · S 48,6% · CO 23,6% | IBGE 2017 via Asbraer 2023 | ⚠️ secundária |
| Extensionistas públicos | 13.690 (2.420.485 beneficiários) | Asbraer, apresentação na Câmara, 2023 | ⚠️ dado institucional da Asbraer, citar assim |
| "~285 estabelecimentos familiares por extensionista" | 3.897.408 ÷ 13.690 | cálculo da equipe | ⚠️ mistura anos (2017 × 2023) e ignora ATER privada: usar só se dito com essa ressalva; preferível citar os dois números lado a lado |
| Produtores que não sabem ler e escrever | 23% | IBGE 2017 | ✅ |
| Analfabetos que usaram agrotóxico sem orientação | 89% | IBGE 2017 | ✅ forte, sensível; opcional |
| Produtores com internet | 1.430.156 (2017) | IBGE 2017 | ✅ prepara a resposta sobre inclusão digital |
| Registros oficiais no AgroBits | 2.044.825 (Zarc 1.951.698 · Agrofit 39.500 · PSR 44.979 · SIPEAGRO 8.648) | nosso banco, bases do MAPA conferidas em 02/10 | ✅ |
| Funil do João | 2.044.825 → 6.302 → 7 | `/api/opendata/funnel` | ✅ (muda se as bases mudarem) |
| Pivôs perto de Araraquara | 5 → 36 (1985 → 2019), raio 50 km | ANA/Embrapa, SNIRH | ✅ |
| "Apenas 20%" como "4 em cada 5 **nunca** tiveram" | — | — | ❌ o Censo mede se recebeu orientação **no período de referência**; dizer "não receberam", não "nunca tiveram" (a frase-manifesto pode manter "nunca teve" como figura de linguagem) |
| Ganho de produtividade do técnico | — | — | ❌ não temos; apresentar como hipótese do piloto |
| Prazos de resposta (5 dias etc.) | — | dados de exemplo da demo | ❌ não citar |

Como mostrar o 20%: "Em 2017, **20,1%** dos estabelecimentos agropecuários **declararam ter recebido orientação técnica** (IBGE, Censo Agro 2017)."
Visual "1 em 5" é fiel ao número.

## D — Direção visual
- **Identidade:** a do app. Verde AgroBits #2E7D4F, quase-preto #0F1A13 (fundo), ocre #9A6516 para o que **falta**, papel #F7F5EF. Logo e cubos isométricos de `docs/brand/`.
- **Tipografia:** Montserrat 800 nos números e títulos (números de 160–240 px), Inter no texto. No máximo 12 palavras por slide, fora a fonte.
- **Composição:** 16:9 em 1920×1080 com escala automática; um número ou uma ideia por slide; fonte sempre no rodapé, discreta mas legível (≥ 18 px).
- **Gráficos:** uma cor + um destaque (ocre = o que falta); sem eixos supérfluos; SVG feito à mão; números contam até o valor ao entrar.
- **Mapas:** Brasil por região em tons de verde (cobertura de ATER), contorno IBGE; Araraquara com os 3 talhões reais do João sobre o município.
- **Fluxo das bases:** pilha isométrica — cada base é uma camada que desce sobre o talhão; o funil 2.044.825 → 6.302 → 7 encolhe na tela.
- **Movimento:** entradas de 300–500 ms com ease-out, uma por clique (fragments); transição entre slides só fade/deslize curto; nada que pisque.
- **Fundo:** escuro na maior parte (alto contraste no projetor); o slide do manifesto em papel claro, para marcar a virada. Confirmar a sala.

## E — Estrutura técnica (recomendação)
- **Repositório:** recomendo **pasta `pitch/` neste mesmo repositório**, não um repositório novo:
  a entrega é "repositório + PDF" (privado), a banca vê tudo num lugar, e os números saem do próprio app por script, sem sincronizar à mão.
  Repositório separado só compensa se quiserem **link público** (GitHub Pages em repo privado exige plano pago). Alternativa ao link público:
  publicar o HTML como página privada compartilhável.
- **Biblioteca:** **Reveal.js** (vendorizado, funciona sem internet): navegação por teclado, fragments, escala 16:9, tela cheia, **notas do
  apresentador com cronômetro (tecla S)** e exportação para PDF. Gráficos em SVG puro; sem framework (HTML/CSS/JS).
- **Estrutura:**
  ```
  pitch/
  ├── README.md            como apresentar, atalhos, como exportar o PDF
  ├── index.html           os slides (com notas do apresentador)
  ├── css/theme.css        identidade AgroBits
  ├── js/deck.js           inicialização + animações (contadores, funil, mapa)
  ├── vendor/reveal/       Reveal.js local
  ├── assets/
  │   ├── fonts/           Montserrat, Inter (woff2 locais)
  │   ├── img/             logo, cubos, capturas do app
  │   ├── video/promo.mp4  vídeo de 10 s
  │   └── geo/             regiões do Brasil e Araraquara (IBGE, simplificados)
  ├── data/numbers.json    números do app, gerados
  ├── data/fontes.md       cada número com fonte e data
  ├── scripts/
  │   ├── export_numbers.py   lê data/opendata.db e a API → numbers.json
  │   └── export_pdf.py       Playwright → dist/AgroBits-pitch.pdf
  └── dist/AgroBits-pitch.pdf
  ```
- **Executar:** abrir `pitch/index.html` (ou `python -m http.server` dentro de `pitch/`); `F` tela cheia, `S` notas, `→` avança.
- **PDF:** `python pitch/scripts/export_pdf.py` gera o PDF (um slide por página, animações no estado final). O vídeo vira um quadro estático.
- **Sincronia com o app:** os números vêm de `numbers.json` (gerado do app); capturas de tela regeradas pelo Playwright do `tests/`.
