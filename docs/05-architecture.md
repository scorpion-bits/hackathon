# 05 — Arquitetura técnica: AgroIA

> Status: 🟡 **proposta — aguardando aprovação (H-006)** · Checkpoint: CP5
> Princípio: a arquitetura mais simples que entrega o MVP de `04-mvp.md` em ~20h, com 6 pessoas + agentes em paralelo.

## Visão geral

```
┌────────────────────── FRONTEND (navegador) ──────────────────────┐
│ Painel · Mapa · Produção · Estoque · Clima · Alertas · Relatórios │
│ Minha Região · Assistente IA · Perfil                             │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP/JSON (contrato em docs/api.md)
┌───────────────────────────────▼──────────────────────────────────┐
│ BACKEND (API)                                                    │
│  módulos: farm · fields · production · stock · costs · alerts    │
│           weather · opendata (zarc, agrofit, region) · assistant │
│  serviço de IA: orquestrador + ferramentas determinísticas       │
└──────┬───────────────────────┬───────────────────────┬───────────┘
       │                       │                       │
┌──────▼───────┐   ┌───────────▼───────────┐   ┌───────▼──────────┐
│ BANCO (app)  │   │ BANCO (dados abertos) │   │ Serviços externos│
│ talhões,     │   │ zarc_risk, agrofit,   │   │ previsão do tempo│
│ eventos,     │   │ region_stats          │   │ modelo de IA     │
│ estoque...   │   │ (gerado por pipeline) │   │                  │
└──────────────┘   └───────────▲───────────┘   └──────────────────┘
                               │ scripts/pipeline_*.py (Python)
                     data/raw (zips oficiais MAPA/ANA)
```

## Stack recomendada

| Camada | Escolha | Por quê | Alternativa considerada |
|---|---|---|---|
| Frontend | **React + TypeScript + Vite** | Rápido p/ prototipar, muitos componentes prontos, agentes produzem bem | Next.js (SSR desnecessário; mais conceitos) |
| UI | **Tailwind CSS + shadcn/ui** + ícones Lucide | Identidade única e consistente com pouco esforço | MUI (visual mais "genérico") |
| Gráficos | **Recharts** | Simples, suficiente para relatórios/painel | ECharts |
| Mapa | **Leaflet + Leaflet-Geoman** (desenho/edição por vértices) + **Turf.js** (área) + base OSM/satélite Esri | Gratuito, sem chave, maduro | MapLibre (mais pesado de configurar) |
| Backend | **Python + FastAPI** | Mesmo idioma dos pipelines de dados (pandas); docs automáticas da API (/docs) | Node (duplicaria a parte de dados) |
| Banco | **SQLite** (arquivo) via SQLAlchemy; geometria como GeoJSON | Zero infraestrutura, roda em qualquer notebook do lab, fácil de resetar p/ demo | PostgreSQL/PostGIS (infra e tempo; não precisamos de consulta espacial pesada) |
| IA | Orquestrador próprio com **tool calling**, provedor plugável (interface única) | Trocar de modelo sem reescrever; testes com modelo falso | LangGraph (curva + tempo) |
| Modelo de IA | **👥 decisão da equipe** (custo é da equipe): ver opções abaixo | — | — |
| Clima | **Open-Meteo** (previsão por lat/lon, sem chave, CC-BY 4.0) | Grátis, estável, sem cadastro | INMET API (instável/menos documentada) |
| Deploy | **Local no notebook da apresentação** (+ deploy opcional se sobrar tempo) | Elimina risco de rede/hospedagem | Vercel + Render |

### Modelo de IA — opções (👥 H-014)
| Opção | Custo | Tool calling | Risco |
|---|---|---|---|
| Ollama Cloud (sugerido no doc do Victor) | plano/limites a confirmar | depende do modelo (gpt-oss) | médio |
| Google Gemini (Flash) — camada gratuita | grátis com limites | bom | baixo/médio (limites) |
| Groq (modelos abertos) — camada gratuita | grátis com limites | bom | baixo/médio |
| Anthropic Claude Haiku | pago por uso (centavos na demo) | excelente | baixo |
| Ollama local | grátis | fraco em máquina modesta | alto (lab) |

Requisito mínimo: **tool calling confiável em português**. O código terá um "modelo falso" para testes sem rede/custo.
⚠️ O ambiente do Claude (nuvem) **não acessa APIs externas** → testes reais com o modelo rodam nos notebooks da equipe.

## Base compartilhada (modelo de dados) — ⚠️ decisão estratégica, não mudar depois de aprovada

