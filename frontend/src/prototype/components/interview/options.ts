// Opções (cartões/chips) da entrevista. Textos em linguagem simples.
import {
  Ban, Banknote, Bean, Bug, CalendarDays, Calendar, CandyCane, Carrot, Citrus, ClipboardList, Cloud, CloudRain, CloudRainWind, Coffee,
  Coins, Drone, Droplets, GraduationCap, Handshake, House, Landmark, Layers, Leaf, MessageCircle, MessageSquare, Nut, PiggyBank, Radar, Receipt,
  Salad, Shapes, ShieldCheck, Signal, Siren, Smartphone, Snowflake, SprayCan, Sprout, Store, Sun, Thermometer, Tractor, TrendingDown,
  TrendingUp, Umbrella, Users, Wallet, Wheat, Wifi, WifiLow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Municipality } from './types'

export type Opt = { id: string; label: string; hint?: string; icon: LucideIcon }

export const PROFILES: Opt[] = [
  { id: 'familiar', label: 'Produtor familiar', hint: 'Trabalho a terra com a minha família', icon: House },
  { id: 'pequeno', label: 'Pequeno produtor', hint: 'Vendo o que produzo, com pouca ajuda', icon: Sprout },
  { id: 'medio', label: 'Médio produtor', hint: 'Tenho equipe e vários talhões', icon: Tractor },
  { id: 'coop', label: 'Cooperativa ou associação', hint: 'Represento vários produtores', icon: Users },
  { id: 'tecnico', label: 'Técnico ou agrônomo', hint: 'Oriento produtores', icon: GraduationCap },
]

/** `zarc`: cultura coberta pelo Zoneamento Agrícola de Risco Climático. `zarcName`: nome usado no filtro. */
export type CropOpt = Opt & { zarc: boolean; zarcName?: string; mdName?: string }
export const CROPS: CropOpt[] = [
  { id: 'soja', label: 'Soja', icon: Sprout, zarc: true, zarcName: 'soja' },
  { id: 'milho', label: 'Milho', icon: Wheat, zarc: true, zarcName: 'milho 1ª safra', mdName: 'Milho (verão)' },
  { id: 'feijao', label: 'Feijão', icon: Bean, zarc: true, zarcName: 'feijão' },
  { id: 'cafe', label: 'Café', icon: Coffee, zarc: true, zarcName: 'café' },
  { id: 'cana', label: 'Cana-de-açúcar', icon: CandyCane, zarc: true, zarcName: 'cana-de-açúcar' },
  { id: 'laranja', label: 'Laranja', icon: Citrus, zarc: true, zarcName: 'citros (laranja)' },
  { id: 'amendoim', label: 'Amendoim', icon: Nut, zarc: true, zarcName: 'amendoim' },
  { id: 'mandioca', label: 'Mandioca', icon: Carrot, zarc: true, zarcName: 'mandioca' },
  { id: 'hortalicas', label: 'Hortaliças', icon: Salad, zarc: false },
  { id: 'pastagem', label: 'Pastagem', icon: Leaf, zarc: false },
  { id: 'outra', label: 'Outra', icon: Shapes, zarc: false },
]

export const SOILS: Opt[] = [
  { id: 'arenoso', label: 'Arenoso', hint: 'Terra que esfarela', icon: Sun },
  { id: 'medio', label: 'Médio', hint: 'Meio a meio', icon: Layers },
  { id: 'argiloso', label: 'Argiloso', hint: 'Terra que gruda', icon: Droplets },
  { id: 'nao_sei', label: 'Não sei', hint: 'Estimamos pela região', icon: Radar },
]

export const IRRIGATION: Opt[] = [
  { id: 'nao', label: 'Não irrigo', icon: Sun },
  { id: 'aspersao', label: 'Aspersão', icon: CloudRain },
  { id: 'gotejamento', label: 'Gotejamento', icon: Droplets },
  { id: 'pivo', label: 'Pivô', icon: Radar },
]

export const SIZES: Opt[] = [
  { id: 'ate5', label: 'Até 5 ha', hint: 'Chácara ou sítio pequeno', icon: Sprout },
  { id: '5a20', label: 'De 5 a 20 ha', hint: 'Pequena propriedade', icon: House },
  { id: '20a50', label: 'De 20 a 50 ha', hint: 'Propriedade média', icon: Tractor },
  { id: '50a100', label: 'De 50 a 100 ha', hint: 'Propriedade média a grande', icon: Wheat },
  { id: 'mais100', label: 'Mais de 100 ha', hint: 'Propriedade grande', icon: Landmark },
]
export const sizeFromHa = (ha: number) => (ha <= 5 ? 'ate5' : ha <= 20 ? '5a20' : ha <= 50 ? '20a50' : ha <= 100 ? '50a100' : 'mais100')

