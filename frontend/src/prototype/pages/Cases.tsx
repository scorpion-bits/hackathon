// "Meus casos" — acompanhamento dos casos levados à assistência técnica pública (modelo A, D-015).
// Respostas dos técnicos são EXEMPLOS para a demonstração (nenhuma pessoa real é citada).
import clsx from 'clsx'
import { ArrowRight, CheckCircle2, Clock, Inbox, Landmark, MessageSquareText, RotateCcw, Send } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IsoCube } from '../components/Brand'
import { EXPERTS, ORDER, PROBLEMS, resetCases, useCases } from '../resolve'

const SAMPLE_REPLY: Record<string, string> = {
  i1: 'Concordo em esperar a janela de 21/10 para o milho. Aproveite estes dias para fazer a análise de solo do Talhão 2 — a Casa da Agricultura orienta a coleta. Posso visitar na semana que vem.',
  i2: 'Com 60 mm previstos, evite aplicar na quarta. Se o solo do Talhão 2 estiver exposto, a palhada ajuda a segurar a erosão. Ligue se a enxurrada abrir sulcos.',
  i3: 'Dá para incluir a semente no custeio do PRONAF. Traga a área e a cultura à Casa da Agricultura que ajudamos a montar o projeto para o banco.',
  i4: 'A janela de 20% para soja está aberta. Confira a umidade do solo antes de plantar; se precisar, posso indicar a regulagem da plantadeira.',
  i5: 'Antes de usar qualquer defensivo é preciso o receituário agronômico. Vou vistoriar o feijão: se não houver mofo-branco, não aplique; produto vencido deve voltar à revenda.',
  i6: 'A prefeitura tem cadastro de prestadores de serviço com drone. Passe aqui para ver as regras de aplicação perto de casas e nascentes.',
}

export default function Cases() {
  const cases = useCases()
  const [replied, setReplied] = useState<Record<string, boolean>>({})
  const list = ORDER.map((id) => cases[id]).filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold md:text-3xl">Meus casos</h1>
        <p className="mt-1 text-[15px] text-muted">Assuntos que você levou à assistência técnica pública. O atendimento é <b className="text-ink">gratuito</b> e quem orienta é um técnico — o AgroBits só organiza os dados e acompanha.</p>
      </header>

      {list.length === 0 ? (
        <div className="iso-card bg-surface p-8 text-center">
          <Inbox size={36} className="mx-auto text-muted" />
          <h2 className="mt-3 text-lg font-bold">Nenhum caso enviado ainda</h2>
          <p className="mt-1 text-sm text-muted">Na tela inicial, abra um assunto e toque em “Enviar meu caso”.</p>
          <Link to="/prototipo" className="iso-btn mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-display font-bold text-white">Ver assuntos <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {list.map((c) => {
            const e = EXPERTS.find((x) => x.id === c.expertId)
            const p = PROBLEMS[c.problemId]
            const done = replied[c.problemId]
            const steps = [
              { label: 'Enviado', on: true, icon: Send },
              { label: 'Recebido pelo órgão', on: true, icon: Landmark },
              { label: 'Técnico respondeu', on: !!done, icon: MessageSquareText },
            ]
            return (
              <li key={c.problemId} className="iso-card bg-surface p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <IsoCube size={30}>{ORDER.indexOf(c.problemId) + 1}</IsoCube>
                  <div className="min-w-0 flex-1">
                    <Link to={`/prototipo/resolver/${c.problemId}`} className="font-display text-base font-bold leading-snug hover:underline">{p.question}</Link>
                    <div className="text-xs text-muted">Protocolo {c.protocol} · {e?.name} · {c.sentAt} · resposta por {c.channel}</div>
                  </div>
                </div>
                {/* linha do tempo do atendimento */}
                <ol className="mt-4 grid grid-cols-3 gap-1">
                  {steps.map((s) => (
                    <li key={s.label} className="flex flex-col items-center gap-1 text-center">
                      <span className={clsx('grid h-9 w-9 place-items-center rounded-full', s.on ? 'bg-primary text-white' : 'bg-bg text-muted ring-1 ring-border')}><s.icon size={16} /></span>
                      <span className={clsx('text-[11px] leading-tight', s.on ? 'font-semibold text-ink' : 'text-muted')}>{s.label}</span>
                    </li>
                  ))}
                </ol>
                {done ? (
                  <div className="mt-4 rounded-xl bg-mint-soft/60 p-4 ring-1 ring-primary/20">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary-dark"><CheckCircle2 size={14} /> Resposta do técnico · exemplo</div>
                    <p className="mt-1 text-[15px] leading-relaxed">{SAMPLE_REPLY[c.problemId]}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted"><Clock size={15} /> Aguardando o técnico · {e?.eta}</span>
                    <button onClick={() => setReplied((r) => ({ ...r, [c.problemId]: true }))} className="min-h-11 rounded-lg px-3 text-xs font-semibold text-primary ring-1 ring-primary/30 hover:bg-primary-soft">
                      Simular resposta (demo)
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {list.length > 0 && (
        <button onClick={resetCases} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><RotateCcw size={14} /> Recomeçar a demonstração</button>
      )}
    </div>
  )
}
