# Plano de implementação — protótipo → AgroBits real

> **Comece por aqui depois de um `/clear`.** Este arquivo é o índice do plano. Cada etapa tem um arquivo próprio
> (`E01-...md`) com tudo que a sessão precisa saber. Leia o índice e **só** o arquivo da etapa em andamento.
> Criado em 02/10 ~19h. Prazo: congelamento 03/10 **08h** · entrega 09h (BRT).

## 1. O que estamos fazendo (contexto em 10 linhas)

- O **protótipo visual** em `/prototipo` (React, dados de exemplo em `frontend/src/prototype/mock.ts`, `resolve.ts`, `farmStore.ts`)
  foi **validado pela equipe**. Agora as telas aprovadas passam a usar **dados e backend reais**.
- O backend já existe (FastAPI + SQLite, em `backend/app/`) e serve o **app funcional antigo** (`/`): talhões, eventos, estoque,
  alertas, Zarc, Agrofit, clima, IA com modo offline. Vamos **reaproveitar** serviços e modelos, e adicionar o que falta.
- Produto (não mudar sem aprovação): **dados abertos no centro**; o contexto do produtor (entrevista) filtra; **a IA não decide**:
  mostra dados oficiais e "caminhos possíveis" e **leva o caso à assistência técnica pública gratuita** (D-015, modelo A).
- Mobile first (D-016), marca isométrica AgroBits (D-014). O visual do protótipo **não muda** nesta fase, só ganha dados reais.
- Princípio de toda etapa: **o app nunca quebra na demo**. Se a API falhar, a tela cai para o dado de exemplo e mostra um selo "exemplo".

## 2. Regras para quem executa uma etapa (Claude ou outro modelo)

1. Leia `CLAUDE.md` → este índice → **o arquivo da etapa**. Não leia o repositório inteiro; o arquivo da etapa lista os arquivos que importam.
2. Antes de codar: `git pull origin main`. Confira que a etapa anterior está ✅ na tabela abaixo.
3. Marque a etapa como 🔄 nesta tabela ao começar e ✅ ao terminar (com o hash do commit).
4. **Script de subir sempre atualizado:** se a etapa mudar dependências, variáveis de ambiente, banco ou portas, atualize
   `dev.sh`, `iniciar.sh`, `iniciar.ps1`, `docker/*` e o `README.md` **na mesma etapa**. A equipe testa toda etapa com `./iniciar.sh` / `iniciar.bat`.
5. **Mudou o modelo do banco?** Aumente `SCHEMA_VERSION` em `backend/app/db.py` (criado na E01): os scripts recriam o `app.db` sozinhos.
6. Rode os testes (`cd backend && pytest -q`; `cd frontend && npm run build`) antes de cada push. Push em `main` **e** `ccr-81d3ce1b-s9dpv4` (D-011).
7. **Ao terminar, responda à equipe com o bloco de fechamento** (seção 5). Ele é obrigatório, inclusive para outro modelo.
8. Decisão estratégica nova (mudar fluxo, escopo, modelo de negócio, stack) → **pare e pergunte** (regra de ouro do `CLAUDE.md` §4).
9. Mantenha o contexto curto: leia arquivos por trecho (`sed -n`/`grep`), não cole arquivos grandes na conversa, não reabra etapas ✅.

## 3. Etapas

Esforço = nível de raciocínio sugerido (`/effort`): baixo · médio · alto. Modelo = sugestão para `/model`.
**Linha de corte:** E01–E08 + E11 + E12 + E13 são **essenciais** para a demo. E09, E10 e E14 são "se der tempo"
(sem elas o app continua funcionando com os dados de exemplo dessas telas).

