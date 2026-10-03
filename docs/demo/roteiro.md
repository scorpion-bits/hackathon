# Roteiro da demo — AgroBits (3 minutos)

> Endereço único: **http://localhost:5173** (o app antigo ficou em `/legado`, não usar na apresentação).
> Quem fala: apresentador. Quem clica: o mesmo, no notebook; o celular fica ligado na mesma rede (`http://<IP do notebook>:5173`) para a cena do celular.
> Todo dado de fonte aberta na tela é **real** (Zarc, Agrofit, Open-Meteo, NASA). Só a conta (João, sítio, talhões, casos, respostas) é fictícia e vem com o selo **"conta de demonstração"**.

## Roteiro A — conta existente (João) · ~2 min

| # | Tempo | Clique | Fala |
|---|---|---|---|
| 1 | 0:00 | Tela de entrada → **Entrar como João (demo)** | "O produtor abre o AgroBits e entra. Esta é uma conta de demonstração: o João e o sítio são fictícios, **os dados do governo são reais**." |
| 2 | 0:15 | **Início** (o topo e o primeiro cartão) | "O AgroBits leu milhões de registros oficiais — Zarc, Agrofit, seguro rural — e separou **sete assuntos** que valem para a roça dele, um de cada vez. Aqui: *quando plantar o milho do Talhão 2?* Plantar agora tem 40% de risco; esperar até 21/10 cai para 20%." |
| 3 | 0:40 | **Resolver agora** → rolar a tabela de risco | "Isto é o Zarc do MAPA, para o município, a cultura e o solo dele. Fonte e data aparecem em cada dado." |
| 4 | 0:55 | Descer: **Caminhos possíveis** (marcar um) | "O AgroBits **não decide** por ele. Mostra os caminhos que saem dos dados oficiais, com os prós e contras." |
| 5 | 1:10 | **Leve para um técnico — de graça** → marcar a autorização → **Enviar meu caso** | "E aqui está a ideia central: **o AgroBits não substitui o agrônomo — leva a assistência técnica pública até quem nunca foi atendido, com os dados oficiais já organizados.** O caso já vai preenchido para a CATI, o Senar ou a prefeitura, sem custo para o produtor." |
| 6 | 1:30 | **Meus casos** → **Simular resposta (demo)** | "Ele acompanha o caso: enviado, recebido, respondido. A resposta aqui é simulada; as instituições são exemplo de integração, ainda sem convênio." |
| 7 | 1:45 | **Mapa vivo** (abre em "Quando plantar?": cores do Zarc nos talhões) → tocar **"A lavoura está verde?"** (o mapa se afasta para a região) | "O risco oficial aparece em cada talhão. E a imagem de vegetação da NASA mostra a região — cada ponto tem ~300 m, por isso o mapa se afasta: é a região, não o talhão." |
| 8 | 1:55 | **Pergunte à IA**: *"Qual o risco para plantar milho agora?"* | "A IA só **explica os dados**: cita a fonte e manda para o técnico. Não dá receita nem dose." |

## Roteiro B — conta nova · ~1 min

| # | Tempo | Clique | Fala |
|---|---|---|---|
| 1 | 2:00 | **Sair** → **Experimentar como novo usuário** | "Agora um produtor de verdade, que nunca usou." |
| 2 | 2:05 | Entrevista: *Pequeno produtor* → município **Ribeirão Preto** → **Desenhar talhão** (4 toques + fechar no 1º) → *Soja*, *Argiloso*, *Não irrigo* → **Continuar** → **Pular** nas demais → **Ver o que fazer hoje** | "Quase só cliques. Ele escolhe o município e desenha o talhão no mapa." |
| 3 | 2:40 | **Início** da conta nova | "Pronto: os assuntos dele já aparecem, calculados com os dados reais **do município que ele escolheu**." |
| 4 | 2:50 | Fechar | "Dados abertos no centro, o contexto do produtor filtra, e a decisão fica com quem entende: o técnico público." |

## Se algo falhar
- **Chuva forte não aparece hoje:** o assunto "O que muda com tanta chuva?" depende da previsão real. Se não estiver na lista, **mostrar o assunto do Zarc** (*Quando plantar o milho do Talhão 2?*). Ele não depende da previsão.
- **Mapa:** se aparecer o aviso "Sem imagem … (nuvem, ou o satélite não passou)", é verdade — diga isso e troque para "Quando plantar?" ou "A lavoura está verde?". Evite "Está muito quente?" (nuvens tiram a imagem com frequência).
- **Pivôs (ANA):** Dados abertos → "Pivôs centrais" → Ver dados mostra o município e os vizinhos (série 1985–2019, consultada ao vivo). Bom para citar a base pivô do regulamento.
- **Fonte fora do ar:** a tela avisa ("dado real de <data>" ou "indisponível") e o assunto daquela fonte some. Diga isso em voz alta: "o sistema nunca inventa dado".
- **Plano B sem internet:** os dados do MAPA (Zarc, Agrofit, PSR, SIPEAGRO) estão no banco local e continuam funcionando. Ficam sem resposta: previsão (Open-Meteo), chuva dos últimos 30 dias (NASA POWER, só o último valor guardado, com data), imagens de satélite do mapa, pivôs da ANA (sem cache) e a busca do município na entrevista. Roteiro A funciona quase inteiro (pular o Mapa vivo); evite o Roteiro B. A IA responde em modo offline (sem chave), com as mesmas regras.
- **Algo travou:** `./iniciar.sh resetar` (Windows: `iniciar.bat resetar`) e abrir de novo. A conta João sempre volta ao estado inicial ao entrar.

## Checklist antes de apresentar (notebook da apresentação)
1. `git pull` e `./iniciar.sh atualizar`.
2. Criar o `.env` com a chave da IA (passo a passo em `docs/implementacao/M5-ia.md`). Sem chave a IA funciona em modo offline; a tela de subida mostra "IA: ligada" ou "IA: modo offline".
3. `./iniciar.sh resetar` e testar **com a internet do evento**.
4. Abrir http://localhost:5173 — deve cair na tela de entrada (se abrir logado, clicar em Sair).
5. Rodar o Roteiro A inteiro uma vez e conferir: previsão de 7 dias aparece, mapa carrega, caso é enviado.
6. Abrir `http://localhost:5173` também no celular (mesma rede) e conferir o layout.
7. Zoom do navegador em 100–125%, notificações desligadas, bateria carregada.
8. Teste automático (opcional): com o app rodando, `python3 tests/e2e_demo.py`.
