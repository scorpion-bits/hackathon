# E03 — Entrar / criar conta (sessão simples)

> Modelo: **Sonnet** · Esforço: **médio** · ~30 min · Depende de: E01, E02 · Essencial.

## Objetivo
A tela `/prototipo/entrar` passa a funcionar de verdade, conforme a escolha D-018 (⭐ B: contato + senha com hash; botão "Entrar como João (demo)").

## Contexto necessário
- Tela: `frontend/src/prototype/pages/Login.tsx`, com as abas "entrar" e "criar". Hoje só valida no front e navega:
  - "Entrar" vai para `/prototipo`;
  - "Criar conta" vai para `/prototipo/entrevista`;
  - o botão demo usa `PRODUCER.name` de `mock.ts`.
- Modelos `Producer.contact/password_hash` e `AuthToken`, e a dependência `current_producer`: criados na E01 (`backend/app/auth.py`).
- O cliente do front guarda o token em `localStorage['agrobits.token']` (E02).

## Passos (🤖 AGENT EXECUTION)
1. Backend (`backend/app/routers/auth.py`, incluir em `main.py`):
   - `POST /api/auth/register {name, contact, password}` → 201 `{token, producer}`. O hash usa `hashlib.pbkdf2_hmac` com salt e é guardado como `salt$hash`. Contato repetido devolve 409.
   - `POST /api/auth/login {contact, password}` → `{token}`, ou 401 com mensagem em português.
   - `POST /api/auth/demo` → token do João. Antes de devolver, recria os dados do João (`seed` parcial) para a demo sempre começar limpa. Se ficar caro, só devolve o token e deixa o reset no botão "Recomeçar a demonstração".
   - `POST /api/auth/logout`.
   - Tokens com `secrets.token_urlsafe(32)`.
   - Contas novas começam **sem fazenda**; a fazenda nasce na entrevista (E04).
2. Front:
   - `Login.tsx` passa a chamar essas rotas e mostra o erro da API no campo certo;
   - "Criar conta" leva a `/prototipo/entrevista`, e "Entrar" leva a `/prototipo`, ou à entrevista quando `/api/me` disser que não há entrevista;
   - criar um botão "Sair" no `Shell.tsx`, no menu da conta, ou no rodapé da navegação lateral no desktop.
3. Guarda de rota no `ProtoApp.tsx`:
   - sem token e com a API respondendo → mandar para `/prototipo/entrar`;
   - **com a API fora → não bloquear**: segue no modo exemplo, como no protótipo.
4. Testes no backend: registrar, login certo e errado, contato duplicado, e conferir que `/api/me` com o token devolve a conta nova.

## Pronto quando
- É possível criar uma conta e, depois de sair, entrar de novo com a mesma senha.
- "Entrar como João (demo)" funciona.
- Senha errada mostra a mensagem certa.
- Os testes passam; `npm run build` passa.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` → `/prototipo/entrar` → "Criar conta" com o seu e-mail e uma senha qualquer: o app abre a entrevista.
2. "Sair", depois entrar de novo com a mesma senha.
3. "Entrar como João (demo)": a tela inicial aparece com os assuntos do João.

## 👥 Ações humanas
Nenhuma. **Não usem senhas reais** na demo: o ambiente é de teste.

## Scripts de subir
`SCHEMA_VERSION` só muda se os modelos mudarem nesta etapa. Se mudarem, aumente o número; os scripts recriam o banco sozinhos.