export const INCOMES: Opt[] = [
  { id: 'ate50', label: 'Até R$ 50 mil', icon: Coins },
  { id: '50a150', label: 'De R$ 50 a 150 mil', icon: Coins },
  { id: '150a360', label: 'De R$ 150 a 360 mil', icon: Banknote },
  { id: '360a1mi', label: 'De R$ 360 mil a 1 milhão', icon: Banknote },
  { id: 'mais1mi', label: 'Acima de R$ 1 milhão', icon: Wallet },
  { id: 'nd', label: 'Prefiro não dizer', hint: 'Tudo bem, mostramos opções gerais', icon: Ban },
]
/** Textos de faixa usados no contexto.md */
export const INCOME_MD: Record<string, string> = {
  ate50: 'até R$ 50 mil', '50a150': 'R$ 50 mil a R$ 150 mil', '150a360': 'R$ 150 mil a R$ 360 mil', '360a1mi': 'R$ 360 mil a R$ 1 milhão',
  mais1mi: 'acima de R$ 1 milhão', nd: 'prefere não informar',
}

export const BUDGETS: Opt[] = [
  { id: 'ate10', label: 'Até R$ 10 mil', icon: PiggyBank },
  { id: '10a30', label: 'De R$ 10 a 30 mil', icon: PiggyBank },
  { id: '30a60', label: 'De R$ 30 a 60 mil', icon: Wallet },
  { id: '60a150', label: 'De R$ 60 a 150 mil', icon: Wallet },
  { id: 'mais150', label: 'Acima de R$ 150 mil', icon: Banknote },
]
export const BUDGET_MD: Record<string, string> = {
  ate10: 'até R$ 10 mil', '10a30': 'R$ 10 mil a R$ 30 mil', '30a60': 'R$ 30 mil a R$ 60 mil', '60a150': 'R$ 60 mil a R$ 150 mil', mais150: 'acima de R$ 150 mil',
}

export const CREDITS: Opt[] = [
  { id: 'pronaf', label: 'PRONAF', hint: 'Crédito da agricultura familiar', icon: Landmark },
  { id: 'proagro', label: 'Proagro', hint: 'Garantia contra perda da lavoura', icon: ShieldCheck },
  { id: 'seguro', label: 'Seguro rural', hint: 'Com ou sem ajuda do governo', icon: Umbrella },
  { id: 'coop', label: 'Crédito de cooperativa', hint: 'Financiamento pela cooperativa', icon: Handshake },
  { id: 'nenhum', label: 'Nenhum', hint: 'Hoje não uso crédito nem seguro', icon: Ban },
]

export const MACHINES: Opt[] = [
  { id: 'trator', label: 'Trator', icon: Tractor },
  { id: 'plantadeira', label: 'Plantadeira', icon: Sprout },
  { id: 'pulverizador', label: 'Pulverizador', icon: SprayCan },
  { id: 'drone', label: 'Drone', icon: Drone },
  { id: 'irrigacao', label: 'Irrigação', hint: 'Aspersão, gotejo ou pivô', icon: Droplets },
  { id: 'estacao', label: 'Estação meteorológica', hint: 'Mede chuva e temperatura na roça', icon: Thermometer },
  { id: 'nenhum', label: 'Nenhum', hint: 'Uso máquinas de terceiros ou trabalho manual', icon: Ban },
]

export const CONCERNS: Opt[] = [
  { id: 'seca', label: 'Seca', hint: 'Falta de chuva na hora errada', icon: Sun },
  { id: 'chuva', label: 'Chuva forte', hint: 'Enxurrada, granizo, erosão', icon: CloudRainWind },
  { id: 'geada', label: 'Geada', hint: 'Frio que queima a planta', icon: Snowflake },
  { id: 'pragas', label: 'Pragas e doenças', hint: 'Lagarta, ferrugem, mofo…', icon: Bug },
  { id: 'preco', label: 'Preço de venda', hint: 'Vender abaixo do custo', icon: TrendingDown },
  { id: 'insumos', label: 'Custo de insumos', hint: 'Adubo, semente, veneno, diesel', icon: Receipt },
  { id: 'credito', label: 'Acesso a crédito', hint: 'Conseguir dinheiro para plantar', icon: Landmark },
  { id: 'mao', label: 'Falta de mão de obra', hint: 'Gente para trabalhar na época certa', icon: Users },
]

