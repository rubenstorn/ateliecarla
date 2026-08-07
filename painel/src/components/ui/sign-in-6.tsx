import * as React from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/* =========================================================
   Login do painel — baseado no componente sign-in-6

   Estrutura preservada do original: card de duas colunas, painel
   esquerdo em gradiente com esfera desfocada, coluna direita com
   o formulário.

   O que foi trocado, e por quê:

   · "Continue with Google" — REMOVIDO. Entrar com Google exige um
     projeto no Google Cloud e tela de consentimento configurada.
     Um botão que não funciona é pior que botão nenhum. Dá para
     ligar depois pelo Supabase Auth.

   · Os três avatares e o "Join 40,000+ teams" — REMOVIDOS. Eram
     fotos de desconhecidos vindas do Unsplash e prova social
     falsa. Num painel privado de um ateliê com uma profissional,
     não fazem sentido nenhum.

   · "Acme" — virou a marca real, com o logotipo do ateliê.

   · "Start free trial" — REMOVIDO. Não existe cadastro público:
     a conta é criada por você no painel do Supabase.
   ========================================================= */

export interface SignIn6Props {
  onEntrar: (email: string, senha: string) => Promise<void>
  carregando?: boolean
  erro?: string | null
  bloqueado?: boolean
  avisoBloqueio?: string
}

export function SignIn6({
  onEntrar,
  carregando = false,
  erro = null,
  bloqueado = false,
  avisoBloqueio,
}: SignIn6Props) {
  const [email, setEmail] = React.useState('')
  const [senha, setSenha] = React.useState('')

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault()
    if (bloqueado || carregando) return
    await onEntrar(email.trim(), senha)
  }

  return (
    <Card className="grid w-full gap-0 overflow-hidden p-0 md:grid-cols-2">
      {/* ---------- coluna decorativa ---------- */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-b from-primary to-primary/80 p-10 text-primary-foreground md:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-primary-foreground/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <img
            src="/logo-atelie-carla.svg"
            alt="Ateliê Carla Denise"
            className="h-11 w-auto brightness-0 invert"
          />
        </div>

        <h2 className="relative mt-auto max-w-[18ch] font-serif text-[30px] leading-[1.1] tracking-tight text-balance">
          Sobrancelhas que combinam com o{' '}
          <em className="italic">seu rosto</em>.
        </h2>

        <div className="relative mt-8 flex items-start gap-3 text-primary-foreground/85">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p className="text-xs leading-relaxed">
            Área restrita. Aqui você edita o site e vê os contatos recebidos
            pelo formulário.
          </p>
        </div>
      </div>

      {/* ---------- formulário ---------- */}
      <form onSubmit={enviar} className="flex flex-col justify-center gap-5 p-8">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-semibold">Bem-vinda de volta</span>
          <span className="text-xs text-muted-foreground">
            Entre com o e-mail e a senha do ateliê.
          </span>
        </div>

        {bloqueado && avisoBloqueio && (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
            {avisoBloqueio}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ss-email" className="text-xs">
              E-mail
            </Label>
            <Input
              id="ss-email"
              type="email"
              required
              autoComplete="username"
              placeholder="carla@ateliecarla.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={bloqueado || carregando}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ss-password" className="text-xs">
              Senha
            </Label>
            {/* sem minLength: aqui a senha já existe, e exigir um tamanho
                mínimo na tela de LOGIN só bloquearia o envio de uma senha
                válida mais curta, com um aviso do navegador que não explica
                nada. Regra de tamanho pertence a quem cria a senha. */}
            <Input
              id="ss-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={bloqueado || carregando}
            />
          </div>
        </div>

        {erro && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
          >
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={bloqueado || carregando}>
          {carregando && <Loader2 className="animate-spin" />}
          {carregando ? 'Entrando…' : 'Entrar'}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Esqueceu a senha? Ela é redefinida no painel do Supabase,
          em Authentication › Users.
        </p>
      </form>
    </Card>
  )
}

export default SignIn6
