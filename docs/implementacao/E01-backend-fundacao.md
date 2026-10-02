# E01 — Fundação do backend

> Modelo: **Opus** · Esforço: **alto** · ~50 min · Depende de: E00 · Essencial.

## Objetivo
Preparar o banco e a API para **várias contas**, guardar **entrevista, casos e assuntos resolvidos**, e fazer o João da demo
ficar **idêntico ao protótipo** (mesmos talhões e coordenadas). A tela ainda não muda nesta etapa.

## Contexto necessário
- `backend/app/models.py` já tem `Producer`, `Farm`, `Field` (geometria GeoJSON, `crop`, `soil`, `irrigated`, `color`), `ProfileFact` e estoque.
- `backend/app/services/farmdata.py:get_farm()` devolve **a primeira fazenda do banco**, porque o app antigo era de um usuário só.
- `scripts/seed_demo.py` apaga e recria tudo (`drop_all`/`create_all`). Hoje os talhões são retângulos gerados (`rect`), que **não batem** com
  os polígonos do protótipo em `frontend/src/prototype/mock.ts` (`FIELDS[].poly`, [lon, lat]).
- A entrevista do front produz um objeto `Answers` (`frontend/src/prototype/components/interview/types.ts`). As respostas do João estão
  em `DEMO_ANSWERS` (procurar com `grep -rn DEMO_ANSWERS frontend/src/prototype`).
- O `app.db` é criado com `create_all`, que **não altera tabelas existentes**. Por isso precisamos de um controle de versão do esquema.

## Passos (🤖 AGENT EXECUTION)
1. **Versão do esquema** em `backend/app/db.py`:
   - criar a constante `SCHEMA_VERSION = 2`, gravada com `PRAGMA user_version`;
   - criar `schema_outdated() -> bool`, verdadeira quando o arquivo não existe ou a versão gravada é diferente.
2. **`scripts/seed_demo.py --if-needed`**: só recria o banco quando `schema_outdated()` for verdadeira; ao terminar, grava a versão.
   - Trocar o seed incondicional por esse comando em `dev.sh`, `docker/backend-entrypoint.sh` e `iniciar.ps1`.
   - O `resetar` continua forçando a recriação.
3. **Modelos novos** (`models.py`):
   - `Producer`: acrescentar `contact` (único, pode ser nulo), `password_hash` (pode ser nulo), `created_at`.
   - `AuthToken(token PK, producer_id, created_at)`.
   - `Interview(producer_id PK, answers JSON, updated_at)`: as respostas brutas da entrevista, a fonte da verdade do "Meu contexto".
   - `Case`:
     - identificação: `id`, `producer_id`, `protocol` (único, `AB-1001`…), `topic_key`, `field_id` (pode ser nulo);
     - encaminhamento: `expert_id`, `channel`, `path` (caminho escolhido), `note`;
     - `snapshot` (JSON com evidências, fontes e datas no momento do envio, para o técnico ver o mesmo que o produtor viu);
     - `consent_at`, `status` (enviado|recebido|respondido), `reply`, `reply_is_example` (bool), `created_at`.
   - `TopicState(producer_id, topic_key, PK composta; choice, updated_at)`: substitui o "resolvido" que hoje fica no localStorage.
4. **Produtor atual**: criar `backend/app/auth.py` com a dependência `current_producer(session, authorization header)`.
   - Com token válido, devolve o produtor dele.
   - Sem token, devolve o **produtor demo** (`is_demo=True`), para o app antigo continuar funcionando.
   - Criar `farmdata.get_farm(session, producer=None)`: com produtor, filtra pela fazenda dele; sem produtor, mantém o comportamento atual.
   - Trocar `farm_or_404` em `routers/api.py` para usar o produtor atual. Rotas de talhão e evento devem conferir que o item pertence à fazenda (403 se não).
5. **Seed do João = protótipo**:
   - usar os polígonos de `mock.ts FIELDS` (copiar as coordenadas para o seed, fechando o anel);
   - usar as mesmas culturas, solos e cores (`irrigated=True` no Talhão 3), com nome "João da Silva (fictício)";
   - gravar `Interview` com as respostas do `DEMO_ANSWERS` (salvar em `backend/app/fixtures/demo_answers.json` e ler no seed);
   - manter o estoque (D-021) e o histórico de eventos que já existem;
   - contato demo: `joao@demo.agrobits`, sem senha (entrada só pelo botão demo).
6. **Testes** (`backend/tests/test_core.py` ou um novo `test_accounts.py`):
   - o seed cria 3 talhões com áreas próximas de 5,36 / 3,08 / 2,05 ha;
   - `schema_outdated()` passa a ser falsa depois do seed;
   - sem token, a API devolve o João.

## Pronto quando
- `cd backend && pytest -q` passa com os testes novos.
- `./dev.sh` em uma máquina com `app.db` antigo recria o banco sozinho (a mensagem "banco atualizado" aparece) e sobe.
- `GET /api/fields` traz os 3 talhões com as **mesmas coordenadas** do protótipo.
- O app antigo em `/` continua abrindo.

## 🧪 Como a equipe testa
1. `./iniciar.sh atualizar` (Windows: `iniciar.bat atualizar`).
2. Abrir http://localhost:8000/docs → `GET /api/fields` → "Try it out": aparecem os 3 talhões do João.
3. Abrir http://localhost:5173/prototipo: tudo igual a antes (o front ainda usa os dados de exemplo).

## 👥 Ações humanas
Nenhuma. Se alguém tiver o `data/app.db` aberto em um visualizador de SQLite, feche antes de subir.

## Scripts de subir
Obrigatório nesta etapa: trocar o seed por `seed_demo.py --if-needed` em `dev.sh`, `docker/backend-entrypoint.sh` e `iniciar.ps1` (se este chamar o seed).
