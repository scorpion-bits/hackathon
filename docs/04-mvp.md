# 04 — MVP: AgroIA

> Status: 🟡 **proposta — aguardando aprovação (H-005)** · Checkpoint: CP4
> Base: visão consolidada em `docs/03-solution.md` (F, rodadas 1–4).

## Proposta de valor
**"O dado público que já existe, trabalhando para cada talhão."**
Sistema web de gestão da propriedade rural (mapa, produção, estoque, clima, alertas, relatórios) em que a IA interpreta
dados abertos oficiais (MAPA) para a realidade de cada talhão, sempre com fonte e data.
Gratuito para o pequeno/médio produtor; cooperativas, ATER e agentes de crédito/seguro como clientes pagantes (B2B2C).

## Princípios (valem para todas as telas)
1. Tudo funciona **sem a IA**; a IA cruza, explica e acelera.
2. **Base de dados única**: um registro alimenta todos os módulos (evento → estoque → custo → painel → alertas).
3. Todo dado oficial mostra **selo de fonte + data de extração**; dado declarado ≠ dado oficial ≠ estimativa.
4. IA **não inventa números**: só usa o que as ferramentas retornam; falta de dado → pergunta.
5. Sem dado pessoal de terceiros: bases com pessoas físicas só **agregadas por município**.
6. Produtor de demonstração **fictício e rotulado** (João, Araraquara/SP).

## MUST HAVE — sem isso não há demo (🟢)
| ID | Funcionalidade | Critério de aceite |
|---|---|---|
| M1 | **Layout** com navegação lateral, topo com propriedade, sino de alertas e botão **+ Registrar** | Todas as rotas acessíveis; identidade visual única |
| M2 | **Painel**: cartões (área, talhões, safra, valor em estoque, gasto da safra), mapa miniatura, alertas ativos, atividades recentes, clima de hoje | Muda imediatamente após registrar evento/movimentação |
| M3 | **Mapa**: desenhar/editar/excluir polígono por vértices; área em ha calculada; ficha do talhão (nome, cultura, solo, irrigação, situação) | Talhão salvo reaparece após recarregar |
| M4 | **Produção**: safras; lista de talhões com situação calculada; **linha do tempo** (plantio, aplicação, colheita, observação) filtrável | Plantio/aplicação com insumo **baixa estoque e gera custo** |
| M5 | **Estoque**: itens (categoria, unidade, quantidade, mínimo, validade, fornecedor, preço); entrada (compra) e saída; histórico | Quantidade sempre = soma das movimentações |
| M6 | **Zarc por talhão**: faixa dos 36 decêndios com risco (20/30/40%/não indicado) para cultura + solo + município; marcador "hoje" | Bate com o CSV oficial (teste automatizado) |
| M7 | **Alertas no painel**: estoque baixo · validade ≤ 30 dias · plantio fora/alto risco Zarc · chuva forte prevista | Cada alerta tem "por que importa" + talhões/itens afetados |
| M8 | **Assistente IA** com acesso a todos os módulos via ferramentas; **cartão de fontes** em cada resposta; botões contextuais "Perguntar à IA sobre isto" (alerta, talhão) | 10 perguntas-teste respondidas sem número inventado |
| M9 | **Dados demonstrativos**: João, 3 talhões, ~6 meses de histórico (safra anterior, compras, aplicações, colheita) | Painel nasce "vivo"; rótulo "dados fictícios" visível |

## SHOULD HAVE — importantes, removíveis (🟡)
| ID | Funcionalidade |
|---|---|
| S1 | **Clima**: condição atual + previsão 7 dias + chuva acumulada para a localização da propriedade |
| S2 | **Relatórios**: custo por safra / talhão / categoria; consumo de insumos; produção colhida |
| S3 | **Minha Região**: painel do município com dados abertos agregados (culturas Zarc, drones/autorizações SIPEAGRO, apólices PSR) |
| S4 | **Agrofit no estoque**: ao cadastrar defensivo, mostrar se é registrado p/ a cultura + classe toxicológica/ambiental (informativo, sem receita) |
| S5 | **Registro por conversa**: IA transforma frase em registro → formulário pré-preenchido → produtor confirma |
| S6 | **Perfil** + "O que o AgroIA sabe sobre você" (fatos com origem: declarado / registro / oficial) |

## COULD HAVE — só se sobrar tempo
- C1 Entrevista guiada inicial (onboarding conversacional com respostas rápidas)
- C2 Resumo da semana no painel (gerado pela IA só com dados do sistema)
- C3 Exportar caderno de campo (PDF/CSV)
- C4 Camada Pivôs ANA no mapa · C5 Voz no assistente

## NÃO FAZER no hackathon (vira "em breve"/roadmap)
Login/autenticação · múltiplos produtores · permissões · satélite/NDVI · foto de planta · WhatsApp · mercado/preços ·
políticas públicas detalhadas · IoT/drones reais · app mobile nativo · offline.

## Demo flow (~4 min)
1. **Problema** (Thales): dado público existe, mas não chega ao talhão.
2. **Painel do João** (histórico fictício rotulado): "esta é a fazenda dele no AgroIA".
3. **Ao vivo**: Mapa → desenha talhão → Estoque → registra compra de semente → Produção → registra plantio.
   Banca vê estoque, custo, linha do tempo e painel mudarem juntos.
4. **Alerta** aparece (Zarc: "plantio em período de 30% de risco" / chuva forte) → abrir → **Perguntar à IA** →
   resposta cruzando talhão + Zarc + clima + estoque, com cartão de fontes.
5. **Pergunta de gestão**: "Quanto gastei com fertilizante nesta safra?" → total + detalhamento.
6. **Minha Região** (dados abertos agregados) → **roadmap** (satélite, voz, drones) → modelo B2B2C.

## Plano B da demo
- Internet cai → app roda local; clima com última previsão em cache; IA com respostas pré-validadas + vídeo gravado.
- IA falha → mesmas informações visíveis nos módulos (por isso tudo funciona sem IA).

## Corte de segurança
Se às **17h** o fio condutor (M3→M5→M4→M2→M7) não estiver de pé: S2–S6 viram "em breve" e todos focam no fio condutor.