```
producer ─1:N─ farm ─1:N─ field (talhão: geometria, área, cultura, solo, irrigação)
                 │            │
                 │            └─1:N─ event (plantio | aplicação | colheita | observação | outro)
                 │                       │ data, safra, descrição, detalhes, origem (manual|ia)
                 │                       └─0:N─ stock_movement (saída vinculada ao evento)
                 ├─1:N─ season (safra 2025/26, 2026/27)
                 ├─1:N─ stock_item (categoria, unidade, mínimo, validade, fornecedor, nº Agrofit opcional)
                 │            └─1:N─ stock_movement (entrada | saída | ajuste; quantidade, preço unitário, data)
                 ├─1:N─ alert (tipo, gravidade, título, motivo, talhão/item, lido)
                 └─1:N─ profile_fact (chave, valor, origem: declarado|registro|oficial)
```
- **Quantidade em estoque** = soma das movimentações (nunca editada à mão).
- **Custo** = entradas (compras: qtd × preço) e consumo (saídas × preço médio) por safra/talhão/categoria — sempre calculado.
- **Situação do talhão** = calculada a partir do último plantio/colheita (ex.: "milho · 23 dias após plantio").
- Unidades do campo: kg, saco (com kg/saco), L, t, un; área em ha.

### Dados abertos (somente leitura, gerados por pipeline)
| Tabela | Origem | Conteúdo |
|---|---|---|
| `zarc_risk` | Zarc safras 2025-26 e 2026-27 | geocódigo × cultura × ciclo × solo × manejo → 36 decêndios |
| `agrofit` | Agrofit formulados | produto × cultura × praga → classes toxicológica/ambiental |
| `region_stats` | SIPEAGRO Aviação + PSR 2025 (agregados) + Zarc | por município: drones, aviões, autorizações/ano, apólices por cultura, culturas zoneadas |
| `data_sources` | manual | nome, órgão, URL, data de extração, licença → alimenta os **selos de fonte** |

## Serviço de IA
- **Orquestrador**: recebe pergunta + contexto da tela (ex.: alerta aberto) → modelo escolhe ferramentas → executa → modelo redige.
- **Ferramentas** (determinísticas, testáveis): `farm_overview`, `get_field`, `field_timeline`, `get_stock`, `get_costs`,
  `get_zarc_for_field`, `get_weather`, `check_agrofit`, `region_stats`, `draft_record` (só rascunho; gravação exige confirmação na interface).
- **Resposta** = texto + lista de fontes usadas (ferramenta, base, data) → **cartão de fontes**.
- Regras no prompt: não inventar números; separar observado/previsto/oficial/declarado; sem diagnóstico/receita → agrônomo; pedir dado faltante.
- Bateria de 10 perguntas-teste com respostas esperadas (`tests/assistant_cases`).

## Alertas (regras documentadas, calculadas no backend)
| Tipo | Regra | Gravidade |
|---|---|---|
| Estoque baixo | quantidade < mínimo do item | atenção |
| Validade | vence em ≤ 30 dias / vencido | atenção / crítico |
| Zarc | plantio registrado em decêndio com risco ≥ 30% ou fora da janela | atenção / crítico |
| Clima | chuva prevista ≥ 50 mm/dia ou temp. mín. ≤ 3 °C nos próximos 7 dias | atenção |

## Atualização dos dados (resposta à dúvida da equipe)
| Tipo de dado | Como atualiza | No hackathon |
|---|---|---|
| Dados do produtor (talhões, eventos, estoque) | **Automático** — gravados pelo próprio sistema quando o usuário (ou a IA, com confirmação) registra | ✅ automático |
| Painel, custos, situação, alertas | **Calculados na hora** a partir da base | ✅ automático |
| Clima | Consulta à API a cada acesso, com cache de 1h | ✅ automático (precisa internet) |
| Zarc, Agrofit, SIPEAGRO, PSR (arquivos oficiais) | Pipeline: baixar zip → `python scripts/pipeline_opendata.py` → tabelas | ⚙️ roda **1 vez** (já temos os arquivos) |
| (Produção futura) | Tarefa agendada diária/semanal baixa do portal e roda o pipeline | 📋 roadmap (Zarc é atualizado diariamente pelo MAPA; SIPEAGRO semanalmente) |

## Estrutura do repositório
```
backend/   app/ (main, models, schemas, routers/, services/, assistant/, opendata/) · tests/
frontend/  src/ (layout, pages/, components/, lib/api.ts, theme) 
scripts/   pipeline_opendata.py · seed_demo.py · aggregate_sipeagro_aviacao.py · profile_data.py
data/      raw/ (oficiais) · restricted/ (fora do git) · processed/ · app.db (gerado, fora do git)
docs/      api.md (contrato) · 0x-*.md
```

## Contratos e paralelismo
1. **Primeiro (até ~13h30):** modelo de dados + `docs/api.md` + esqueleto backend/frontend + tema visual → congelados.
2. Depois disso cada módulo é independente (tela ↔ endpoints próprios), permitindo trabalho paralelo.
3. Dados de demonstração (`seed_demo.py`) recriam o banco do zero em 1 comando → demo sempre reproduzível.

## Como rodar (previsto)
```bash
python scripts/pipeline_opendata.py && python scripts/seed_demo.py
cd backend && uvicorn app.main:app --reload        # API em :8000 (/docs)
cd frontend && npm install && npm run dev          # app em :5173
```
