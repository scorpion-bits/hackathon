# E02 — Fundação do front: cliente da API e "cai para exemplo"

> Modelo: **Sonnet** · Esforço: **médio** · ~40 min · Depende de: E01 · Essencial.

## Objetivo
Dar ao protótipo um jeito único e seguro de buscar dados reais: se a API responder, usa o dado real; se falhar, usa o dado de
exemplo e mostra um selo discreto **"exemplo"**. Assim nenhuma etapa seguinte quebra a demo.

## Contexto necessário
- O protótipo **não chama a API** hoje. Os dados vêm de `frontend/src/prototype/mock.ts`, `resolve.ts` e `farmStore.ts`.
  `farmStore` e `resolve` usam `useSyncExternalStore` e localStorage (sempre dentro de try/catch).
- O app antigo tem um cliente em `frontend/src/lib/api.ts` e hooks em `frontend/src/lib/hooks.ts`. Sirva-se deles como **referência de estilo**, sem importar.
- O Vite repassa `/api` para o backend (`vite.config.ts`, variável `VITE_API_TARGET`).

## Passos (🤖 AGENT EXECUTION)
1. Criar `frontend/src/prototype/api/client.ts`:
   - `apiGet`, `apiPost`, `apiPut`, `apiDelete`: enviam `Authorization: Bearer <token>` quando houver token e têm timeout de 8 s (AbortController);
   - o token fica em `localStorage['agrobits.token']`, sempre lido e gravado dentro de try/catch;
   - erros saem como `ApiError(status, message)`.
2. Criar `frontend/src/prototype/api/useApi.ts`, um hook com a assinatura
   ```ts
   useApi<T>(key: string, fetcher: () => Promise<T>, fallback: T): { data: T; real: boolean; loading: boolean; reload(): void }
   ```
   - guarda o resultado em cache em memória por `key`, para o mesmo dado não ser buscado duas vezes ao trocar de tela;
   - `real=false` quando a resposta veio do fallback;
   - `invalidate(key)` exportado, para usar depois de gravar algo.
3. Criar o componente `<SampleBadge show={!real} />`: um selo pequeno "exemplo" (cor palha, `--color-straw`, com tooltip "dado de exemplo: a API não respondeu").
4. Criar `GET /api/me` no backend, que devolve o produtor atual, a fazenda e `is_demo`. Quem guarda o produtor atual no front é um store `session.ts` (usado na E03).
5. Fazer uma prova de vida em **uma** tela: em `ForYou.tsx`, trocar o nome do produtor de `PRODUCER.name` para o resultado de `/api/me` (com fallback `PRODUCER`).

## Pronto quando
- `cd frontend && npm run build` sem erros.
- Com o backend ligado, a tela inicial mostra o nome vindo da API, sem selo.
- Com o backend desligado (`./dev.sh --proto`), aparece o nome de exemplo e o selo "exemplo", e nada quebra.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar`, abrir `/prototipo`: a saudação mostra "João" sem selo.
2. `./iniciar.sh parar` e depois `./dev.sh --proto` (só o front): a saudação mostra "João" **com** o selo "exemplo".

## 👥 Ações humanas
Nenhuma.

## Scripts de subir
Sem mudanças esperadas. Se aparecer alguma variável `VITE_*` nova, documente no `README.md` e no `docker-compose.yml`.
