# Plano de implementação — MVP real do AgroBits

> **Comece por aqui depois de um `/clear`.** Leia este índice e **só** o arquivo da etapa em andamento (`M1-...md`).
> Atualizado em 02/10 ~20h. Prazo: congelamento 03/10 **08h** · entrega 09h (BRT).
> **É um MVP de hackathon:** tem que funcionar de verdade no roteiro da demo, sem ser completo nem "o melhor do mundo".
> Na dúvida, escolha a solução mais simples que respeite as regras de dados abaixo.

## 1. Contexto em poucas linhas
- O **protótipo visual** (`/prototipo`, React) foi validado pela equipe. Hoje ele usa dados fixos (`frontend/src/prototype/mock.ts`,
  `resolve.ts`, `farmStore.ts`). Agora as telas passam a usar o **backend real** (FastAPI + SQLite em `backend/app/`), que já tem os
  serviços de dados abertos: Zarc, Agrofit, SIPEAGRO, PSR, Open-Meteo, NASA POWER e IBGE.
- Produto (não mudar sem aprovação):
  - dados abertos no centro; a entrevista dá o contexto do produtor;
  - **a IA não decide**: mostra os dados oficiais e os "caminhos possíveis", e **leva o caso à assistência técnica pública gratuita** (D-015);
  - mobile first (D-016); visual isométrico (D-014). **O visual do protótipo não muda.**

## 2. Regras de dados (aprovadas pela equipe em 02/10 ~20h — D-022)
1. **Dado de fonte aberta ou externa é sempre real**, consultado na fonte: clima, previsão, geografia, Zarc, Agrofit, SIPEAGRO, PSR,
   IBGE, NASA, ANA. **Proibido inventar ou deixar fixo no código** um número que deveria vir de uma fonte.
2. **Fonte indisponível → dizer isso na tela**, nunca preencher com exemplo. Pode-se mostrar a **última resposta real guardada, com data e hora**
   (`live.cached_json` já faz isso: status `live|cache|stale|offline`) — ex.: "dado real de 02/10 21h; fonte fora do ar agora".
   Sem nenhuma resposta guardada → "indisponível no momento", e o assunto daquela fonte não aparece.
3. **Pode ser fictício só o que é dado de conta:** nome, propriedade, talhões, estoque, histórico, casos e respostas do técnico (D-019).
   Sempre com o selo **"conta de demonstração"**.
4. **Uma arquitetura só:** a conta demo é uma conta comum com `is_demo=True`, carregada de **fixtures**
   (`backend/app/fixtures/demo/*.json`) para as **mesmas tabelas**. O código das telas e das regras **não distingue** demo de real.
   Dados abertos são consultados **pela localização** da conta (código do município no IBGE, coordenada, polígono), então uma conta demo em Araraquara recebe
   os dados reais de Araraquara.
5. **Solo:** declarado pelo produtor (rótulo "declarado"); a textura vira a classe do Zarc. Não há fonte aberta de solo nesta fase.
6. `AGROIA_WEATHER_FIXTURE` (clima simulado) é só para teste automatizado. **Nunca** em `dev.sh`, Docker ou na demo.
7. Nenhum nome de pessoa real. Instituições (CATI, Senar, prefeitura) aparecem como **exemplo de integração**.

## 3. Cenários de demonstração (aprovados)
| Cenário | Como entra | O que vê |
|---|---|---|
| **Conta nova** | cadastro de verdade (nome, contato, senha com hash) **ou** o botão "Experimentar como novo usuário" (cria uma conta vazia na hora) | Primeiro acesso: início vazio com "configure sua propriedade" → entrevista → desenhar talhões → assuntos com os dados reais do município escolhido |
| **Conta existente** | botão "Entrar como João (demo)" (ou contato e senha de demo mostrados na tela) | Sítio fictício em Araraquara, 3 talhões com limites, culturas, estoque, histórico desde 2025/26, casos anteriores. **Ao entrar, volta ao estado inicial** |

## 4. Regras para quem executa uma etapa (Claude ou outro modelo)
1. `git pull origin main`. Confira que a etapa anterior está ✅ e marque a sua 🔄 na tabela.
2. Leia só os arquivos citados na etapa (por trecho: `grep`, `sed -n`). Não explore o repositório inteiro.
3. **Scripts de subir sempre atualizados** (`dev.sh`, `iniciar.sh/.ps1/.bat`, `docker/`, `README.md`): a equipe testa cada etapa com eles.
   Mudou o banco? Aumente `SCHEMA_VERSION` (criado na M1); os scripts recriam o banco sozinhos.
4. Antes do push: `cd backend && pytest -q` e `cd frontend && npm run build`. Push em `main` **e** `ccr-81d3ce1b-s9dpv4` (D-011).
5. Ao terminar: marque ✅ com o hash, atualize o §1 do `CLAUDE.md` (1–3 linhas) e **responda com o bloco de fechamento** (§6).
   Vale para qualquer modelo.
