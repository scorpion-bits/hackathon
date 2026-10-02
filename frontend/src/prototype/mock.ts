// DADOS DE EXEMPLO DO PROTÓTIPO VISUAL (D-009).
// Números marcados como "real" vêm das bases analisadas em docs/02-data-analysis.md; o resto é ilustrativo.
// Nada aqui chama a API — o objetivo é validar telas antes de implementar.

export type Origin = 'real' | 'ilustrativo'

export const PRODUCER = {
  name: 'João', fullName: 'João da Silva (fictício)', farm: 'Sítio Boa Esperança', municipality: 'Araraquara', uf: 'SP',
  geocode: '3503208', lat: -21.832, lon: -48.236, area_ha: 10.5, profile: 'Produtor familiar', incomeBand: 'R$ 150 mil a R$ 360 mil / ano',
}

export type Source = {
  key: string; name: string; agency: string; kind: 'arquivo' | 'api' | 'mapa'; records: string; updated: string
  freshness: 'diário' | 'semanal' | 'safra' | 'tempo real' | 'mensal'; whatItTells: string; relevantForYou: number; color: string
}

/** Fontes de dados abertos monitoradas (radar). records/updated: reais quando conhecidos. */
export const SOURCES: Source[] = [
  { key: 'zarc', name: 'Zoneamento Agrícola de Risco Climático (Zarc)', agency: 'MAPA', kind: 'arquivo', records: '1.984.463 linhas', updated: 'safra 2026/27', freshness: 'diário', whatItTells: 'Quando plantar cada cultura, em cada município e tipo de solo, e o risco de perder a lavoura pelo clima.', relevantForYou: 6, color: '#2E7D4F' },
  { key: 'clima', name: 'Previsão do tempo (16 dias)', agency: 'Open-Meteo / modelos globais', kind: 'api', records: '16 dias × 24 h', updated: 'agora', freshness: 'tempo real', whatItTells: 'Chuva, temperatura e vento previstos exatamente sobre a sua propriedade.', relevantForYou: 3, color: '#2F6E91' },
  { key: 'satelite', name: 'Imagens de satélite (vegetação, temperatura, umidade do solo, fogo)', agency: 'NASA GIBS / INPE', kind: 'mapa', records: 'cobertura global diária', updated: 'ontem', freshness: 'diário', whatItTells: 'Como estão a vegetação, o calor e a umidade na sua região, vistos do espaço.', relevantForYou: 2, color: '#7C5CBF' },
  { key: 'agrofit', name: 'Agrofit — defensivos registrados', agency: 'MAPA', kind: 'arquivo', records: '280.159 registros', updated: 'registro vigente', freshness: 'semanal', whatItTells: 'Quais produtos são registrados para cada cultura e praga, e o quanto são tóxicos.', relevantForYou: 4, color: '#9A6516' },
  { key: 'seguro', name: 'Seguro Rural com subvenção (PSR)', agency: 'MAPA', kind: 'arquivo', records: '46.137 apólices (2025)', updated: '2025', freshness: 'mensal', whatItTells: 'Onde e para quais culturas o seguro rural com apoio do governo está chegando.', relevantForYou: 1, color: '#C0392B' },
  { key: 'drones', name: 'Aviação agrícola e drones registrados (SIPEAGRO)', agency: 'MAPA', kind: 'arquivo', records: '27.293 registros', updated: 'semanal', freshness: 'semanal', whatItTells: 'Quantos drones e aviões agrícolas operam na sua região — serviços disponíveis perto de você.', relevantForYou: 1, color: '#3B82A6' },
  { key: 'pivos', name: 'Agricultura irrigada por pivôs centrais', agency: 'ANA / Embrapa', kind: 'mapa', records: 'pivôs 1985–2019', updated: '2019', freshness: 'safra', whatItTells: 'Onde a irrigação cresce — pressão sobre a água da sua bacia.', relevantForYou: 0, color: '#0E7490' },
]

