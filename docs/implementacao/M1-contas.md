# M1 — Contas: tabelas, produtor atual, 2 contas demo, cadastro e login

> **Opus · médio · ~1h20** · Depende de: nada · Leia antes: `README.md` §2 e §3 (regras de dados e cenários).

## Objetivo
O backend passa a ter **contas separadas**, e o login do protótipo funciona nos dois cenários: **conta nova** e **conta existente (João, demo)**.
As outras telas continuam com os dados atuais até a M2–M4.

## Situação atual (para não precisar explorar)
- `backend/app/services/farmdata.py:get_farm()` devolve **a primeira fazenda do banco**. Quase todas as rotas de `routers/api.py` usam
  `farm_or_404(session)`, que chama essa função.
- `scripts/seed_demo.py` apaga e recria tudo (`drop_all`/`create_all`) e cria o João com talhões **retangulares** (`rect`),
  diferentes dos polígonos do protótipo (`frontend/src/prototype/mock.ts`, `FIELDS[].poly`, em [lon, lat]). Já cria estoque, eventos e safras.
- O `app.db` nasce com `create_all`, que **não altera tabelas existentes**.
- Tela de login: `frontend/src/prototype/pages/Login.tsx`, só visual. Tem as abas "entrar" e "criar" e o botão "Entrar como João (demo)".
- O protótipo ainda não chama a API. O Vite repassa `/api` para `:8000`.

## Passos (🤖 AGENT EXECUTION)
1. **Versão do banco** (`backend/app/db.py`):
   - criar `SCHEMA_VERSION = 2` (gravada em `PRAGMA user_version`) e `schema_outdated()`;
   - em `scripts/seed_demo.py`, criar o modo `--if-needed`, que só recria quando o esquema mudou ou o banco não existe;
   - trocar a chamada do seed por `--if-needed` em `dev.sh`, `docker/backend-entrypoint.sh` e `iniciar.ps1` (se ele chamar o seed);
   - `resetar` continua forçando a recriação.
2. **Modelos** (`models.py`):
   - `Producer`: acrescentar `contact` (único, pode ser nulo), `password_hash` (pode ser nulo), `created_at`. O `is_demo` já existe.
   - `AuthToken(token PK, producer_id, created_at)`.
   - `Interview(producer_id PK, answers JSON, updated_at)`.
   - `Case`:
     - `id`, `producer_id`, `protocol` (único), `topic_key`, `field_id` (pode ser nulo);
     - `expert_id`, `channel`, `path`, `note`;
     - `snapshot` (JSON), `consent_at`, `status`, `reply`, `reply_is_example`, `created_at`.
   - `TopicState(producer_id, topic_key, PK composta; choice, updated_at)`.
   - `ChatMessage`: acrescentar `producer_id`.
3. **Produtor atual** em `backend/app/auth.py`:
   - criar a dependência `current_producer`, que lê `Authorization: Bearer <token>`; **sem token, usa o João** para o app antigo continuar funcionando;
   - `farmdata.get_farm(session, producer)` filtra pela fazenda do produtor. Conta sem fazenda → o front recebe `farm: null` (não 503);
   - trocar `farm_or_404` em todas as rotas e conferir que talhão, evento e item pertencem à fazenda do produtor (senão 404).
4. **Rotas de conta** (`routers/auth.py`, incluir em `main.py`):
   - `POST /api/auth/register {name, contact, password}` → `{token}`:
     - hash `hashlib.pbkdf2_hmac('sha256', …, 200_000)` com salt aleatório, guardado como `salt$hash`;
     - contato repetido → 409 "Esse contato já tem conta".
   - `POST /api/auth/login {contact, password}` → `{token}`; senha errada → 401 "Contato ou senha incorretos".
   - `POST /api/auth/demo {scenario:'existente'|'nova'}`:
     - `existente` **recarrega a conta do João a partir das fixtures** (apaga os dados dela e recria) e devolve o token;
     - `nova` cria uma conta vazia `is_demo=True` ("Visitante") e devolve o token.
   - `POST /api/auth/logout`.
   - `GET /api/me` → `{producer:{id,name,is_demo}, farm|null, has_interview, counts:{fields, stock_items, events, cases}}`.
