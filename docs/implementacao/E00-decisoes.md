# E00 — Decisões da equipe antes de começar

> 👥 **HUMAN ACTION REQUIRED** · ~10 min · sem código.
> Respondam no chat, por exemplo "D-017 sim, D-018 B, D-019 sim, D-020 Groq, D-021 A".
> Quem estiver com o Claude registra as respostas na seção 6 do `README.md` e em `docs/06-decisions.md`.
> Se a equipe não responder, valem as **recomendações** (marcadas ⭐), para não travar a madrugada.

## D-017 — O protótipo vira o app principal?
- ⭐ **Sim:** o protótipo passa a abrir em `/`. O app antigo continua acessível em `/legado` (nada é apagado) e é retirado da navegação.
- Não: as duas versões ficam lado a lado, e a demo é feita em `/prototipo`.

Motivo: a banca vê uma única aplicação, sem a palavra "protótipo" na URL. Esforço: E12 (25 min).

## D-018 — Como funciona "Entrar / Criar conta"?
- **A — sem senha:** "Entrar como João (demo)" ou "criar conta" informando só nome e contato. Mais rápido, mas qualquer pessoa entra em qualquer conta.
- ⭐ **B — senha simples:** contato + senha guardada com hash (biblioteca padrão do Python, sem dependência nova) e um token salvo no navegador. Continua existindo o botão "Entrar como João (demo)".

Motivo: a banca pode perguntar sobre segurança e LGPD. B custa uns 10 minutos a mais que A. Recuperação de senha e verificação de contato ficam para depois e entram no pitch como "próximos passos".

## D-019 — Resposta do técnico na demo
- ⭐ **Simulada e rotulada:** o botão "Simular resposta (demo)" grava uma resposta de exemplo no caso, marcada "exemplo".
- Outra opção: um painel do técnico (`/tecnico`) para responder os casos de verdade. É mais convincente, mas custa cerca de 1h a mais. Fica como backlog e entra se sobrar tempo depois da E13.

## D-020 — Provedor de IA (custo da equipe, D-004)
- ⭐ **Groq, plano gratuito**, modelo `openai/gpt-oss-120b`. É o que o código já espera, não pede cartão e as instruções estão na E11.
- **Google Gemini**, plano gratuito (`gemini-2.5-flash`), também sem cartão.
- **Só modo offline:** respostas por palavra-chave, sem chave nenhuma. Funciona sempre, mas soa menos natural.

Em qualquer escolha, o modo offline continua como reserva automática se a chave falhar na hora da demo.

## D-021 — Estoque (sementes e defensivos) para os assuntos
A entrevista não pergunta o estoque, mas dois assuntos dependem dele: "sementes não bastam" e "fungicida vence".
- ⭐ **A:** esses dois assuntos aparecem só quando há estoque cadastrado. O João da demo tem estoque (seed); uma conta nova não vê esses dois.
- **B:** acrescentar uma pergunta curta de estoque na entrevista (+30 min na E04).

## Também confirmem (operacional, só avisar se discordarem)
- O banco de dados continua sendo **SQLite** (`data/app.db`). Para a hackathon não precisa de servidor de banco.
- Cada conta tem **uma propriedade**. Várias propriedades por conta ficam para depois.
- Assuntos são **calculados na hora** a partir dos dados abertos e do contexto; só o que o produtor faz é guardado (casos, assuntos resolvidos).
