# 06 — Registro de decisões

> Uma entrada por decisão relevante (template: `templates/decision.md`).
> Estratégicas exigem `Aprovado por: equipe`. Operacionais podem ser registradas pelo Claude.

| ID | Data/hora | Decisão | Tipo | Aprovado por | Status |
|---|---|---|---|---|---|
| D-000 | 02/10 madrugada | Estrutura do repositório e processo de trabalho (este setup) | operacional | Claude | vigente |
| D-001 | 02/10 12h35 | Solução: **AgroIA** — plataforma web modular de gestão + IA que interpreta dados abertos | estratégica | equipe | vigente |
| D-002 | 02/10 12h35 | MVP de `docs/04-mvp.md` + **Planejador de plantio** e **voz** (Minha Região vira cartão no Painel) | estratégica | equipe | vigente |
| D-003 | 02/10 12h35 | Stack e modelo de dados de `docs/05-architecture.md` | estratégica | equipe | vigente |
| D-004 | 02/10 12h40 | IA via API **compatível com OpenAI** (serve Groq, Gemini, OpenRouter, Ollama Cloud) + **modo offline determinístico** como plano B | técnica | Claude (delegado pela equipe) | vigente |
| D-005 | 02/10 12h40 | Persona demo: João (fictício), Araraquara/SP, 3 talhões; Zarc safra 2026-27 (fallback 2025-26) | produto | Claude (delegado) | vigente |
| D-006 | 02/10 12h40 | Solo do talhão por textura (arenoso/médio/argiloso); culturas com classes AD do Zarc usam aproximação AD2/AD4/AD6 **rotulada como estimativa** | técnica | Claude (delegado) | vigente |
| D-008 | 02/10 13h40 | **Reposicionamento**: dados abertos são o centro; contexto do produtor (entrevista → `contexto.md`) filtra grandes volumes e sugere só o útil. Gestão vira secundária | estratégica | equipe | vigente |
| D-009 | 02/10 13h40 | Fase de **protótipo visual** (`/prototipo`, dados de exemplo) antes de reimplementar; app funcional atual preservado em `/` para reaproveitar backend | estratégica | equipe | vigente |
| D-007 | 02/10 12h40 | Agregados de bases com pessoa física suprimem grupos com < 3 registros (anti-reidentificação) | ética | Claude (delegado) | vigente |
| D-010 | 02/10 ~15h | Dados atualizados por API: `scripts/fetch_opendata.py` (CKAN do MAPA, compara por hash, baixa só o que mudou) + APIs ao vivo com cache (Open-Meteo, NASA POWER, IBGE, NASA GIBS) | técnica | equipe | vigente |
| D-011 | 02/10 ~15h30 | Entregas vão para `main` **e** para a branch da sessão (equipe só dá `git pull` na main) | operacional | equipe | vigente |
| D-012 | 02/10 ~15h30 | UX do protótipo: tela inicial **guiada** (um assunto por vez → tela Resolver: dados → soluções do agente → próximo passo); resumo da entrevista em cartões | produto | equipe | vigente |
| D-013 | 02/10 ~15h40 | Mapa vivo com **painel-guia em 3 passos** (onde olhar → pergunta simples → o que significa); camadas viram perguntas | produto | equipe | vigente |

---

## D-000 — Estrutura operacional do repositório
- **Contexto:** preparação antes do tema.
- **Decisão:** adotar estrutura `docs/` + `planning/` + `templates/` + `scripts/` + `data/` + `src/` + `tests/`, com CLAUDE.md como memória operacional.
- **Alternativas:** wiki do GitHub; tudo no Hub.
- **Motivo:** versionado, legível por agentes, retomável por nova sessão.
- **Reversível:** sim, custo baixo.
