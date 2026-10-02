# E11 — IA: assistente real (modo offline + chave da equipe)

> Modelo: **Opus** · Esforço: **alto** · ~1h · Depende de: E06 (assuntos), E03 (conta) · Essencial.

## Objetivo
A tela "IA" do protótipo (`/prototipo/assistente`) conversa com o backend de verdade.
- A IA **explica dados** ("o que é o Zarc?", "choveu mais que o normal?", "por que esperar até 21/10?") usando **ferramentas** que leem os dados reais.
- Toda resposta cita a fonte, e o aviso "a IA explica dados, não dá receita" continua.
- Funciona **sem chave** (modo offline, por palavras-chave) e fica melhor **com chave** (LLM gratuito, D-020).

## Contexto necessário
- `backend/app/assistant/engine.py`:
  - `chat()` usa o LLM se `AGROIA_LLM_API_KEY` e `AGROIA_LLM_MODEL` existirem; senão, ou se der erro, usa `_chat_offline()`;
  - `SYSTEM_PROMPT` ainda descreve o app antigo ("gestão da propriedade") → atualizar para o modelo A.
- `backend/app/assistant/tools.py`: `farm_overview`, `get_field`, `get_stock`, `get_costs`, `get_zarc`, `get_weather`, `rain_history`, `plan`, `check_agrofit`, `region_stats`, `get_alerts`.
- `backend/app/routers/assistant.py`: `/api/assistant/status`, `/chat`, `/history`. O `ChatMessage` **não tem produtor**: todas as contas veem o mesmo histórico, e isso precisa ser corrigido.
- `frontend/src/prototype/pages/Assistant.tsx` (308 linhas): conversa simulada com respostas de exemplo e o banner do aviso.
- Variáveis: `.env.example`. `dev.sh` carrega o `.env`; o `docker-compose.yml` usa `env_file: .env`. O `.env` está no `.gitignore`.

## Passos (🤖 AGENT EXECUTION)
1. `ChatMessage.producer_id` e histórico por produtor (aumentar `SCHEMA_VERSION`).
2. Ferramentas novas:
   - `get_topics()`: os assuntos da E06;
   - `explain_topic(key)`: evidências e fontes de um assunto;
   - `get_context()`: o resumo da entrevista, **sem** renda exata, só a faixa.
3. Ferramentas existentes passam a usar o produtor atual. `get_stock` e `get_costs` continuam só se houver estoque.
4. `SYSTEM_PROMPT` novo:
   - AgroBits = dados abertos + contexto; a IA explica, não decide;
   - nunca recomendar produto ou dose (receituário, Lei 7.802/89);
   - para decidir, sugerir "Leve para um técnico — de graça" (link do Resolver do assunto);
   - linguagem simples; citar fonte e data; dizer quando o dado é previsão ou estimativa.
5. Modo offline: rotas por palavra-chave para as perguntas da demo (Zarc, chuva, assunto atual, "o que eu faço?" → orienta enviar o caso).
6. Aceitar também `AGROBITS_LLM_*`, mantendo os nomes `AGROIA_*` por compatibilidade. Atualizar `.env.example` e o `README.md`.
7. Front:
   - `Assistant.tsx` envia para `POST /api/assistant/chat` e mostra a resposta, as fontes (chips) e o modo ("IA" ou "modo offline", vindo de `/status`);
   - as sugestões de pergunta vêm dos assuntos atuais;
   - o botão "Perguntar à IA" no Resolver abre o assistente já com `context = {topic_key}`.
8. Testes: o offline responde às 5 perguntas da demo com fonte; o histórico é isolado por conta; sem chave, `/status` → offline.
9. **Ao terminar, entregar à equipe o passo a passo abaixo** e esperar que façam o teste com a chave.

## 👥 HUMAN ACTION REQUIRED — ligar a IA com chave gratuita (≈10 min, 1 pessoa)

**Opção recomendada: Groq (D-020)**

1. Acesse https://console.groq.com e crie a conta (Google ou e-mail). **Use a conta da equipe**, não uma pessoal com cartão.
2. No menu, abra **API Keys** → **Create API Key** → nome `agrobits-hackathon` → **copie a chave** (começa com `gsk_`; ela só aparece uma vez).
3. Na pasta do projeto, crie o arquivo `.env` a partir do exemplo:
   - Linux: `cp .env.example .env`
   - Windows: `copy .env.example .env`
4. Abra o `.env` num editor e preencha **só** a linha da chave:
   ```
   AGROIA_LLM_BASE_URL=https://api.groq.com/openai/v1
   AGROIA_LLM_API_KEY=gsk_...sua_chave...
   AGROIA_LLM_MODEL=openai/gpt-oss-120b
   ```
5. Reinicie: `./iniciar.sh parar` e depois `./iniciar.sh` (Windows: `iniciar.bat parar` e depois `iniciar.bat`).
6. Confira em http://localhost:8000/api/assistant/status: deve aparecer `"mode": "llm"`. Na tela da IA, o selo muda de "modo offline" para "IA".
7. Faça as 5 perguntas da demo (lista em `docs/07-testing.md`, ou estas) e anote no chat as respostas ruins:
   - "Quando eu planto o milho do Talhão 2?"
   - "Choveu mais que o normal no último mês?"
   - "O que é o Zarc?"
   - "Posso usar o fungicida que tenho no feijão?" (deve recusar a dose e indicar o técnico)
   - "Vai chover essa semana?"

**⚠️ Segurança:**
- **Nunca** cole a chave no chat, no Hub, no GitHub ou no pitch.
- O `.env` já é ignorado pelo git. Confira com `git status`: ele **não** pode aparecer na lista.
- Se a chave vazar, apague-a no console do Groq e crie outra.
- Cada computador que for apresentar precisa do próprio `.env`. Passem a chave pessoalmente ou por mensagem privada, nunca no repositório.

**Alternativa: Google Gemini** (se o Groq falhar)
1. Acesse https://aistudio.google.com/apikey → **Create API key** → copie a chave.
2. No `.env`:
   ```
   AGROIA_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
   AGROIA_LLM_API_KEY=...sua_chave...
   AGROIA_LLM_MODEL=gemini-2.5-flash
   ```
3. Siga a partir do passo 5 acima.

**Na hora da demo:** se a internet do evento cair, a IA cai sozinha para o modo offline. Ensaiem a demo **também** sem chave.

## Pronto quando
- Sem chave: a tela da IA responde às perguntas da demo com fontes, no modo offline.
- Com chave: as respostas usam as ferramentas e citam fontes.
- Os testes passam.

## 🧪 Como a equipe testa
Os passos 5–7 do bloco 👥 acima. Sem chave: as mesmas perguntas, esperando respostas mais simples, mas com fonte.

## Scripts de subir
- Atualizar `.env.example` com os comentários do passo a passo.
- Fazer `iniciar.sh`, `iniciar.ps1` e `dev.sh` mostrarem na saída "IA: modo offline (sem chave)" ou "IA: ligada (<modelo>)".
