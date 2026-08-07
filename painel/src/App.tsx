import * as React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'

import { supabase, configurado, type Lead } from '@/lib/supabase'
import { SignIn6 } from '@/components/ui/sign-in-6'
import { Shell } from '@/components/layout/Shell'
import { Dashboard } from '@/pages/Dashboard'
import { Contatos } from '@/pages/Contatos'
import { Abertura } from '@/pages/Abertura'
import { Videos } from '@/pages/Videos'
import { Imagens } from '@/pages/Imagens'
import { Seo } from '@/pages/Seo'
import { Previa } from '@/pages/Previa'

/* =========================================================
   App — sessão, rotas e proteção

   O portão de autenticação é aqui, mas ele é conveniência de
   interface, não segurança. A segurança de verdade está nas
   políticas de RLS do Postgres: mesmo que alguém contornasse
   esta tela, o banco recusaria ler os contatos sem sessão válida.
   ========================================================= */

export default function App() {
  const [sessao, setSessao] = React.useState<Session | null>(null)
  const [verificando, setVerificando] = React.useState(true)
  const [entrando, setEntrando] = React.useState(false)
  const [erro, setErro] = React.useState<string | null>(null)
  const [novosLeads, setNovosLeads] = React.useState(0)

  /* sessão existente + escuta de login/logout */
  React.useEffect(() => {
    if (!configurado) {
      setVerificando(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setVerificando(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  /* contador do menu: quantos contatos aguardando resposta */
  React.useEffect(() => {
    if (!sessao) return

    supabase
      .from('leads')
      .select('status')
      .eq('status', 'novo')
      .then(({ data }) => setNovosLeads((data as Pick<Lead, 'status'>[] | null)?.length ?? 0))
  }, [sessao])

  async function entrar(email: string, senha: string) {
    setErro(null)
    setEntrando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

    setEntrando(false)

    /* mensagem genérica de propósito: não confirmar se o e-mail existe */
    if (error) setErro('E-mail ou senha incorretos.')
  }

  async function sair() {
    await supabase.auth.signOut()
    setSessao(null)
  }

  if (verificando) {
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <p className="font-mono text-xs tracking-[0.16em] text-muted-foreground uppercase">
          carregando…
        </p>
      </div>
    )
  }

  /* rota de revisão visual, só em desenvolvimento — permite ver o
     painel montado sem banco nem login. Sai do pacote publicado. */
  if (import.meta.env.DEV && window.location.pathname === '/__previa') {
    return (
      <BrowserRouter>
        <Shell email="previa@ateliecarla" novosLeads={2} onSair={() => {}}>
          <Previa />
        </Shell>
      </BrowserRouter>
    )
  }

  if (!sessao) {
    return (
      <div className="grid min-h-svh w-full place-items-center bg-gradient-to-b from-background to-secondary/40 p-6">
        <div className="w-full max-w-3xl">
          <SignIn6
            onEntrar={entrar}
            carregando={entrando}
            erro={erro}
            bloqueado={!configurado}
            avisoBloqueio={
              'Banco de dados não configurado. Copie painel/.env.example para painel/.env ' +
              'e preencha as duas chaves do Supabase — passo a passo em backend/README.md.'
            }
          />
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Shell email={sessao.user.email ?? ''} novosLeads={novosLeads} onSair={sair}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contatos" element={<Contatos />} />
          <Route path="/abertura" element={<Abertura />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/imagens" element={<Imagens />} />
          <Route path="/seo" element={<Seo />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