/** Funil: do volume bruto ao que importa para o produtor. Números REAIS calculados em data/opendata.db (02/10). */
export const FUNNEL = [
  { label: 'Registros oficiais analisados', value: '2.338.052', hint: 'Zarc 1,98 mi · Agrofit 280 mil · seguro rural 46 mil · aviação agrícola 27 mil' },
  { label: 'Ligados ao seu município e às suas culturas', value: '5.863', hint: '458 linhas do Zarc de Araraquara + 5.405 registros do Agrofit p/ soja, milho e feijão' },
  { label: 'Janelas de risco dos seus talhões', value: '20', hint: 'Zarc 2026/27 · soja, milho, feijão · seus tipos de solo' },
  { label: 'Viram recomendações para você', value: '6', hint: 'cruzadas com previsão do tempo e seu contexto' },
]

export type Insight = {
  id: string; priority: 'agir' | 'atencao' | 'oportunidade' | 'info'; title: string; summary: string
  why: string[]; sources: string[]; field?: string; action?: string; origin: Origin
}

export const INSIGHTS: Insight[] = [
  { id: 'i1', priority: 'agir', title: 'Milho no Talhão 2: espere até 21/10 para plantar', summary: 'Plantar agora tem 40% de risco de perda pelo clima. A partir de 21/10, o risco cai para 20%.',
    why: ['Zarc 2026/27 · Araraquara · milho 1ª safra · solo argiloso: 40% (1–10/out) → 30% (11–20/out) → 20% (a partir de 21/out)', 'Você declarou: “quero plantar milho em outubro” e “preocupação: seca”', 'Plantar fora da janela do Zarc pode tirar acesso ao Proagro e à subvenção do seguro'],
    sources: ['zarc', 'seguro'], field: 'Talhão 2', action: 'Ver calendário de risco', origin: 'real' },
  { id: 'i2', priority: 'atencao', title: 'Chuva forte prevista para quinta (≈60 mm)', summary: 'Evite aplicar defensivos na quarta. Talhões recém-preparados podem ter erosão.',
    why: ['Previsão para sua coordenada: 62 mm em 24 h na quinta-feira', 'Talhão 2 teve preparo de solo em 20/09 — solo exposto', 'Você tem pulverizador de barra e costuma aplicar no meio da semana'],
    sources: ['clima'], field: 'Talhão 2', action: 'Ver no mapa de chuva', origin: 'ilustrativo' },
  { id: 'i3', priority: 'atencao', title: 'Sementes de milho não bastam para o Talhão 2', summary: 'Para 3,1 ha você precisa de ~62 kg; tem 40 kg. Faltam ~22 kg.',
    why: ['Área desenhada por você: 3,08 ha', 'Taxa de semeadura que você informou: 20 kg/ha', 'Estoque declarado: 40 kg de semente de milho'],
    sources: [], field: 'Talhão 2', action: 'Planejar compra', origin: 'real' },
  { id: 'i4', priority: 'oportunidade', title: 'Soja no Talhão 1 já está na janela de menor risco', summary: 'Risco de 20% desde 11/10 até o fim de dezembro para o seu tipo de solo.',
    why: ['Zarc 2026/27 · soja · solo argiloso (classe AD6, estimada pela textura)', 'Você marcou soja como cultura principal'], sources: ['zarc'], field: 'Talhão 1', action: 'Ver janela', origin: 'real' },
  { id: 'i5', priority: 'info', title: 'Fungicida que você tem é registrado para feijão', summary: '“Magic” (iprodiona) é registrado para feijão contra mofo-branco. Classe toxicológica 4 (pouco tóxico). Vence em 10 dias.',
    why: ['Agrofit/MAPA: registro 00218 · feijão · mofo-branco, podridão-de-sclerotinia', 'Seu estoque: 3,5 L com validade 12/10'], sources: ['agrofit'], field: 'Talhão 3', action: 'Ver registro', origin: 'real' },
  { id: 'i6', priority: 'oportunidade', title: '14 drones agrícolas registrados no seu município', summary: 'Serviço de pulverização por drone pode ser contratado na região — útil para o talhão com declive.',
    why: ['SIPEAGRO/MAPA: 14 drones com operador sediado em Araraquara (1.346 em SP)', 'Só 1.306 dos 5.573 municípios do Brasil têm algum operador registrado', 'Você indicou “sem pulverizador próprio para áreas inclinadas”'],
    sources: ['drones'], action: 'Ver operadores na região', origin: 'real' },
]