5. **Fixtures da conta existente** (`backend/app/fixtures/demo/joao.json` + `backend/app/demo.py:load_demo(session, producer)`):
   - talhões com os **mesmos polígonos** de `mock.ts` (anel fechado), cultura no nome do Zarc ("Soja", "Milho 1ª Safra", "Feijão"),
     solo, irrigação, cor e taxa de semente;
   - estoque, safras e eventos: mover para o JSON o que hoje está em `seed_demo.py`;
   - `Interview.answers` com o `DEMO_ANSWERS` do front (`grep -rn DEMO_ANSWERS frontend/src/prototype`);
   - 1 caso antigo já respondido (exemplo, `reply_is_example=True`);
   - `seed_demo.py` passa a só criar as tabelas e chamar `load_demo` para o João (contato `joao@demo.agrobits`, senha `demo1234`, mostrada na tela de login).
   - **Nenhum dado de fonte aberta vai nas fixtures** (nada de risco do Zarc, chuva etc.), só dados de conta.
6. **Front, só o login e a sessão**:
   - criar `frontend/src/prototype/api/client.ts`: `apiGet/Post/Put/Delete` com timeout de 8 s e token em `localStorage['agrobits.token']`, sempre dentro de try/catch;
   - criar `frontend/src/prototype/api/session.ts`, store com `useMe()` e `logout()`;
   - `Login.tsx` chama register/login; mostra o erro da API no campo; tem os botões "Entrar como João (demo)" e "Experimentar como novo usuário";
   - depois de entrar: sem entrevista → `/prototipo/entrevista`; com entrevista → `/prototipo`;
   - selo **"conta de demonstração"** no `Shell.tsx` quando `is_demo`, e botão "Sair";
   - se a API não responder, o login mostra "Servidor fora do ar — rode ./iniciar.sh", sem entrar com dados inventados.
7. **Testes** (`backend/tests/test_accounts.py`):
   - register, login certo e errado, 409;
   - `/me` da conta nova sem fazenda;
   - o demo existente tem 3 talhões com áreas próximas de 5,36 / 3,08 / 2,05 ha;
   - recarregar o demo desfaz alterações;
   - a conta A não acessa o talhão da conta B.

## Pronto quando
Os 3 caminhos de entrada funcionam e `/api/me` responde certo para cada um. `pytest` e `npm run build` passam.
Um `app.db` antigo é recriado sozinho ao subir.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → http://localhost:5173/prototipo/entrar
2. "Entrar como João (demo)" → abre o início, com o selo "conta de demonstração".
3. Sair → "Experimentar como novo usuário" → vai para a entrevista.
4. Sair → "Criar conta" com seu e-mail e uma senha qualquer (**não use uma senha real**) → sair → entrar de novo com a mesma senha.

## 👥 Ações humanas
Nenhuma.

## ✅ Feito (02/10) — notas para as próximas etapas
- Conta atual: `auth.current_producer` (dependência de todo `/api/*`) põe o id em `session.info["producer_id"]`;
  `farmdata.get_farm(session)` / `find_farm` já filtram por ele (inclusive nas ferramentas da IA). Sem token → João.
- `get_or_404` em `routers/api.py` confere o dono (talhão/evento/item/safra pela fazenda; fato pelo produtor).
- Conta sem fazenda: `/api/me` → `farm: null`; `GET /api/farm` → `null`; demais rotas → 404. A IA responde "configure sua propriedade".
- Fixture `backend/app/fixtures/demo/joao.json` (sem dado aberto). `demo.load_demo` mantém a conta e os tokens (outros celulares logados como João continuam).
- Áreas reais dos polígonos do `mock.ts`: **5,61 / 3,06 / 2,02 ha** (o mock tinha 5,36/3,08/2,05 escritos à mão; o teste aceita ±0,3).
- Front: `prototype/api/client.ts` (`apiGet/Post/Put/Delete`, `ApiError`, `OFFLINE_MSG`) e `api/session.ts` (`useMe`, `refreshMe`, `signIn`, `logout`).
  `DemoSeal` exportado de `Shell.tsx`. As outras telas ainda usam o mock (M2–M4).