export const GOALS: Opt[] = [
  { id: 'perdas', label: 'Reduzir perdas por clima', hint: 'Plantar na época de menor risco', icon: Cloud },
  { id: 'produzir', label: 'Produzir mais', hint: 'Mais sacas por hectare', icon: TrendingUp },
  { id: 'custos', label: 'Reduzir custos', hint: 'Gastar só com o que precisa', icon: PiggyBank },
  { id: 'credito', label: 'Acessar seguro ou crédito', hint: 'Programas que servem para mim', icon: Landmark },
  { id: 'gastos', label: 'Organizar gastos', hint: 'Saber o custo de cada talhão', icon: ClipboardList },
  { id: 'vender', label: 'Vender melhor', hint: 'Preço e hora certa de vender', icon: Store },
]

export const CHANNELS: Opt[] = [
  { id: 'app', label: 'No aplicativo', hint: 'Avisos dentro do AgroIA', icon: Smartphone },
  { id: 'whatsapp', label: 'WhatsApp', hint: 'Mensagem curta no celular', icon: MessageCircle },
  { id: 'sms', label: 'SMS', hint: 'Funciona até sem internet', icon: MessageSquare },
]
export const FREQUENCIES: Opt[] = [
  { id: 'urgentes', label: 'Só urgentes', hint: 'Geada, chuva forte, prazo', icon: Siren },
  { id: 'diario', label: 'Todo dia', hint: 'Resumo da manhã', icon: CalendarDays },
  { id: 'semanal', label: 'Toda semana', hint: 'Resumo de domingo', icon: Calendar },
]
export const INTERNETS: Opt[] = [
  { id: 'boa', label: 'Boa', hint: 'Quase sempre conectado', icon: Wifi },
  { id: 'instavel', label: 'Instável', hint: 'Cai de vez em quando', icon: WifiLow },
  { id: 'celular', label: 'Só no celular', hint: 'Sinal fraco, dados limitados', icon: Signal },
]

export const MUNICIPALITIES: Municipality[] = [
  { name: 'Araraquara', uf: 'SP', ibge: '3503208', lat: -21.7945, lon: -48.1756 },
  { name: 'Américo Brasiliense', uf: 'SP', ibge: '3501905', lat: -21.7295, lon: -48.1139 },
  { name: 'Matão', uf: 'SP', ibge: '3529302', lat: -21.6033, lon: -48.3658 },
  { name: 'São Carlos', uf: 'SP', ibge: '3548906', lat: -22.0087, lon: -47.8909 },
  { name: 'Ribeirão Preto', uf: 'SP', ibge: '3543402', lat: -21.1775, lon: -47.8103 },
  { name: 'Jaboticabal', uf: 'SP', ibge: '3524303', lat: -21.2554, lon: -48.3222 },
  { name: 'Rio Claro', uf: 'SP', ibge: '3543907', lat: -22.4114, lon: -47.5614 },
  { name: 'Franca', uf: 'SP', ibge: '3516200', lat: -20.5386, lon: -47.4008 },
  { name: 'Uberaba', uf: 'MG', ibge: '3170107', lat: -19.7472, lon: -47.9381 },
  { name: 'Rio Verde', uf: 'GO', ibge: '5218805', lat: -17.7923, lon: -50.9192 },
  { name: 'Sorriso', uf: 'MT', ibge: '5107925', lat: -12.5425, lon: -55.7211 },
  { name: 'Cascavel', uf: 'PR', ibge: '4104808', lat: -24.9578, lon: -53.4595 },
  { name: 'Londrina', uf: 'PR', ibge: '4113700', lat: -23.3045, lon: -51.1696 },
  { name: 'Passo Fundo', uf: 'RS', ibge: '4314100', lat: -28.2628, lon: -52.4067 },
]

export const labelOf = (opts: Opt[], id?: string) => opts.find((o) => o.id === id)?.label
export const labelsOf = (opts: Opt[], ids: string[]) => ids.map((i) => labelOf(opts, i)).filter(Boolean) as string[]
