// LOGIN / CRIAR CONTA (protótipo visual, D-009). Só visual: validação simples no front, sem backend.
// Rota: /prototipo/entrar → "Entrar" vai para /prototipo; "Criar conta" vai para /prototipo/entrevista.
import clsx from 'clsx'
import { ArrowRight, Check, Eye, EyeOff, Filter, Info, Lock, LoaderCircle, Mail, MessageCircle, ShieldCheck, Sprout, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ProtoStyles } from '../components/interview/ui'
import { ProtoBanner } from '../components/Shell'
import { FUNNEL, PRODUCER } from '../mock'

type Tab = 'entrar' | 'criar'

const looksLikeContact = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim()) || v.replace(/\D/g, '').length >= 10

function Field({ label, icon: Icon, error, trailing, ...input }: { label: string; icon: LucideIcon; error?: string; trailing?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={input.id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          {...input} aria-invalid={!!error} aria-describedby={error ? `${input.id}-err` : undefined}
          className={clsx('w-full rounded-xl border-2 bg-surface py-3 pl-11 text-base text-ink outline-none transition placeholder:text-muted/60 focus:ring-4', trailing ? 'pr-12' : 'pr-4',
            error ? 'border-danger focus:border-danger focus:ring-danger-soft' : 'border-border focus:border-primary focus:ring-primary-soft')}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && <p id={`${input.id}-err`} role="alert" className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-label={shown ? 'Esconder senha' : 'Mostrar senha'} className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-bg hover:text-ink">
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )
}

function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark active:scale-[.99] disabled:opacity-70">
      {busy ? <><LoaderCircle size={18} className="animate-spin" /> Aguarde…</> : <>{children}<ArrowRight size={18} /></>}
    </button>
  )
}

/** Hook: executa `fn` após um pequeno atraso simulando a chamada ao servidor, com limpeza ao desmontar. */
function useFakeRequest() {
  const [busy, setBusy] = useState(false)
  const t = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(t.current), [])
  return { busy, run: (fn: () => void) => { setBusy(true); t.current = window.setTimeout(fn, 700) } }
}

function LoginForm() {
  const nav = useNavigate()
  const { busy, run } = useFakeRequest()
  const [ident, setIdent] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [forgot, setForgot] = useState(false)
  const [errors, setErrors] = useState<{ ident?: string; pass?: string }>({})

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: typeof errors = {}
    if (!ident.trim()) er.ident = 'Informe seu e-mail ou celular.'
    else if (!looksLikeContact(ident)) er.ident = 'Digite um e-mail válido ou um celular com DDD.'
    if (!pass) er.pass = 'Digite sua senha.'
    setErrors(er)
    if (Object.keys(er).length) return
    run(() => nav('/prototipo'))
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="l-ident" label="E-mail ou celular" icon={Mail} value={ident} onChange={(e) => setIdent(e.target.value)} placeholder="joao@email.com ou (16) 99999-9999" autoComplete="username" inputMode="email" error={errors.ident} />
      <Field id="l-pass" label="Senha" icon={Lock} type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Sua senha" autoComplete="current-password" error={errors.pass}
        trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />} />
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-ink">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-border accent-[var(--color-primary)]" />
          Lembrar de mim
        </label>
        <button type="button" onClick={() => setForgot((f) => !f)} className="font-medium text-primary hover:underline">Esqueci a senha</button>
      </div>
      {forgot && (
        <div className="flex items-start gap-2 rounded-xl border border-info/20 bg-info-soft p-3 text-xs leading-relaxed text-info animate-[proto-up_.2s_ease-out]">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>No protótipo nada é enviado. Na versão final mandamos um link de recuperação para o seu e-mail ou um código por SMS.</span>
        </div>
      )}
      <SubmitButton busy={busy}>Entrar</SubmitButton>
    </form>
  )
}