| # | Etapa | Modelo | Esforço | Tempo | Essencial | Status |
|---|---|---|---|---|---|---|
| E00 | [Decisões da equipe antes de começar](E00-decisoes.md) | — (equipe) | — | 10 min | sim | ⏳ |
| E01 | [Fundação do backend: tabelas novas, versão do banco, seed igual ao protótipo](E01-backend-fundacao.md) | Opus | alto | 50 min | sim | ⏳ |
| E02 | [Fundação do front: cliente da API + "cai para exemplo"](E02-front-fundacao.md) | Sonnet | médio | 40 min | sim | ⏳ |
| E03 | [Entrar / criar conta (sessão simples)](E03-login.md) | Sonnet | médio | 30 min | sim | ⏳ |
| E04 | [Entrevista salva no backend](E04-entrevista.md) | Sonnet | alto | 45 min | sim | ⏳ |
| E05 | [Talhões reais (editor, Minha propriedade)](E05-talhoes.md) | Sonnet | médio | 40 min | sim | ⏳ |
| E06 | [Motor de assuntos com dados abertos reais](E06-assuntos.md) | Opus | alto | 1h15 | sim | ⏳ |
| E07 | [Início guiado + Resolver com os assuntos reais](E07-inicio-resolver.md) | Sonnet | alto | 50 min | sim | ⏳ |
| E08 | [Casos enviados ao técnico, persistidos](E08-casos.md) | Sonnet | médio | 40 min | sim | ⏳ |
| E09 | [Mapa vivo com talhões e riscos reais](E09-mapa-vivo.md) | Sonnet | médio | 40 min | não | ⏳ |
| E10 | [Dados abertos + Meu contexto reais](E10-dados-contexto.md) | Sonnet | médio | 40 min | não | ⏳ |
| E11 | [IA: assistente real (offline + chave da equipe)](E11-ia.md) | Opus | alto | 1h | sim | ⏳ |
| E12 | [Protótipo vira o app principal (`/`)](E12-app-principal.md) | Sonnet | baixo | 25 min | sim | ⏳ |
| E13 | [QA ponta a ponta + roteiro da demo](E13-qa-demo.md) | Opus | alto | 1h | sim | ⏳ |
| E14 | [Windows sem Docker (`iniciar.bat` sem Docker)](E14-windows-sem-docker.md) | Sonnet | médio | 40 min | não | ⏳ |

Ordem: E00 → E01 → E02 → (E03, E04, E05) → E06 → E07 → E08 → E11 → E12 → E13. E09/E10/E14 entram quando houver folga.
Duas sessões podem andar em paralelo só se mexerem em arquivos diferentes (ex.: E11 backend × E09 front).

**Pitch e PDF** seguem fora deste plano (T-023, Thales + Claude). Os números reais saem da E06/E10.

## 4. Mapa rápido do código (para não precisar explorar)

| Onde | O quê |
|---|---|
| `backend/app/models.py` | Producer, Farm, Field, Season, StockItem, Event, StockMovement, AlertState, ProfileFact, ChatMessage |
| `backend/app/routers/api.py` | `/api/farm`, `/api/fields` (CRUD), `/api/fields/{id}/zarc`, `/api/weather`, `/api/climate/rain-history`, `/api/opendata/*`, `/api/profile` |
| `backend/app/routers/assistant.py` | `/api/assistant/status`, `/chat`, `/history` |
| `backend/app/services/` | `opendata.py` (Zarc, Agrofit, região, fontes) · `weather.py` (Open-Meteo) · `live.py` (NASA POWER, IBGE) · `insights.py` (alertas, planejador) · `farmdata.py` (fazenda atual, área do polígono) |
| `backend/app/assistant/` | `engine.py` (LLM OpenAI-compatível + offline) · `tools.py` (ferramentas que a IA chama) |
| `scripts/seed_demo.py` | cria o João (demo) no `app.db` |
| `frontend/src/prototype/` | `ProtoApp.tsx` (rotas) · `pages/` (telas) · `components/` · `mock.ts`, `resolve.ts`, `farmStore.ts` (dados de exemplo e estado local) |
| `frontend/src/lib/api.ts` | cliente da API do app antigo (referência) |
| `dev.sh` · `iniciar.sh/.ps1/.bat` · `docker/` | subir tudo (ver `README.md`) |

## 5. Bloco de fechamento (obrigatório ao fim de cada etapa)

```
✅ E0X — <nome> · commit <hash> (main)
O que mudou: <3–5 linhas, sem jargão>
🧪 Como testar (equipe):
  1. ./iniciar.sh atualizar   (Windows: iniciar.bat atualizar)
  2. Abrir <URL> e fazer <passos> → deve aparecer <resultado>
👥 HUMAN ACTION REQUIRED: <passo a passo numerado do que a equipe precisa fazer, ou "nada">
⚠️ Limitações / o que ficou de exemplo: <lista>
➡️ Próxima etapa: E0Y — dar /clear e dizer "siga o plano em docs/implementacao, etapa E0Y"
```

## 6. Decisões tomadas nesta fase

(Preenchido na E00 e ao longo das etapas; também vão para `docs/06-decisions.md`.)
