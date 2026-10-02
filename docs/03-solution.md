# 03 — Solução

> Status: 🟡 **candidatas prontas — aguardando escolha da equipe (H-004)** · Checkpoint: CP3
> Base: catálogo oficial + critérios de avaliação. Dados ainda não abertos → estimativas sujeitas a revisão após o perfil.

## Candidatas

### A — AquaPivô: radar preditivo da irrigação e da pressão hídrica
- **Problema:** a irrigação por pivô cresceu muito em 35 anos e concentra-se em poucas bacias; gestores (ANA, comitês de bacia, secretarias, CEPIN) não têm uma visão de **onde ela vai crescer** e **onde já está perto do limite**.
- **Público:** gestores de recursos hídricos, comitês de bacia, prefeituras, extensão rural, pesquisadores.
- **Valor:** mapa animado 1985–2019 + **previsão por município (2020–2030)** + alerta "área atual vs. potencial (Atlas)" → priorizar onde monitorar/fiscalizar primeiro.
- **Dados:** Pivôs Mapeados + Área por Município (ANA/Embrapa) + Atlas de Irrigação 2021; opcional Cana fertirrigada (gancho regional Araraquara).
- **IA (CEPIN):** modelo preditivo (regressão/gradient boosting com séries + vizinhança espacial) + ranking/otimização de prioridades.
- **Dificuldade:** média · **MVP:** ~8–10h · **Risco:** baixo/médio · **Ética:** segura (sem pessoa física; agregação por município).
- **Demonstração:** mapa do Brasil "acendendo" de 1985 a 2019 → clique em município → previsão + semáforo de pressão.
- **Diferencial:** une passado (série), presente (Atlas) e futuro (previsão), com incerteza explícita.
- **Ponte robótica:** próximos passos = drones/robôs de inspeção priorizados pelo ranking.

### B — PivôVision: detecção de pivôs por visão computacional
- **Problema:** o mapeamento oficial para em 2019; atualizar exige muito trabalho manual.
- **Valor:** detectar pivôs novos em imagem de satélite gratuita (Sentinel-2) usando os pivôs da ANA como rótulos.
- **IA (CEPIN):** visão computacional (detecção de círculos/Hough ou CNN pequena).
- **Dificuldade:** alta · **MVP:** 12–16h · **Risco:** **alto** (baixar imagens com rede restrita, treino, falso positivo).
- **Demonstração:** forte ("uau"), se funcionar.

### C — Plantio Certo: calendário inteligente de plantio e manejo
- **Problema:** pequeno produtor não sabe consultar Zarc (portarias/PDF) nem quais defensivos são registrados para sua cultura/praga.
- **Valor:** escolhe município + cultura → janela de plantio de menor risco (Zarc) + produtos registrados para a praga, ordenados por **menor classe toxicológica** (Agrofit).
- **IA:** otimização da janela + busca em linguagem natural (modelo gratuito/local).
- **Dificuldade:** média · **MVP:** ~8h · **Risco:** médio (Zarc volumoso; não pode parecer receituário agronômico — exigido por lei).

### D — Seguro Rural Inteligente: onde o risco climático não está segurado
- **Problema:** subsídio ao seguro rural pode não chegar onde o risco climático é maior.
- **Valor:** cruza SISSER (apólices, sinistros) × Zarc → mapa de "lacuna de proteção" + modelo de sinistralidade + simulação de alocação do subsídio.
- **IA:** preditivo + otimização.
- **Dificuldade:** média/alta · **MVP:** ~10–12h · **Risco:** médio/alto (volume; **SISSER pode conter nome/CPF** → critério eliminatório exige anonimização cuidadosa).