function SignupForm() {
  const nav = useNavigate()
  const { busy, run } = useFakeRequest()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; contact?: string; pass?: string; confirm?: string; consent?: string }>({})

  const strength = !pass ? 0 : (pass.length >= 6 ? 1 : 0) + (pass.length >= 10 ? 1 : 0) + (/\d/.test(pass) && /[a-zA-Z]/.test(pass) ? 1 : 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: typeof errors = {}
    if (name.trim().length < 2) er.name = 'Diga como podemos chamar você.'
    if (!contact.trim()) er.contact = 'Informe um celular ou e-mail.'
    else if (!looksLikeContact(contact)) er.contact = 'Digite um e-mail válido ou um celular com DDD.'
    if (pass.length < 6) er.pass = 'A senha precisa ter pelo menos 6 caracteres.'
    if (!confirm) er.confirm = 'Repita a senha.'
    else if (confirm !== pass) er.confirm = 'As senhas não são iguais.'
    if (!consent) er.consent = 'Para continuar, é preciso concordar com o uso dos dados.'
    setErrors(er)
    if (Object.keys(er).length) return
    run(() => nav('/prototipo/entrevista', { state: { name: name.trim() } }))
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field id="s-name" label="Seu nome" icon={UserRound} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado" autoComplete="name" error={errors.name} />
      <Field id="s-contact" label="Celular ou e-mail" icon={Mail} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="(16) 99999-9999 ou joao@email.com" autoComplete="username" inputMode="email" error={errors.contact} />
      <div>
        <Field id="s-pass" label="Senha" icon={Lock} type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete="new-password" error={errors.pass}
          trailing={<PasswordToggle shown={show} onToggle={() => setShow((s) => !s)} />} />
        {pass && (
          <div className="mt-2 flex items-center gap-2" aria-hidden>
            <div className="flex flex-1 gap-1">
              {[1, 2, 3].map((i) => <span key={i} className={clsx('h-1 flex-1 rounded-full transition-colors', strength >= i ? (strength === 1 ? 'bg-danger' : strength === 2 ? 'bg-accent' : 'bg-primary') : 'bg-border')} />)}
            </div>
            <span className="w-14 text-right text-[11px] text-muted">{['', 'fraca', 'razoável', 'forte'][strength]}</span>
          </div>
        )}
      </div>
      <Field id="s-confirm" label="Confirmar senha" icon={Lock} type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" autoComplete="new-password" error={errors.confirm} />

      <div>
        <label className={clsx('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-[13px] leading-relaxed transition', consent ? 'border-primary bg-primary-soft/50' : errors.consent ? 'border-danger bg-danger-soft/40' : 'border-border bg-surface')}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[var(--color-primary)]" aria-describedby={errors.consent ? 's-consent-err' : undefined} />
          <span className="text-ink">
            <b>Privacidade:</b> seus dados são usados <b>só para personalizar</b> as recomendações. <b>Não vendemos dados</b> e seguimos a LGPD. Você pode ver, corrigir ou apagar tudo quando quiser.
          </span>
        </label>
        {errors.consent && <p id="s-consent-err" role="alert" className="mt-1.5 text-xs font-medium text-danger">{errors.consent}</p>}
      </div>

      <SubmitButton busy={busy}>Criar conta e começar entrevista</SubmitButton>
    </form>
  )
}

const POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: 'Fontes oficiais', text: 'MAPA, Embrapa, ANA, INPE e previsão do tempo. Sempre com a fonte e a data.' },
  { icon: Filter, title: 'Filtrado pelo seu contexto', text: 'Cruzamos milhões de registros com a sua cidade, cultura e solo. Só chega o que serve.' },
  { icon: MessageCircle, title: 'Linguagem simples', text: 'Sem planilha e sem termo técnico. Do jeito que a gente conversa na roça.' },
]
const FLOATING = [
  { t: 'Zarc · risco climático', c: '#2E7D4F', cls: 'left-0 top-0', d: '0s' },
  { t: 'Agrofit · defensivos', c: '#D69E2E', cls: 'left-24 top-12', d: '.6s' },
  { t: 'Previsão do tempo', c: '#3B82A6', cls: 'left-4 top-24', d: '1.2s' },
  { t: 'Satélite · INPE', c: '#9B7CE0', cls: 'left-28 top-36', d: '1.8s' },
]