6. Algo exigiria mudar produto, fluxo ou estas regras? **Pare e pergunte** (`CLAUDE.md` §4).
7. A etapa ficou grande demais para o contexto? Anote no arquivo da etapa "parei em…" e faça um commit antes de o contexto acabar.

## 5. Etapas
Esforço = `/effort` sugerido. Modelo = `/model` sugerido.

| # | Etapa | Modelo | Esforço | Tempo | Status |
|---|---|---|---|---|---|
| M1 | [Contas: tabelas, produtor atual, 2 contas demo, cadastro e login](M1-contas.md) | **Opus** | médio | 1h20 | ✅ 26481b7 |
| M2 | [Entrevista e talhões na API + primeiro acesso](M2-entrevista-talhoes.md) | Sonnet | médio | 1h | ✅ 4f8e4e8 |
| M3 | [Assuntos calculados com fontes reais](M3-assuntos.md) | **Opus** | médio | 1h20 | ✅ 8cbc8af |
| M4 | [Telas ligadas: Início, Resolver, Casos, Dados abertos, Mapa](M4-telas.md) | Sonnet | médio | 1h10 | ✅ 4c02bdc |
| M5 | [IA real + passo a passo da chave](M5-ia.md) | Sonnet | médio | 40 min | ✅ 3035906 |
| M6 | [App principal em `/` + teste dos 2 cenários + roteiro](M6-final.md) | Sonnet | médio | 50 min | ✅ e4aa180 |
| M7 | [*Opcional:* pivôs da ANA na região](M7-ana-pivos.md) | Sonnet | baixo | 30 min | ✅ HASH |

Ordem: M1 → M2 → M3 → M4 → M5 → M6 (M7 depois da M3, se houver folga). Total essencial ≈ 6h20.
Pitch e PDF ficam fora do plano (T-023, Thales + Claude); os números reais saem da M3 e da M4.

## 6. Bloco de fechamento (obrigatório ao fim de cada etapa)
```
✅ Mx — <nome> · commit <hash> (main)
O que mudou: <3–5 linhas, sem jargão>
🧪 Como testar (equipe):
  1. ./iniciar.sh atualizar   (Windows: iniciar.bat atualizar)
  2. Abrir <URL>, fazer <passos> → deve aparecer <resultado>
👥 HUMAN ACTION REQUIRED: <passo a passo numerado, ou "nada">
⚠️ Limitações: <o que ficou fora; nenhuma fonte inventada>
➡️ Próxima: dar /clear e dizer "siga o plano em docs/implementacao, etapa My"
```

## 7. Mapa rápido do código
| Onde | O quê |
|---|---|
| `backend/app/models.py` | Producer, Farm, Field, Season, StockItem, Event, StockMovement, AlertState, ProfileFact, ChatMessage |
| `backend/app/routers/api.py` | `/api/farm`, `/api/fields` (CRUD), `/api/fields/{id}/zarc`, `/api/weather`, `/api/climate/rain-history`, `/api/opendata/*` (crops, agrofit, region, boundary, sources), `/api/profile` |
| `backend/app/routers/assistant.py` | `/api/assistant/status`, `/chat`, `/history` |
| `backend/app/services/` | `opendata.py` (Zarc `zarc_for`, Agrofit, `region`, fontes) · `weather.py` (Open-Meteo + cache) · `live.py` (`cached_json`, NASA `rain_vs_normal`, IBGE `municipality_boundary`) · `insights.py` (alertas e planejador do app antigo, reaproveitáveis) · `farmdata.py` (`get_farm`, `polygon_area_ha`) |
| `backend/app/assistant/` | `engine.py` (LLM OpenAI-compatível + offline) · `tools.py` |
| `scripts/seed_demo.py` | cria o João (será trocado pelas fixtures na M1) |
| `frontend/src/prototype/` | `ProtoApp.tsx` (rotas) · `pages/` · `components/` (`interview/`, `livemap/`, `Brand.tsx`, `IsoFarm.tsx`, `Shell.tsx`) · `mock.ts`, `resolve.ts`, `farmStore.ts` |
| `dev.sh` · `iniciar.*` · `docker/` | subir tudo (ver `README.md`) |

## 8. Decisões desta fase
D-017 protótipo vira o app principal em `/` (app antigo em `/legado`) · D-018 cadastro com senha (hash da biblioteca padrão) + botões demo ·
D-019 resposta do técnico simulada e rotulada · D-020 IA: Groq gratuito, com o modo offline como reserva ·
D-021 sementes e fungicida calculados a partir do estoque da conta (fictício na demo) + Agrofit real ·
D-022 regras de dados do §2 (dado aberto sempre real; demo só nos dados de conta; fixtures nas mesmas tabelas) · solo declarado.
