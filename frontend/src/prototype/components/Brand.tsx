// Elementos da marca AgroBits (logo isométrica do Victor — docs/brand/).
import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Símbolo + nome. `tone="light"` para fundo escuro. */
export function Logo({ size = 40, tone = 'light', tagline, className }: { size?: number; tone?: 'light' | 'dark'; tagline?: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <img src="/brand/agrobits-simbolo.png" alt="" width={size} height={size} className="shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,.25)]" />
      <span>
        <span className={clsx('block font-display font-extrabold leading-none tracking-tight', tone === 'light' ? 'text-white' : 'text-ink')} style={{ fontSize: size * 0.5 }}>AgroBits</span>
        {tagline && <span className={clsx('mt-0.5 block text-[11px] leading-tight', tone === 'light' ? 'text-white/60' : 'text-muted')}>{tagline}</span>}
      </span>
    </span>
  )
}

/** Cubo isométrico (como os da logo) com um número/ícone na face frontal-direita. */
export function IsoCube({ size = 30, top = '#7BE3A8', left = '#4FD08A', right = '#1F7A45', children, className }: {
  size?: number; top?: string; left?: string; right?: string; children?: ReactNode; className?: string
}) {
  return (
    <span className={clsx('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }} aria-hidden={children ? undefined : true}>
      <svg viewBox="0 0 32 32" className="absolute inset-0 h-full w-full">
        <g stroke="#0E3B22" strokeWidth="2" strokeLinejoin="round">
          <path d="M16 2 29 9.5 16 17 3 9.5Z" fill={top} />
          <path d="M3 9.5 16 17v13L3 22.5Z" fill={left} />
          <path d="M29 9.5 16 17v13l13-7.5Z" fill={right} />
        </g>
      </svg>
      {children != null && <span className="relative mt-[40%] ml-[44%] font-display font-extrabold leading-none text-white [text-shadow:0_1px_0_#0E3B22,1px_0_0_#0E3B22,-1px_0_0_#0E3B22,0_-1px_0_#0E3B22]" style={{ fontSize: Math.round(size * 0.4) }}>{children}</span>}
    </span>
  )
}

export const CUBE_DONE = { top: '#7BE3A8', left: '#4FD08A', right: '#1F7A45' }
export const CUBE_TODO = { top: '#F3D29B', left: '#E2AE5F', right: '#9A6516' }
