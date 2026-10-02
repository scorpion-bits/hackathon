# M4 — Telas ligadas: Início, Resolver, Casos, Dados abertos, Mapa

> **Sonnet · médio · ~1h10** · Depende de: M3. Visual **não muda**; só a origem dos dados.

## Objetivo
Toda tela do roteiro da demo passa a usar a API. **Nenhum número de fonte aberta fica fixo no front.**
Fonte indisponível vira aviso explícito na tela (regra §2 do `README.md`).

## Situação atual (o que está fixo hoje)
| Tela | Arquivo | Fixo hoje → passa a vir de |
|---|---|---|
| Início | `pages/ForYou.tsx` | `INSIGHTS`, `FIELDS` e o cartão de chuva 93 × 48 mm → `GET /api/topics`, `/api/fields`, `/api/climate/rain-history` |
| Resolver | `pages/Resolve.tsx` | `PROBLEMS`, `ZARC_MILHO`/`ZARC_SOJA`, `FORECAST` → `GET /api/topics/{key}` (`evidence`) |
| Casos | `pages/Cases.tsx` + `resolve.ts` (`sendCase`, `useCases`, localStorage; `SAMPLE_REPLY`) | → API de casos (abaixo) |
| Dados abertos | `pages/OpenData.tsx`, `components/views/SourceSamples.tsx` | `SOURCES`, `FUNNEL` → `GET /api/opendata/sources` + funil |
| Mapa vivo | `pages/LiveMap.tsx`, `components/livemap/*` (`FieldCard`, `MobileUI`) | `risk` do mock → risco do assunto Zarc do talhão; contorno → `/api/opendata/boundary` |
| Minha propriedade / Meu contexto | `pages/Property.tsx`, `pages/ContextPage.tsx` | contagens e respostas → `/api/me`, `/api/onboarding` |

## Passos (🤖 AGENT EXECUTION)
1. **Casos (backend, `routers/cases.py`)**:
   - `POST /api/cases {topic_key, expert_id, channel, path?, note?, consent}`:
     - 400 sem consentimento;
     - `snapshot` = o assunto atual, com fontes e datas;
     - protocolo `AB-` sequencial; `status='recebido'`.
   - `GET /api/cases`.
   - `POST /api/cases/{id}/demo-reply`: resposta-modelo por `kind`, com `reply_is_example=True` (D-019).
   - `GET /api/experts`: mover `EXPERTS` do `resolve.ts` para o backend, com os mesmos textos.
   - `DELETE /api/cases`: só em conta demo, para "Recomeçar a demonstração"; também limpa o `TopicState`.
2. **Funil real**: criar `GET /api/opendata/funnel` (total por base → linhas do Zarc do município e das culturas → linhas do Agrofit das culturas → janelas → assuntos).
   `/api/opendata/sources` deve incluir `checked_at` de `data/sync_state.json`.
3. **Front**:
   - criar `api/topics.ts`, `api/cases.ts`, `api/opendata.ts`, cada um com um hook simples (fetch + estado + `reload`);
   - adaptar as telas da tabela. Os componentes de gráfico (`ZarcStrip`, `RainBars` etc.) passam a receber os dados por props;
   - a rota `/prototipo/resolver/:id` passa a usar a `key`, com `encodeURIComponent`.
4. **Estados honestos** (componente único `<SourceStatus status=… fetchedAt=… />`):
   - `live`: nada;
   - `cache` ou `stale`: "dado real de 02/10 21h";
   - `offline`: "previsão indisponível agora", e o cartão some ou fica vazio.
   - Carregando: um esqueleto (skeleton), **nunca número de exemplo**.
5. **Remover do front os números de fonte aberta fixos**: em `mock.ts` ficam só textos de interface; apagar `INSIGHTS`, `FORECAST`, `ZARC_*`, `FUNNEL` e as contagens de `SOURCES` quando não forem mais usados.
   - Conferir com `grep -rn "ZARC_\|FORECAST\|INSIGHTS\|FUNNEL" frontend/src/prototype`.
6. Teste do backend: caso sem consentimento → 400; protocolo sequencial; snapshot com fontes.

## Pronto quando
- O roteiro João: início → Resolver → enviar caso → Meus casos → simular resposta → Dados abertos → Mapa, todo com dados da API.
- Com a internet cortada: avisos claros, nenhum número inventado.
- `npm run build` e `pytest` passam.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → João → percorrer o roteiro acima, no celular (`http://<IP-do-PC>:5173/prototipo`, mesma Wi-Fi) e no computador.
2. Conferir um número: o risco do milho no Resolver é o mesmo de `GET /api/topics` no /docs.
3. Desligar o Wi-Fi do computador e recarregar: aparecem os avisos de fonte indisponível ou "dado de <hora>", sem números novos inventados.

## 👥 Ações humanas
Teste no celular (passo 1) e anotar no chat o que ficou estranho.
