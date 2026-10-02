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

## Comparação ponderada pelos critérios oficiais (nota 0–10 × peso)

| Critério (peso) | A AquaPivô | B PivôVision | C Plantio Certo | D Seguro |
|---|---|---|---|---|
| Relevância/impacto social (20) | 8 | 6 | 8 | 9 |
| Uso e análise dos dados (15) | 9 | 7 | 7 | 8 |
| Qualidade da solução (15) | 8 | 5 | 7 | 6 |
| Inovação/criatividade (15) | 7 | 10 | 6 | 7 |
| Protótipo/demonstração (15) | 9 | 7 | 8 | 6 |
| Viabilidade/continuidade (10) | 8 | 6 | 8 | 7 |
| Apresentação (10) | 9 | 8 | 7 | 7 |
| **Total (0–100)** | **82,5** | 69,5 | 73,0 | 72,5 |
| Risco de não entregar | baixo/médio | alto | médio | médio/alto |
| Risco ético (eliminatório) | baixo | baixo | baixo | **médio/alto** |
| Aderência CEPIN | preditivo + otimização | visão computacional | otimização | preditivo + otimização |

## Recomendação do Claude
**A — AquaPivô**, com um "teaser" de B como COULD HAVE (detecção de pivôs em 2–3 recortes de imagem, se sobrar tempo).
- Maior nota ponderada e menor risco; dados limpos, geográficos, sem dado pessoal (blinda o critério eliminatório).
- Demo muito visual (mapa animado + previsão) — pontua em protótipo e apresentação.
- Usa 2–3 bases oficiais combinadas → pontua em "uso e análise dos dados".
- Gancho regional possível (cana fertirrigada, Araraquara) e ponte clara para robótica nos próximos passos.
- **Riscos:** série termina em 2019 (mitigar com previsão + incerteza explícita); "impacto social" precisa ser bem narrado (água = segurança hídrica e alimentar, conflito pelo uso).
- **Esforço:** MVP ~8–10h (2 agentes de dados + 1 front), pitch em paralelo.

## 👥 Decisão da equipe
- Escolhida: _pendente (H-004)_
