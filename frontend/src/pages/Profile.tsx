import { Bell, Camera, Drone, ExternalLink, Lock, MapPin, MessageCircle, Pencil, Plus, Satellite, Scale, Trash2, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Card, ErrorBox, Input, Label, Loading, Modal, PageHeader } from '../components/ui'
import { api, type ProfileT } from '../lib/api'
import { dateBR, num } from '../lib/format'
import { useApi } from '../lib/hooks'

type Fact = ProfileT['facts'][number]
const ORIGIN = {
  declarado: { tone: 'green', label: 'Declarado por você' },
  registro: { tone: 'gray', label: 'Dos seus registros' },
  oficial: { tone: 'blue', label: 'Dado oficial' },
} as const

const SOON = [
  { icon: Satellite, title: 'Imagens de satélite / NDVI', text: 'Veja a saúde da lavoura vista do espaço.' },
  { icon: Camera, title: 'Foto da planta', text: 'Envie uma foto e receba um diagnóstico.' },
  { icon: MessageCircle, title: 'WhatsApp', text: 'Registre e consulte conversando pelo celular.' },
  { icon: Drone, title: 'Drones e sensores', text: 'Integração com equipamentos da propriedade.' },
  { icon: TrendingUp, title: 'Preços de mercado', text: 'Cotações para decidir a hora de vender.' },
  { icon: Scale, title: 'Programas públicos', text: 'PRONAF, Proagro e outros apoios ao produtor.' },
]

export default function Profile() {
  const profile = useApi(api.profile)
  const { data: farm } = useApi(api.farm)
  const { data: sources } = useApi(api.sources)
  const [editing, setEditing] = useState<Partial<Fact> | null>(null)
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState<string | null>(null)

  if (profile.error) return <ErrorBox error={profile.error} />
  if (!profile.data) return <Loading />
  const { producer, facts } = profile.data

  const open = (f: Partial<Fact>) => { setEditing(f); setLabel(f.label ?? ''); setValue(f.value ?? ''); setFormErr(null) }
  const save = async () => {
    if (!label.trim() || !value.trim()) { setFormErr('Preencha o título e o valor.'); return }
    setBusy(true)
    try {
      if (editing?.id) {
        const origin = value.trim() === editing.value && editing.origin ? editing.origin : 'declarado'
        await api.updateFact(editing.id, { label: label.trim(), value: value.trim(), origin })
      } else {
        await api.addFact({ label: label.trim(), value: value.trim(), origin: 'declarado' })
      }
      setEditing(null)
      await profile.reload()
    } catch (e) { setFormErr((e as Error).message) } finally { setBusy(false) }
  }
  const remove = async (f: Fact) => {
    if (!window.confirm(`Excluir "${f.label}"?`)) return
    try { await api.deleteFact(f.id); await profile.reload() } catch (e) { window.alert((e as Error).message) }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="O que o AgroBits sabe sobre você" subtitle={<>Produtor: <b className="text-ink">{producer.name}</b> · você controla o que está aqui</>} />

      {producer.is_demo && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm text-accent">
          <b>Dados fictícios de demonstração.</b> O produtor, a propriedade e os registros deste protótipo não são reais.
        </div>
      )}

      <Card
        title="Fatos que usamos para te ajudar"
        action={<Button size="sm" onClick={() => open({})}><Plus size={13} /> Adicionar</Button>}
        padded={false}
      >
        <ul className="divide-y divide-border">
          {facts.length === 0 && <li className="p-4 text-sm text-muted">Nenhum fato cadastrado.</li>}
          {facts.map((f) => (
            <li key={f.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">{f.label}</div>
                <div className="text-sm text-ink">{f.value}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={ORIGIN[f.origin].tone}>{ORIGIN[f.origin].label}</Badge>
                  <span className="text-[11px] text-muted">atualizado em {dateBR(f.updated_at)}</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" aria-label={`Editar ${f.label}`} onClick={() => open(f)}><Pencil size={14} /></Button>
              <Button size="sm" variant="ghost" aria-label={`Excluir ${f.label}`} onClick={() => remove(f)}><Trash2 size={14} /></Button>
            </li>
          ))}
        </ul>
      </Card>

      {farm && (
        <Card title={<span className="flex items-center gap-2"><MapPin size={16} /> Dados da propriedade</span>}>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Propriedade', farm.name],
              ['Município / UF', `${farm.municipality} / ${farm.uf}`],
              ['Código IBGE', farm.geocode],
              ['Coordenadas', `${farm.lat.toFixed(4)}, ${farm.lon.toFixed(4)}`],
              ['Área total', `${num(farm.total_area_ha, 2)} ha`],
              ['Safra atual', farm.current_season?.name ?? '—'],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-xs font-medium uppercase tracking-wide text-muted">{k}</dt><dd className="mt-0.5 font-medium">{v}</dd></div>
            ))}
          </dl>
        </Card>
      )}

      <Card title="Fontes de dados abertos" padded={false}>
        <div className="border-b border-border p-4">
          <p className="text-sm text-muted">Selo de transparência: todo dado oficial mostrado no AgroBits vem de uma destas bases públicas, com órgão e data de extração.</p>
          <p className="mt-2 flex items-start gap-2 text-xs text-muted">
            <Lock size={14} className="mt-0.5 shrink-0 text-primary" />
            <span><b>Privacidade:</b> bases com dados pessoais (seguro rural, SIPEAGRO) são usadas apenas de forma agregada por município, e grupos com menos de 3 registros são suprimidos. Os dados do produtor ficam no próprio sistema.</span>
          </p>
        </div>
        <ul className="divide-y divide-border">
          {(sources ?? []).map((s) => (
            <li key={s.key} className="px-4 py-3 text-sm">
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs text-muted">{s.agency}{s.extracted_at && ` · extraído em ${dateBR(s.extracted_at)}`}</div>
              {s.notes && <div className="mt-0.5 text-xs text-muted">{s.notes}</div>}
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 break-all text-xs text-info hover:underline"><ExternalLink size={11} /> {s.url}</a>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title={<span className="flex items-center gap-2"><Bell size={16} /> Em breve</span>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SOON.map(({ icon: Icon, title, text }) => (
            <div key={title} aria-disabled="true" className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-bg p-3 opacity-70">
              <span className="rounded-lg bg-surface p-2 text-muted"><Icon size={16} /></span>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-sm font-medium">{title} <Badge>em breve</Badge></div>
                <div className="text-xs text-muted">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!editing} title={editing?.id ? 'Editar fato' : 'Adicionar fato'} onClose={() => setEditing(null)}>
        <div className="space-y-3">
          <Label label="Título"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex.: Irrigação" /></Label>
          <Label label="Valor" hint="Informações que você declara ficam marcadas como “Declarado por você”."><Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ex.: Pivô central de 10 ha" /></Label>
          {formErr && <ErrorBox error={formErr} />}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
