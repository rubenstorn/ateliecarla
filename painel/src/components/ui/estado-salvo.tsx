import * as React from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export type Estado = 'parado' | 'salvando' | 'salvo' | 'erro'

/** Indicador ao lado do botão: salvando / salvo / erro */
export function EstadoSalvo({ estado, erro }: { estado: Estado; erro?: string | null }) {
  if (estado === 'parado') return null

  const base = 'flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] uppercase'

  if (estado === 'salvando') {
    return (
      <span className={cn(base, 'text-muted-foreground')}>
        <Loader2 className="size-3.5 animate-spin" />
        salvando
      </span>
    )
  }

  if (estado === 'salvo') {
    return (
      <span className={cn(base, 'text-success')}>
        <Check className="size-3.5" />
        salvo
      </span>
    )
  }

  return (
    <span className={cn(base, 'normal-case tracking-normal text-destructive')}>
      <AlertCircle className="size-3.5 shrink-0" />
      {erro ?? 'não salvou'}
    </span>
  )
}

/**
 * Controla o ciclo parado → salvando → salvo/erro, voltando a
 * "parado" sozinho depois de alguns segundos.
 */
export function useSalvamento() {
  const [estado, setEstado] = React.useState<Estado>('parado')
  const [erro, setErro] = React.useState<string | null>(null)
  const timer = React.useRef<number>()

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  /* PromiseLike, não Promise: o query builder do Supabase é um
     thenable — tem .then() mas não .catch()/.finally(). */
  const executar = React.useCallback(async (
    acao: () => PromiseLike<{ error: { message: string } | null }>,
  ) => {
    window.clearTimeout(timer.current)
    setEstado('salvando')
    setErro(null)

    const { error } = await acao()

    if (error) {
      setEstado('erro')
      setErro(error.message)
      return false
    }

    setEstado('salvo')
    timer.current = window.setTimeout(() => setEstado('parado'), 2600)
    return true
  }, [])

  return { estado, erro, executar }
}
