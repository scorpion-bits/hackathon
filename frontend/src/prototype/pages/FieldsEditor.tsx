// "Editar talhões" — criar, redesenhar, ajustar formato, mudar cultura/solo/irrigação ou excluir talhões
// depois da entrevista. Reaproveita o mapa de desenho da entrevista; salva no estado compartilhado (farmStore).
import { ArrowLeft, CheckCircle2, Globe2 } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PropertyMap } from '../components/interview/PropertyMap'
import { ProtoStyles } from '../components/interview/ui'
import { EXAMPLE_DRAFTS, setFarmFields, useFarmFields } from '../farmStore'
import { PRODUCER } from '../mock'

export default function FieldsEditor() {
  const fields = useFarmFields()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('de') === 'propriedade' ? '/prototipo/propriedade' : '/prototipo/mapa'
  const initial = Number(params.get('talhao')) || null

  return (
    <div className="flex h-full flex-col">
      <ProtoStyles />
      <div className="min-h-0 flex-1">
        <PropertyMap
          fields={fields}
          setFields={(u) => setFarmFields(u)}
          center={[PRODUCER.lat, PRODUCER.lon]}
          initialSelected={initial}
          exampleLabel="Voltar ao exemplo"
          onLoadExample={() => setFarmFields(EXAMPLE_DRAFTS)}
          header={
            <div className="mb-4">
              <Link to={from} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={16} /> Voltar</Link>
              <h1 className="mt-2 text-xl font-bold text-ink">Editar talhões</h1>
              <p className="mt-1 text-sm text-muted">
                Desenhe um talhão novo, toque num talhão para mudar a cultura, o solo ou o formato, ou exclua o que não existe mais.
                Tudo é salvo na hora e os avisos se ajustam.
              </p>
            </div>
          }
          footer={
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-primary-dark"><CheckCircle2 size={16} /> Alterações salvas automaticamente</p>
              <button onClick={() => nav(from === '/prototipo/mapa' ? '/prototipo/mapa' : from)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white hover:bg-primary-dark">
                <Globe2 size={17} /> {from === '/prototipo/mapa' ? 'Ver no mapa vivo' : 'Voltar para Minha propriedade'}
              </button>
            </div>
          }
        />
      </div>
    </div>
  )
}
