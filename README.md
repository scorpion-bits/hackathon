# 🌱 AgroBits — o dado público que já existe, trabalhando para cada talhão

**1ª Hackathon de Dados Abertos · IFSP Araraquara · 02–03/10/2026**
Tema: Inteligência Artificial e/ou Robótica Agrícola aplicada a Dados Abertos na área da Agricultura.

AgroBits é uma plataforma web de **gestão da propriedade rural** (mapa de talhões, produção, estoque, clima, alertas,
relatórios) em que uma **IA interpreta dados abertos oficiais do MAPA** para a realidade de cada talhão — sempre com
fonte e data. Gratuita para o pequeno e médio produtor; cooperativas, assistência técnica e agentes de crédito/seguro
são os clientes pagantes (B2B2C).

## Dados abertos usados
| Base | Órgão | Uso no produto |
|---|---|---|
| Zarc — Tábua de Risco (safras 2025-26, 2026-27) | MAPA | Risco climático por talhão (36 decêndios), Planejador de plantio, alertas |
| Agrofit — Produtos formulados | MAPA | Checagem de defensivos do estoque (registro p/ cultura, classes tóxica/ambiental) |
| SIPEAGRO — Aviação agrícola (agregado) | MAPA | Drones/aviões agrícolas por município ("Minha região") |
| PSR — Seguro rural 2025 (agregado) | MAPA | Apólices por município ("Minha região") |
| Previsão do tempo | Open-Meteo (CC-BY 4.0) | Clima, alertas de chuva/frio, Planejador |

**Privacidade (LGPD):** as bases do MAPA com dado pessoal (nome, CPF parcial, e-mail, telefone, coordenadas de
propriedade) **não são publicadas** neste repositório (`data/restricted/`, fora do git) e só entram no produto
**agregadas por município**, com supressão de grupos com menos de 3 registros.
O produtor da demonstração (João, Sítio Boa Esperança) é **fictício** e rotulado como tal na interface.

## Como rodar com Docker (recomendado — não precisa instalar Python nem Node)
Requisito: Docker Desktop (Windows/Mac) ou Docker Engine + Compose (Linux).

```bash
docker compose up --build     # 1ª vez: baixa e instala tudo (~3–5 min); gera os bancos se faltarem
docker compose up             # das próximas vezes: sobe em segundos
```
- Protótipo: http://localhost:5173/prototipo · App: http://localhost:5173 · API: http://localhost:8000/docs
- `RESET=1 docker compose up` recria a propriedade de demonstração · `SYNC=1 docker compose up` confere o portal do MAPA
- `docker compose down` para tudo. Código e bancos ficam na sua pasta (`./data`): editar e salvar recarrega sozinho.
- Recarga não funciona no Windows/WSL? Use `POLLING=true docker compose up`.
- No Linux, os bancos criados pelo Docker ficam com dono root; se depois quiser usar o `./dev.sh`, rode `sudo chown -R $USER data`.

## Como rodar sem Docker (notebook da equipe)
Requisitos: Python 3.11+, Node 20+.

**Atalho (Linux/macOS/WSL):** `./dev.sh` faz tudo abaixo e sobe API + interface (Ctrl+C para parar).
`./dev.sh --proto` sobe só a interface (suficiente para `/prototipo`); `./dev.sh --reset` recria a demo;
`./dev.sh --sync` confere no portal do MAPA se alguma base mudou antes de subir.

**Dados sempre atuais:** `python scripts/fetch_opendata.py` consulta a API CKAN de dados.agricultura.gov.br,
compara o conteúdo (hash) e só baixa/reconstrói o que mudou; a data de conferência vira o selo "fonte + data".
Agendar diariamente: `0 6 * * * cd /caminho/hackathon && .venv/bin/python scripts/fetch_opendata.py >> data/sync.log 2>&1`.
Clima (Open-Meteo), chuva × normal (NASA POWER), contorno do município (IBGE) e camadas de satélite (NASA GIBS)
são consultados ao vivo, com cache para funcionar sem internet.

Passo a passo manual:

```bash
# 1) dados abertos → data/opendata.db  (~2 min, uma vez só)
pip install -r backend/requirements.txt
python scripts/pipeline_opendata.py

# 2) propriedade de demonstração → data/app.db  (rode de novo para "resetar" a demo)
python scripts/seed_demo.py

# 3) API  (http://localhost:8000/docs)
cd backend && uvicorn app.main:app --reload --port 8000

# 4) Interface  (http://localhost:5173) — em outro terminal
cd frontend && npm install && npm run dev
```

### IA (opcional — sem chave o assistente funciona em **modo offline**)
Qualquer provedor compatível com a API da OpenAI e com *tool calling*. Exemplo (Groq, camada gratuita):
```bash
export AGROIA_LLM_BASE_URL=https://api.groq.com/openai/v1
export AGROIA_LLM_API_KEY=...        # nunca commitar
export AGROIA_LLM_MODEL=openai/gpt-oss-120b   # ou outro modelo com tool calling
```
Gemini: `AGROIA_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai` · OpenRouter, Ollama Cloud: idem com a URL do provedor.
A IA **nunca inventa números**: consulta ferramentas determinísticas (talhões, estoque, custos, Zarc, clima, Agrofit,
região) e devolve as fontes usadas. Se o modelo falhar, cai automaticamente no modo offline.

### Testes
```bash
cd backend && pytest -q
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
