# 00 — Contexto

> Fatos do evento e da equipe. Nada aqui é suposição sobre o tema.

## Evento

- **Nome:** 1ª Hackathon de Dados Abertos do IFSP Araraquara
- **Formato:** presencial (02/10) + retorno (03/10)
- **Fuso:** BRT (UTC-3)

| Quando | O quê |
|---|---|
| 02/10 08h30 | Instruções gerais, apresentação do tema e da base de dados |
| 02/10 09h00 | Início oficial do desenvolvimento |
| 02/10 09h00–22h00 | Desenvolvimento presencial |
| 03/10 07h45 | Retorno |
| 03/10 09h00 | **Prazo máximo de entrega** |

## Entregáveis obrigatórios

1. Protótipo funcional / entregável
2. Repositório GitHub (este)
3. PDF de apresentação / pitch

## Equipe

- 6 integrantes humanos (nomes/papéis: preencher — ver `planning/agents.md` §Equipe humana)
- Claude como orquestrador técnico + agentes especializados

## Tema e dados

> Preencher às 08h30 de 02/10 com o que a organização apresentar. Copiar literalmente.

- **Tema (literal):** "Inteligência Artificial e/ou Robótica Agrícola aplicada à Dados Abertos na área da Agricultura"
- **Local:** Laboratório INFO 01 — IFSP Araraquara (02–03/10/2026)
- **Slogan:** "27 horas. Uma ideia. Um protótipo." · 24h de desenvolvimento a partir das 09h00 de 02/10
- **Entrega (slide):** 01 Protótipo funcional · 02 Link do projeto (GitHub ou similar) · 03 PDF do pitch
- **Presencial:** computadores do lab disponíveis (ou equipamento próprio); café o tempo todo;
  **ao menos 1 integrante precisa estar no local** para as mentorias acontecerem.
- **Cronograma (slide):** 09h00–22h00 laboratório aberto sem interrupção; 03/10 07h45 reabre; 09h00 prazo.
- **Mentoria:** Samuel, Bernardo e Yagor (vencedores da Hackathon do TCU — Climaton 2026) + professores do IFSP circulando. "Perguntem · Testem ideias · Peçam direção".
- **Fonte de dados indicada:** Portal Brasileiro de Dados Abertos — dados.gov.br (19 mil+ conjuntos, 309 organizações); bases do **MAPA** e da **ANA** aparecem nele.
- **Licença:** maioria das bases MAPA/ANA é CC-BY (uso livre, inclusive comercial, com crédito). Conferir a licença de cada base.
- **Regras de ética (slide "Usem com ética"):**
  1. Citar a fonte e a data de extração
  2. Não distorcer o dado pra caber numa narrativa
  3. Representar a incerteza — dataset tem lacuna e atraso
  4. Nunca cruzar bases pra reidentificar uma pessoa (LGPD vale para dado pessoal mesmo de fonte aberta)
- **Dado sensível — não expor:** nome completo, CPF, endereço exato, telefone, e-mail pessoal, imagem de rosto, dado de saúde de pessoa física.
- **Agenda temática — CEPIN** (Centro de Pesquisa e Inovação em IA e Robótica Agrícola, sediado no IFSP Araraquara):
  projetos que conversem com **visão computacional, modelos preditivos, otimização e caminhos de automação/robótica a partir de dados públicos**.
- **Caminho 1 — MAPA:** dados.gov.br → Organizações → "Agricultura" → "MAPA — Ministério da Agricultura e Pecuária" (13 conjuntos), ou direto em `dados.agricultura.gov.br`.
- **Caminho 2 — ANA/Embrapa:** dados.gov.br → Conjuntos de dados → buscar "pivô"/"irrigação" → **"Agricultura Irrigada por Pivôs Centrais — Pivôs Mapeados 1985–2019"** (ANA em parceria com Embrapa).
- **REGRA ÚNICA (literal):** "Todo projeto usa pelo menos uma base "pivô" — do portal do MAPA ou da ANA/Embrapa — e pode combiná-la com qualquer outra base aberta que a equipe encontrar. A combinação é com vocês. Não vamos sugerir o que construir."
- **Uso de IA:** permitido, ferramentas livres. Organização/IFSP não pagam assinaturas, APIs, créditos ou tokens — **despesa é da equipe; preferir alternativas gratuitas**.
- **Regras específicas:** ver regra única + ética acima
- **Critérios de avaliação:** _pendente_ (perguntar à organização se não forem informados)
- **Formato do pitch:** _pendente_ (duração, ao vivo ou gravado, tem demo?)
- **Forma de entrega:** _pendente_ (link do repo? formulário? e-mail?)

## Perguntas a fazer à organização (08h30)

- [ ] Quais são os critérios de avaliação e seus pesos?
- [ ] Qual a duração do pitch? Há demonstração ao vivo?
- [ ] Como e onde entregar (repo, PDF, link do protótipo)?
- [ ] Podemos usar dados externos complementares (IBGE, etc.)?
- [ ] Podemos trabalhar remotamente entre 22h00 e 07h45?
- [ ] O protótipo precisa estar publicado (URL) ou pode rodar localmente?
- [ ] Há restrição de uso de IA / bibliotecas / serviços pagos?
- [ ] Há internet estável no local? (impacta deploy e demo)
