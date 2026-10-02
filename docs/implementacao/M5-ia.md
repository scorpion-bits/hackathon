# M5 — IA real + passo a passo da chave

> **Sonnet · médio · ~40 min** · Depende de: M3 (e M1 para o histórico por conta).

## Objetivo
A tela "IA" (`/prototipo/assistente`) conversa com o backend.
- A IA **explica dados** usando as ferramentas que leem dados reais, e cita a fonte.
- Funciona **sem chave** (modo offline, já existe) e melhor **com chave** (Groq gratuito, D-020).
- O aviso "a IA explica dados, não dá receita" continua.

## Pendência vinda da M4
`pages/Assistant.tsx` ainda tem a **conversa de exemplo** com textos e números fixos (ex.: coordenada, "atualizada hoje às 06:00", adubo/custos em `components/views/demo.ts`).
Ela deve sair: a conversa passa a vir de `POST /api/assistant/chat`. Depois apague `components/views/demo.ts`.

## Situação atual
- `backend/app/assistant/engine.py`:
  - `chat()` usa o LLM se `AGROIA_LLM_API_KEY` e `AGROIA_LLM_MODEL` existirem; senão, ou se der erro, usa `_chat_offline()`;
  - o `SYSTEM_PROMPT` ainda fala de "gestão da propriedade" (app antigo).
- `tools.py` tem `farm_overview`, `get_field`, `get_zarc`, `get_weather`, `rain_history`, `check_agrofit`, `region_stats`, `get_alerts`…
- `routers/assistant.py`: `/status`, `/chat`, `/history`. O histórico **não filtra por conta** (o `producer_id` foi criado na M1).
- `frontend/src/prototype/pages/Assistant.tsx` (308 linhas): conversa **simulada**.
- O `.env` é lido por `dev.sh` e pelo `docker-compose` (`env_file`) e está no `.gitignore`. Modelo de configuração: `.env.example`.

## Passos (🤖 AGENT EXECUTION)
1. Rotas do assistente usam `current_producer`; histórico por conta; ferramentas usam a fazenda da conta.
2. Ferramenta nova `get_topics()` (os assuntos da M3) e `explain_topic(key)`.
3. `SYSTEM_PROMPT` novo:
   - a IA explica dados oficiais, não decide;
   - nunca produto nem dose (receituário, Lei 7.802/89);
   - para decidir, sugerir "Leve para um técnico — de graça";
   - citar fonte e data; dizer quando é previsão;
   - linguagem simples.
4. Modo offline: palavras-chave para as perguntas do roteiro (Zarc / quando plantar, chuva, "o que eu faço?" → enviar o caso).
5. Aceitar também `AGROBITS_LLM_*`, mantendo `AGROIA_*` por compatibilidade. Atualizar `.env.example` com comentários.
6. `Assistant.tsx`:
   - envia para `/api/assistant/chat` e mostra a resposta, as fontes (chips) e o selo "IA" ou "modo offline" (de `/status`);
   - as sugestões vêm dos assuntos.
7. `dev.sh`, `iniciar.sh` e `iniciar.ps1` mostram ao subir: "IA: ligada (<modelo>)" ou "IA: modo offline (sem chave)".
8. Teste: o offline responde às perguntas do roteiro com fonte; o histórico fica isolado por conta.

## 👥 HUMAN ACTION REQUIRED — ligar a IA com chave gratuita (≈10 min, 1 pessoa)
**Groq (recomendado):**
1. Acesse https://console.groq.com e crie a conta (Google ou e-mail). Use a conta da equipe, **sem cartão**.
2. Menu **API Keys** → **Create API Key** → nome `agrobits-hackathon` → **copie** a chave (começa com `gsk_`; ela só aparece uma vez).
3. Na pasta do projeto: Linux `cp .env.example .env` · Windows `copy .env.example .env`.
4. Abra o `.env` e preencha:
   ```
   AGROIA_LLM_BASE_URL=https://api.groq.com/openai/v1
   AGROIA_LLM_API_KEY=gsk_...sua_chave...
   AGROIA_LLM_MODEL=openai/gpt-oss-120b
   ```
5. `./iniciar.sh parar` e depois `./iniciar.sh` (Windows: `iniciar.bat parar` e depois `iniciar.bat`). A saída deve dizer "IA: ligada".
6. Teste na tela da IA:
   - "Quando eu planto o milho do Talhão 2?"
   - "Choveu mais que o normal?"
   - "O que é o Zarc?"
   - "Posso usar o fungicida no feijão?" (deve recusar a dose e indicar o técnico)

   Anote no chat as respostas ruins.

**Se o Groq falhar → Gemini:** https://aistudio.google.com/apikey → Create API key; no `.env`:
`AGROIA_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, `AGROIA_LLM_MODEL=gemini-2.5-flash`. Depois, siga do passo 5.

**Segurança:**
- **nunca** cole a chave no chat, no Hub, no GitHub ou nos slides;
- `git status` não pode listar o `.env`;
- se vazar, apague a chave no console e crie outra;
- cada notebook que for apresentar precisa do próprio `.env`; passem a chave em mensagem privada.

**Na demo:** sem internet, a IA cai sozinha para o modo offline. Ensaiem as duas situações.

## Pronto quando
Sem chave, responde em modo offline com fontes. Com chave, usa as ferramentas e cita fontes. `pytest` passa.
