# 🌱 AgroBits — o dado público que já existe, trabalhando para cada talhão

**1ª Hackathon de Dados Abertos · IFSP Araraquara · 02–03/10/2026**
Tema: Inteligência Artificial e/ou Robótica Agrícola aplicada a Dados Abertos na área da Agricultura.

O AgroBits cruza **dados abertos oficiais** (MAPA, ANA/Embrapa, IBGE, NASA, Open-Meteo) com o **contexto do produtor**
(município, talhões, culturas, solo declarado) e mostra, um assunto por vez, o que os dados dizem sobre a roça dele.
**A IA não decide:** mostra os dados e os caminhos possíveis e **leva o caso, já organizado, à assistência técnica
pública** (CATI, Senar, prefeitura), de graça para o produtor.

## Dados abertos usados
| Base | Órgão | Como entra | Uso no produto |
|---|---|---|---|
| Zarc — Tábua de Risco (safras 2025-26 e 2026-27) | MAPA | arquivo (CKAN), banco local | risco de perda pelo clima por talhão e data de plantio |
| Agrofit — Produtos formulados | MAPA | arquivo (CKAN), banco local | confere se os defensivos do estoque são registrados para a cultura |
| SIPEAGRO — Aviação agrícola (agregado por município) | MAPA | arquivo (CKAN), banco local | operadores de drone/avião no município |
| PSR — Seguro rural 2025 (agregado por município) | MAPA | arquivo (CKAN), banco local | apólices com subvenção no município |
| Pivôs centrais 1985–2019 | ANA / Embrapa | API ArcGIS (SNIRH), ao vivo + cache | pivôs no município e vizinhos (50 km) |
| Previsão do tempo (16 dias) | Open-Meteo (CC-BY 4.0) | API, ao vivo + cache | chuva forte prevista, gráfico de 7 dias |
| Chuva 30 dias × normal | NASA POWER | API, ao vivo + cache | "está mais seco/chuvoso que o normal?" |
| Imagens de satélite | NASA GIBS | tiles no navegador | vegetação, temperatura, chuva, umidade, fogo (Mapa vivo) |
| Malha municipal | IBGE | API, ao vivo + cache | contorno do município no mapa |

As bases do MAPA são conferidas no portal (hash) por `scripts/fetch_opendata.py`; a data aparece na tela como "fonte + data".

**Privacidade (LGPD):** as bases do MAPA com dado pessoal (nome, CPF parcial, e-mail, telefone, coordenadas de
propriedade) **não são publicadas** neste repositório (`data/restricted/`, fora do git) e só entram no produto
**agregadas por município**, com supressão de grupos com menos de 3 registros.

**O que é real e o que é demonstração:**
- **Real (sempre consultado na fonte):** tudo da tabela acima. Fonte fora do ar → a tela avisa ("dado real de <data>" ou "indisponível"); nunca preenche com exemplo.
- **Demonstração (dado de conta):** o João, o sítio, talhões, estoque, casos e a resposta do técnico (simulada), sempre com o selo "conta de demonstração". As instituições (CATI, Senar, prefeitura) são exemplo de integração, sem convênio.
- Roteiro de 3 min: `docs/demo/roteiro.md` · teste ponta a ponta: `python3 tests/e2e_demo.py` (com o app rodando).

---

# Como executar

Escolha **um** caminho:

| Seu computador | Caminho recomendado |
|---|---|
| Windows com Docker Desktop | [A — Docker (Windows)](#a--docker-windows-ou-linux) |
| Linux / macOS / WSL, com ou sem Docker | [B — `./iniciar.sh`](#b--linux-macos-ou-wsl-iniciarsh) (sem sudo) |
| Windows **sem** Docker | [C — manual](#c--manual-windows-sem-docker-ou-qualquer-sistema) |

Na primeira vez, todos os caminhos levam **3–5 min** (instalam dependências e geram o banco de dados abertos a partir de
`data/raw/`); depois sobem em segundos. É preciso **internet** na primeira vez (dependências) e para os dados ao vivo
(clima, NASA, ANA, IBGE). Sem internet, o app funciona com as bases locais do MAPA e com o último dado guardado, com data.

## Configuração da IA — já vem pronta para a avaliação
**Não é preciso configurar nada.** O repositório (privado) traz o arquivo **`.env.avaliacao`** com uma chave de IA
(Groq, modelo `openai/gpt-oss-120b`) **criada só para a avaliação da hackathon**; ela será revogada ~3 dias depois do evento.
Os scripts de subir (`iniciar.*`, `dev.sh`) copiam esse arquivo para `.env` quando ainda não existe um `.env`; o Docker e a
API também o leem direto. Ao subir, o terminal mostra **"IA: ligada (openai/gpt-oss-120b)"**.

- **Por que está no repositório:** para a banca rodar o projeto sem cadastro em nenhum serviço. Nenhuma outra credencial
  está versionada; o `.env` (sua chave pessoal) continua no `.gitignore`.
- **Se a chave já tiver sido revogada:** o app funciona igual em **modo offline** — o assistente responde com os mesmos dados
  reais e as mesmas regras, só sem o modelo de linguagem. Nada mais depende da chave.
- **Usar a sua própria chave:** crie a chave em https://console.groq.com → **API Keys**, copie `.env.example` para `.env`
  (`cp .env.example .env`; Windows: `copy .env.example .env`) e preencha `AGROBITS_LLM_API_KEY`. O `.env` tem prioridade
  sobre o `.env.avaliacao`. Gemini e OpenRouter também funcionam (exemplos no `.env.example`).

| Variável | Para quê | Padrão |
|---|---|---|
| `AGROBITS_LLM_BASE_URL` | endereço do provedor de IA | — (sem ela: modo offline) |
| `AGROBITS_LLM_API_KEY` | chave do provedor | — (sem ela: modo offline) |
| `AGROBITS_LLM_MODEL` | modelo com tool calling | — |
| `AGROIA_APP_DB` / `AGROIA_OPENDATA_DB` | outro caminho para os bancos | `data/app.db` / `data/opendata.db` |
| `AGROIA_WEATHER_FIXTURE` | clima simulado **só para teste automatizado** — nunca na demo | desligado |

## A — Docker (Windows ou Linux)
Requisito: **Docker Desktop** aberto (Windows/macOS) ou Docker Engine + Compose (Linux), e **Git**.

```bash
git clone https://github.com/scorpion-bits/hackathon.git
cd hackathon
```
- **Windows:** dois cliques em **`iniciar.bat`** (ou, no PowerShell, `.\iniciar.ps1`).
- **Linux:** `./iniciar.sh`

O script prepara os containers, espera a API e a interface responderem e abre o navegador.

| Ação | Windows | Linux / macOS / WSL |
|---|---|---|
| Subir tudo e abrir o navegador | `iniciar.bat` | `./iniciar.sh` |
| Atualizar o código e subir | `iniciar.bat atualizar` | `./iniciar.sh atualizar` |
| Voltar a demonstração ao estado inicial | `iniciar.bat resetar` | `./iniciar.sh resetar` |
| Conferir o portal do MAPA | `iniciar.bat sincronizar` | `./iniciar.sh sincronizar` |
| Ver logs / parar | `iniciar.bat logs` · `iniciar.bat parar` | `./iniciar.sh logs` · `./iniciar.sh parar` |

Docker sem os scripts: `docker compose up --build` (1ª vez) · `docker compose up` · `docker compose down`.
`RESET=1 docker compose up` recria a demonstração. Recarga ao salvar não funciona no Windows? `POLLING=true docker compose up`.
No Linux, os bancos criados pelo Docker ficam com dono root; antes de usar o `./dev.sh`, rode `sudo chown -R $USER data`.

## B — Linux, macOS ou WSL (`./iniciar.sh`)
Requisitos: Git e `curl` (ou `wget`). Python e Node **não precisam estar instalados**.

```bash
git clone https://github.com/scorpion-bits/hackathon.git
cd hackathon
./iniciar.sh            # usa Docker se houver; senão sobe pelo ./dev.sh, sem sudo
```
Sem Docker, o `./dev.sh` usa o Python ≥ 3.10 e o Node ≥ 20 da máquina; se faltarem, baixa versões portáteis
(`uv` e Node 22) para `.tools/`, sem sudo. Ele cria o `.venv`, instala as dependências, gera `data/opendata.db`,
cria as contas de demonstração e sobe API + interface. Ctrl+C para tudo.
Opções: `./dev.sh --reset` (demonstração do zero) · `./dev.sh --sync` (confere o portal do MAPA) · `./iniciar.sh sem-docker` (força o modo sem Docker).

## C — Manual (Windows sem Docker, ou qualquer sistema)
Requisitos: **Python 3.11+** (no instalador do Windows, marque *Add python.exe to PATH*), **Node.js 20+** e **Git**.

Terminal 1 — API:
```powershell
git clone https://github.com/scorpion-bits/hackathon.git
cd hackathon
python -m venv .venv
.venv\Scripts\activate                      # Linux/macOS: source .venv/bin/activate
pip install -r backend/requirements.txt
python scripts/pipeline_opendata.py          # gera data/opendata.db (~2 min, só na 1ª vez)
python scripts/seed_demo.py                  # contas de demonstração (data/app.db)
cd backend
uvicorn app.main:app --port 8000             # a API lê o .env (ou o .env.avaliacao) sozinha
```
Terminal 2 — interface:
```powershell
cd hackathon/frontend
npm install
npm run dev -- --port 5173
```

## Acessar
| O quê | Endereço |
|---|---|
| **AgroBits** | http://localhost:5173 |
| Documentação da API | http://localhost:8000/docs |
| App antigo (primeira versão) | http://localhost:5173/legado |

Na tela de entrada:
- **"Entrar como João (demo)"**: sítio fictício em Araraquara/SP com 3 talhões, estoque e casos. Volta ao estado inicial a cada entrada (login manual: `joao@demo.agrobits` / `demo1234`).
- **"Experimentar como novo usuário"**: conta vazia → entrevista (município, talhões desenhados no mapa, culturas) → assuntos calculados com os dados reais do município escolhido.
- **"Criar conta"**: cadastro de verdade (senha guardada só como hash).

No celular (mesma rede Wi-Fi): `http://<IP do computador>:5173`.

## Problemas comuns
| Sintoma | Solução |
|---|---|
| Porta 5173 ou 8000 ocupada | feche o outro programa ou `./iniciar.sh parar` / `iniciar.bat parar` |
| "Servidor fora do ar" na tela | a API não subiu: veja o terminal 1 (caminho C) ou `iniciar.* logs` |
| A primeira tela demora | o 1º cálculo dos assuntos consulta clima, NASA e ANA ao vivo; as próximas usam o cache |
| Previsão "indisponível" | sem internet ou a fonte caiu; o app mostra o último dado guardado com data, nunca inventa |
| Demo bagunçada | `iniciar.* resetar` (ou `python scripts/seed_demo.py`) |
| "IA: modo offline" | a chave da avaliação foi revogada ou o `.env` está sem chave: o app segue funcionando; para ligar, use a sua chave (acima) |

## Atualizar os dados abertos
`python scripts/fetch_opendata.py` consulta a API CKAN de dados.agricultura.gov.br, compara o conteúdo (hash) e só
baixa/reconstrói o que mudou. Agendar diariamente (Linux):
`0 6 * * * cd /caminho/hackathon && .venv/bin/python scripts/fetch_opendata.py >> data/sync.log 2>&1`.
A IA **nunca inventa números**: consulta ferramentas determinísticas (talhões, Zarc, clima, Agrofit, região) e devolve as fontes usadas.

## Testes
```bash
cd backend && pytest -q            # 39 testes da API
python3 tests/e2e_demo.py          # ponta a ponta (Playwright), com o app rodando
```

## Estrutura
```
backend/   API FastAPI (app/routers, app/services, app/assistant) + testes
frontend/  React + TypeScript + Vite + Tailwind + Leaflet/Geoman
scripts/   pipeline_opendata.py · seed_demo.py · aggregate_sipeagro_aviacao.py · profile_data.py
data/      raw/ (bases oficiais) · processed/ (agregados anônimos) · restricted/ (fora do git)
docs/      contexto, problema, dados, solução, MVP, arquitetura, decisões, testes, pitch
planning/  tarefas, riscos, cronograma, agentes
```

## Equipe
Thales Miguel Hajes · Milan Bahrami · Fernando · Maria · Victor Ricardo · Christian — com Claude (orquestrador técnico).