### E — AgroTwin Open (proposta da equipe): gêmeo digital acessível para robótica agrícola
- **Problema:** robótica/agricultura de precisão depende de ecossistemas fechados, caros e calibrados para realidades estrangeiras; pequenos/médios produtores não conseguem "ver" a propriedade como ambiente para máquinas autônomas.
- **Público:** pequenos/médios produtores, cooperativas, operadores de robôs/drones, extensão rural, CEPIN.
- **Valor:** representação digital da área com camadas abertas (relevo, vegetação, clima, solo, risco) + simulação de frota: robôs com rotas que pesam declividade/umidade/solo/energia, drones focados em áreas de atenção.
- **IA (CEPIN):** otimização de rotas (A*/cobertura com custo multicritério) + priorização de áreas (modelo/score) — fala direto com "caminhos de automação/robótica".
- **Ponto crítico — regra da base pivô:** relevo/clima/solo/vegetação vêm de bases externas; sem âncora, a base MAPA/ANA vira enfeite.
- **E′ (variante proposta pelo Claude): AgroTwin sobre Pivôs** — cada **pivô central mapeado pela ANA/Embrapa** é a "unidade de gêmeo digital" (geometria real e pública, sem dado pessoal). Contexto de risco por Zarc (MAPA) + Atlas. Relevo: Topodata (INPE) ou Copernicus DEM; clima: INMET/NASA POWER.
- **Dificuldade:** alta · **MVP:** ~12–14h · **Risco:** médio/alto (muitas camadas externas, rede bloqueada no ambiente do Claude, tentação de 3D).
- **Ética:** não usar limites do CAR/proprietários; rotular claramente o que é **dado real** e o que é **simulação**.

### F — AgroIA (proposta da equipe, 02/10 ~11h15) — **em discussão de produto**
- Documento-base: branch `idv-victor` → `data/escopos/escopoInicial.pdf` (+ referências visuais e paleta).
- Visão: assistente agrícola que conhece o produtor (entrevista conversacional → perfil), mapa com talhões,
  chat com contexto + ferramentas, estoque, alertas, dashboard.
- **Análise do Claude (resumo):**
  - Pontos fortes: público claro (pequeno/médio produtor), princípio "IA interpreta, dados vêm de fontes determinísticas", ética já pensada.
  - **Risco de regra:** as fontes listadas (INMET, INPE, MapBiomas, IBGE, CONAB…) **não são bases "pivô"** do catálogo → é preciso ancorar em MAPA/ANA. Proposta: **Zarc como cérebro do planejamento** (+ Agrofit p/ estoque de defensivos).
  - **Risco de inovação:** "chatbot agrícola" é comum; diferencial precisa ser *IA que mostra a conta* com dado oficial por talhão.
  - **Risco de escopo:** documento planeja 3 dias e stack completa (auth, PostGIS, pgvector, LangGraph); temos ~21h.
  - **Fato que vira demo:** Zarc 2025-26, Araraquara, milho 1ª safra, solo argiloso: decêndio 28 (1–10/out) risco **30%** → decêndio 29 (11–20/out) **20%**; solo arenoso: 40% até 20/out, 20% a partir de 21/out. _[confirmar com safra 2026-27]_

#### F — visão consolidada (rodada 2, após esclarecimento da equipe)
- AgroIA = **plataforma modular de gestão + inteligência da propriedade**; IA é camada transversal (não o produto).
- **Espinha dorsal proposta: o Caderno de Campo (linha do tempo de eventos).** Todo acontecimento (plantio, aplicação,
  colheita, compra, observação) é um evento ligado a talhão/safra; estoque, custos, status do talhão e painel são **derivados** dos eventos.
- Módulos: Propriedade (perfil+mapa+talhões) · Produção (safras+caderno de campo) · Estoque (itens+movimentações) ·
  Custos (derivado) · Inteligência territorial (Zarc, clima, Agrofit) · Alertas · Painel · IA (perguntar, registrar, explicar, avisar).
- Estratégia de hackathon: **amplitude visível + 1 fio condutor profundo** (registrar plantio → estoque baixa → custo → linha do tempo → checagem Zarc → painel/alerta),
  com histórico demonstrativo de ~6 meses (produtor fictício, rotulado).