function Pitch() {
  return (
    <section className="relative overflow-hidden bg-sidebar text-white">
      {/* fundo: brilho + sulcos de plantio */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(46,125,79,.55),transparent_55%),radial-gradient(circle_at_95%_85%,rgba(214,158,46,.20),transparent_50%)]" />
      <svg aria-hidden className="absolute inset-x-0 bottom-0 hidden h-[46%] w-full lg:block" viewBox="0 0 800 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E7D4F" stopOpacity=".35" /><stop offset="1" stopColor="#13241A" stopOpacity="0" /></linearGradient>
          <pattern id="rows" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><rect width="14" height="14" fill="none" /><line x1="0" y1="0" x2="0" y2="14" stroke="#ffffff" strokeOpacity=".07" strokeWidth="3" /></pattern>
        </defs>
        <path d="M0 160 C 160 90, 330 190, 520 120 S 760 70, 800 100 V360 H0Z" fill="url(#hill)" />
        <path d="M0 160 C 160 90, 330 190, 520 120 S 760 70, 800 100 V360 H0Z" fill="url(#rows)" />
        <path d="M0 250 C 200 190, 380 290, 580 220 S 760 190, 800 205 V360 H0Z" fill="#2E7D4F" fillOpacity=".18" />
        <path d="M0 250 C 200 190, 380 290, 580 220 S 760 190, 800 205 V360 H0Z" fill="url(#rows)" />
      </svg>

      <div className="relative z-10 flex h-full flex-col justify-between gap-8 p-6 sm:p-10 lg:p-14">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-xl">🌱</span>
          <div>
            <div className="text-xl font-bold leading-none">AgroIA</div>
            <div className="text-[11px] text-white/60">dados abertos que trabalham para você</div>
          </div>
        </div>

        <div className="max-w-xl">
          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">Os dados do governo, <span className="text-[#8FD6A8]">filtrados para a sua roça.</span></h1>
          <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">O AgroIA lê as bases oficiais por você e mostra só o que importa para a sua propriedade.</p>
          <ul className="mt-7 hidden gap-4 sm:grid">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#8FD6A8] ring-1 ring-white/10"><Icon size={19} /></span>
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm leading-snug text-white/65">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ilustração: muitos dados oficiais entram, poucas recomendações saem */}
        <div className="relative hidden h-52 lg:block" aria-hidden>
          <div className="absolute inset-y-0 left-0 w-[290px]">
            {FLOATING.map((f) => (
              <span key={f.t} className={clsx('proto-anim absolute inline-flex animate-[proto-float_5s_ease-in-out_infinite] items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/15 backdrop-blur', f.cls)} style={{ animationDelay: f.d }}>
                <span className="h-2 w-2 rounded-full" style={{ background: f.c }} />{f.t}
              </span>
            ))}
          </div>
          <div className="absolute left-[270px] top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full bg-primary shadow-lg shadow-primary/40"><Filter size={24} /></div>
          <div className="absolute left-[270px] top-1/2 h-px w-10 -translate-x-full bg-gradient-to-r from-transparent to-white/40" />
          <div className="absolute right-0 top-1/2 w-[210px] -translate-y-1/2 rounded-2xl bg-white p-4 text-ink shadow-xl">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Para você</div>
            <div className="mt-1 text-3xl font-extrabold text-primary-dark">{FUNNEL[3].value}</div>
            <div className="text-xs leading-snug text-muted">recomendações, de {FUNNEL[0].value} registros oficiais</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Login() {
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('entrar')
  const tabs: { id: Tab; label: string }[] = [{ id: 'entrar', label: 'Entrar' }, { id: 'criar', label: 'Criar conta' }]

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <ProtoStyles />
      <ProtoBanner />
      <div className="grid flex-1 lg:grid-cols-[1.05fr_1fr]">
        <Pitch />

        <section className="flex items-center justify-center px-4 py-8 sm:p-10">
          <div className="w-full max-w-md animate-[proto-up_.4s_ease-out] proto-anim">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-ink">{tab === 'entrar' ? 'Que bom ver você de novo' : 'Vamos começar'}</h2>
              <p className="mt-1 text-sm text-muted">
                {tab === 'entrar' ? 'Entre para ver as recomendações feitas com os dados da sua propriedade.' : 'Crie sua conta. Depois, uma entrevista rápida, quase só cliques.'}
              </p>
            </div>

            <div role="tablist" aria-label="Entrar ou criar conta" className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-border/60 p-1">
              {tabs.map((t) => (
                <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls="auth-panel" type="button" onClick={() => setTab(t.id)}
                  className={clsx('rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200', tab === t.id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
                  {t.label}
                </button>
              ))}
            </div>

            <div id="auth-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} key={tab} className="proto-anim animate-[proto-up_.3s_ease-out]">
              {tab === 'entrar' ? <LoginForm /> : <SignupForm />}
            </div>

            <div className="mt-6 border-t border-border pt-5 text-center">
              <button type="button" onClick={() => nav('/prototipo')} className="rounded-lg px-3 py-2 text-center text-sm font-medium leading-snug text-primary-dark transition hover:bg-primary-soft">
                <Sprout size={16} className="-mt-0.5 mr-1.5 inline" />Só quer ver como funciona? Entrar como {PRODUCER.name} (demonstração)
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted"><Check size={12} /> Protótipo visual: nada do que você digitar é enviado ou salvo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
