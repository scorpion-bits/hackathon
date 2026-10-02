# E12 — O protótipo vira o app principal (`/`)

> Modelo: **Sonnet** · Esforço: **baixo** · ~25 min · Depende de: E07, E08 e a aprovação D-017 (E00) · Essencial.

## Objetivo
Quem abre http://localhost:5173 cai direto no AgroBits novo. O app antigo continua acessível em `/legado`, sem link na navegação.

## Contexto necessário
- `frontend/src/App.tsx`: hoje `/prototipo/*` → `ProtoApp` e `/*` → `FunctionalApp` (Dashboard, Mapa, Produção, Estoque…).
- Os links internos do protótipo usam o prefixo `/prototipo/...`. Procurar com `grep -rn "'/prototipo" frontend/src/prototype`.
- Os scripts abrem `http://localhost:5173/prototipo`: `dev.sh`, `iniciar.sh`, `iniciar.ps1`, `README.md`, `docker-compose.yml` (comentário).
- Remover os rótulos "protótipo" visíveis (ex.: `ProtoBanner` em `components/Shell.tsx`), mantendo os selos "exemplo" da E02.

## Passos (🤖 AGENT EXECUTION)
1. Criar a constante `BASE = ''` em `prototype/paths.ts` e trocar os `'/prototipo'` fixos por `` `${BASE}/...` ``, ou usar rotas relativas.
2. Em `App.tsx`:
   - `/legado/*` → `FunctionalApp`;
   - `/*` → `ProtoApp`;
   - `/prototipo/*` → redireciona para o mesmo caminho sem o prefixo, para links antigos e QR codes continuarem valendo.
3. Ajustar o `basename` ou os links do app antigo para funcionarem sob `/legado`.
4. Atualizar as URLs em `dev.sh`, `iniciar.sh`, `iniciar.ps1`, `README.md`, `CLAUDE.md` e `docker-compose.yml`.
5. Registrar a D-017 em `docs/06-decisions.md`, se ainda não estiver lá.

## Pronto quando
- `/` abre o AgroBits novo; `/prototipo/casos` redireciona para `/casos`; `/legado` abre o app antigo.
- `npm run build` passa; os scripts abrem a URL certa.

## 🧪 Como a equipe testa
`./iniciar.sh atualizar` → o navegador abre direto no AgroBits (sem "/prototipo"). Testar um link antigo: http://localhost:5173/prototipo/casos.

## 👥 Ações humanas
Nenhuma (a decisão já foi tomada na E00).

## Scripts de subir
**Sim:** as URLs mudam nesta etapa (passo 4).
