# E07 — Início guiado + Resolver com os assuntos reais

> Modelo: **Sonnet** · Esforço: **alto** · ~50 min · Depende de: E06 · Essencial.

## Objetivo
A tela inicial ("um assunto por vez") e a tela Resolver (`/prototipo/resolver/:id`) passam a usar `GET /api/topics`, **sem mudar o visual**.

## Contexto necessário
- `pages/ForYou.tsx`:
  - hero; `FocusCard` com "Resolver agora";
  - fila dos outros assuntos; progresso "encaminhados";
  - mini mapa IsoFarm; cartão de chuva (NASA 93 mm × 48 mm).
  - Usa `INSIGHTS` e `FIELDS` de `mock.ts`, e `useResolved`, `nextOpen`, `useCases` de `resolve.ts`.
- `pages/Resolve.tsx`, em 3 passos:
  1. evidência (`ZarcStrip`, `RainBars`, sementes, Agrofit, drones);
  2. caminhos possíveis, com o selo "Mais alinhado aos dados oficiais";
  3. "Leve para um técnico — de graça", com `EXPERTS`, resumo, canal, consentimento LGPD e "Enviar meu caso".
- A rota usa ids `i1`…`i6`; agora passa a usar a `key` do assunto (codificar com `encodeURIComponent`).
- Formato da API: ver E06, passo 3.

## Passos (🤖 AGENT EXECUTION)
1. Criar `frontend/src/prototype/api/topics.ts`:
   - `useTopics()` faz `useApi('topics', …)`;
   - o fallback converte `INSIGHTS` + `PROBLEMS` para o formato da API, e assim a demo offline continua igual.
2. Adaptar `ForYou.tsx` e `Resolve.tsx` ao formato novo:
   - criar um mapeamento `evidence.type` → componente de gráfico; os componentes já existem e só passam a receber os dados por props;
   - a escolha do caminho chama `POST /api/topics/{key}/choice`.
3. O cartão de chuva da tela inicial usa `GET /api/climate/rain-history`, com fallback nos números atuais.
4. Fontes e datas aparecem embaixo de cada evidência (já existe `evidenceNote`; preencher com `sources[].name` + data).
5. Se `unavailable_sources` vier preenchido, mostrar um aviso discreto ("previsão do tempo indisponível agora; tente mais tarde").
6. Atualizar o "Meu contexto" e o assistente **apenas** se eles quebrarem com a mudança de ids. A IA fica para a E11.

## Pronto quando
- Com o João, a tela inicial mostra os assuntos reais e o Resolver abre cada um com o gráfico certo.
- Com uma conta nova, os assuntos são diferentes e coerentes.
- Com a API desligada, tudo continua igual ao protótipo, com o selo "exemplo".
- `npm run build` passa.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → entrar como João → tela inicial → "Resolver agora" → percorrer os 3 passos.
2. Conferir os números do gráfico do Zarc com `GET /api/topics` (o mesmo assunto).
3. Testar no **celular** (mesma rede Wi-Fi):
   - descobrir o IP do computador (`hostname -I` no Linux, `ipconfig` no Windows);
   - abrir `http://<IP>:5173/prototipo` no celular.

## 👥 Ações humanas
Teste no celular (passo 3) e anotar no chat o que ficou estranho.

## Scripts de subir
O Vite já aceita acesso da rede (`host: true` em `vite.config.ts`). Se o celular não abrir, o problema costuma ser o firewall do computador: liberar a porta 5173.