#### F — experiência (rodada 3)
- **Sistema web de gestão com navegação lateral**; toda operação do dia a dia é feita visualmente (formulários, mapa, tabelas). IA é complementar.
- Navegação: Painel · Mapa da propriedade · Produção (safras + caderno de campo) · Estoque · Clima · Alertas · Relatórios · Assistente IA · Perfil/Configurações.
- Integração visível: base única de dados + ação global "+ Registrar" + botões contextuais "Perguntar à IA sobre isto" em talhão, alerta, item de estoque e relatório.
- Demo começa pelo uso visual dos módulos; a IA entra no fim como camada que cruza tudo.

#### F — estratégia para vencer (rodada 4, recomendação do Claude)
- Posicionamento: **"o dado público que já existe, trabalhando para cada talhão"** — gestão + IA que interpreta dados abertos com fonte.
- Dados abertos no produto: Zarc (risco por talhão), Agrofit (checagem de defensivos do estoque), SIPEAGRO Aviação (drones/serviços na região, agregado),
  PSR/SISSER (seguro rural na região, agregado), clima (previsão), Pivôs ANA (opcional, camada de irrigação).
- Módulo extra barato e forte: **"Minha Região"** (inteligência territorial agregada por município).
- Modelo: B2B2C — gratuito para pequeno produtor; cooperativas, ATER/prefeituras e agentes de crédito/seguro pagam por painel regional e caderno de campo organizado.

## Comparação ponderada pelos critérios oficiais (nota 0–10 × peso)

| Critério (peso) | A AquaPivô | B PivôVision | C Plantio Certo | D Seguro | E AgroTwin (puro) | E′ AgroTwin sobre Pivôs |
|---|---|---|---|---|---|---|
| Relevância/impacto social (20) | 8 | 6 | 8 | 9 | 8 | 8 |
| Uso e análise dos dados (15) | 9 | 7 | 7 | 8 | 6 | 8 |
| Qualidade da solução (15) | 8 | 5 | 7 | 6 | 6 | 7 |
| Inovação/criatividade (15) | 7 | 10 | 6 | 7 | 10 | 10 |
| Protótipo/demonstração (15) | 9 | 7 | 8 | 6 | 9 | 9 |
| Viabilidade/continuidade (10) | 8 | 6 | 8 | 7 | 6 | 7 |
| Apresentação (10) | 9 | 8 | 7 | 7 | 9 | 9 |
| **Total (0–100)** | **82,5** | 69,5 | 73,0 | 72,5 | 77,5 | **83,0** |
| Risco de não entregar | baixo/médio | alto | médio | médio/alto | alto | médio/alto |
| Risco ético (eliminatório) | baixo | baixo | baixo | **médio/alto** | médio | baixo |
| Aderência CEPIN | preditivo + otimização | visão computacional | otimização | preditivo + otimização | robótica + otimização | robótica + otimização + preditivo |

## Recomendação do Claude (atualizada após proposta E)
**E′ — AgroTwin Open sobre Pivôs**, com escopo 2D controlado (ver resposta no chat / `04-mvp.md` após aprovação). A continua como plano B.

### Recomendação anterior
**A — AquaPivô**, com um "teaser" de B como COULD HAVE (detecção de pivôs em 2–3 recortes de imagem, se sobrar tempo).
- Maior nota ponderada e menor risco; dados limpos, geográficos, sem dado pessoal (blinda o critério eliminatório).
- Demo muito visual (mapa animado + previsão) — pontua em protótipo e apresentação.
- Usa 2–3 bases oficiais combinadas → pontua em "uso e análise dos dados".
- Gancho regional possível (cana fertirrigada, Araraquara) e ponte clara para robótica nos próximos passos.
- **Riscos:** série termina em 2019 (mitigar com previsão + incerteza explícita); "impacto social" precisa ser bem narrado (água = segurança hídrica e alimentar, conflito pelo uso).
- **Esforço:** MVP ~8–10h (2 agentes de dados + 1 front), pitch em paralelo.

## 👥 Decisão da equipe
- Escolhida: _pendente (H-004)_
