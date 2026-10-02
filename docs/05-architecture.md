# 05 — Arquitetura

> Status: ⏳ · Checkpoint alvo: CP5 · **Stack e arquitetura exigem aprovação humana**
> Princípio: a arquitetura mais simples que entrega a demo.

## Pré-análise de stacks (preparação — NÃO é decisão)

Opções levantadas antes do tema para acelerar a decisão. A escolha depende do problema,
do formato dos dados e do conhecimento da equipe (👥 H-002).

| Critério | A) Python + Streamlit | B) Python (FastAPI) + front estático/React | C) Front-only (Vite/React + dados pré-processados em JSON) |
|---|---|---|---|
| Velocidade p/ protótipo | 9 | 6 | 7 |
| Força em análise de dados | 10 | 9 | 5 |
| Qualidade visual / UX | 6 | 9 | 9 |
| Facilidade de deploy | 8 (Streamlit Cloud) | 5 (2 serviços) | 9 (GitHub Pages/Vercel) |
| Paralelismo entre 6 pessoas | 6 | 8 | 7 |
| Risco | baixo | médio | baixo |
| Bom quando… | foco em painel/análise exploratória | produto com interação rica + lógica no servidor | dados pequenos, foco em experiência, mapa/visual |

Pipeline de dados comum a todas: `data/raw` → script Python (pandas) → `data/processed`
(CSV/Parquet/JSON/SQLite) → aplicação lê apenas `processed`.

## Arquitetura escolhida
_pendente_

### Diagrama
```
[dados brutos] → [pipeline] → [dados processados] → [app] → [usuário]
```

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | | |
| Backend | | |
| Banco/armazenamento | | |
| Processamento | | |
| APIs/serviços externos | | |
| Autenticação | provavelmente nenhuma | |
| Visualização | | |
| Deploy | | |

### Estrutura de `src/`
```
src/
```

### Contratos entre módulos
_Formato dos dados processados / endpoints — permite trabalho paralelo._