export const FIELDS = [
  { id: 1, name: 'Talhão 1', crop: 'Soja', area: 5.36, soil: 'Argiloso', status: 'Aguardando plantio', color: '#2E7D4F', risk: 20,
    poly: [[-48.2385, -21.8316], [-48.2360, -21.8316], [-48.2359, -21.8297], [-48.2384, -21.8296]] },
  { id: 2, name: 'Talhão 2', crop: 'Milho', area: 3.08, soil: 'Argiloso', status: 'Aguardando plantio', color: '#B7791F', risk: 40,
    poly: [[-48.2358, -21.8316], [-48.2339, -21.8315], [-48.2339, -21.8301], [-48.2358, -21.8302]] },
  { id: 3, name: 'Talhão 3', crop: 'Feijão irrigado', area: 2.05, soil: 'Textura média', status: '51 dias após plantio', color: '#3B82A6', risk: 20,
    poly: [[-48.2372, -21.8335], [-48.2356, -21.8335], [-48.2356, -21.8324], [-48.2372, -21.8324]] },
]

/** Zarc real: Araraquara, milho 1ª safra, Grupo II, AD6 (safra 2026/27), por decêndio 1..36. */
export const ZARC_MILHO = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 30, 20, 20, 20, 20, 20, 20, 20]

export const FORECAST = [
  { d: 'sex', t: 31, min: 17, rain: 0 }, { d: 'sáb', t: 32, min: 18, rain: 0 }, { d: 'dom', t: 29, min: 19, rain: 2 },
  { d: 'seg', t: 27, min: 18, rain: 8 }, { d: 'ter', t: 30, min: 17, rain: 0 }, { d: 'qua', t: 28, min: 19, rain: 12 }, { d: 'qui', t: 24, min: 18, rain: 62 },
]

export const CONTEXT_MD = `# Contexto do produtor — AgroIA
> Gerado na entrevista inicial em 02/10/2026 · atualizado automaticamente a cada registro.
> Usado pelos agentes para FILTRAR os dados abertos e sugerir só o que é útil. Você pode editar.

## Perfil
- Tipo: produtor familiar
- Renda bruta anual com a produção: R$ 150 mil a R$ 360 mil
- Orçamento para a próxima safra: R$ 30 mil a R$ 60 mil
- Crédito/seguro: usa PRONAF · não tem seguro rural
- Internet: instável (preferir respostas curtas, modo leve)
- Linguagem: simples, sem termos técnicos

## Localização
- Município: Araraquara/SP (IBGE 3503208)
- Coordenada da sede: -21.832, -48.236

## Propriedade (desenhada no mapa)
| Talhão | Área | Cultura | Solo | Manejo |
|---|---|---|---|---|
| Talhão 1 | 5,36 ha | Soja | argiloso | sequeiro |
| Talhão 2 | 3,08 ha | Milho (verão) | argiloso | sequeiro |
| Talhão 3 | 2,05 ha | Feijão | textura média | irrigado (aspersão) |

## Recursos
- Máquinas: trator 75 cv, plantadeira 4 linhas, pulverizador de barra 600 L
- Sem drone · sem estação meteorológica

## Preocupações (em ordem)
1. Seca / falta de chuva
2. Custo de insumos
3. Pragas e doenças

## Objetivos
- Reduzir perdas por clima
- Saber o custo de cada talhão
- Acessar seguro rural

## Filtros aplicados aos dados abertos
- Zarc: município 3503208 · culturas [soja, milho 1ª safra, feijão] · solos [argiloso, médio] · manejo [sequeiro, irrigado]
- Agrofit: culturas [soja, milho, feijão] · priorizar classe toxicológica 4–5
- Clima: coordenada da sede · alertas: chuva ≥ 50 mm/dia, mínima ≤ 3 °C
- Satélite: raio de 10 km
- Região: drones e seguro rural do município e vizinhos
`
