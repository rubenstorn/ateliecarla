import * as React from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, CalendarCheck, TrendingUp, AlertCircle } from 'lucide-react'

import { supabase, configurado, type Lead } from '@/lib/supabase'
import { desdeQuando } from '@/lib/utils'
import { Metrica } from '@/components/layout/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!configurado) {
      setCarregando(false)
      return
    }

    supabase
      .from('leads')
      .select('*')
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setLeads(data ?? [])
        setCarregando(false)
      })
  }, [])

  const novos = leads.filter((l) => l.status === 'novo').length
  const semana = leads.filter(
    (l) => Date.now() - new Date(l.criado_em).getTime() < 6.048e8,
  ).length
  const agendados = leads.filter(
    (l) => l.status === 'agendado' || l.status === 'atendido',
  ).length

  /* taxa de conversão: dos contatos recebidos, quantos viraram agenda */
  const conversao = leads.length ? Math.round((agendados / leads.length) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {!configurado && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Banco de dados não configurado</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                Copie <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">painel/.env.example</code>{' '}
                para <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">painel/.env</code> e
                preencha as duas chaves do Supabase. O passo a passo está em{' '}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">backend/README.md</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {erro && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-medium">Não foi possível ler os contatos</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{erro}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* faixa de métricas, no formato do CoreUI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica tom={1} valor={novos} rotulo="Aguardando contato" Icone={Clock}
          detalhe={novos ? 'responda hoje' : 'nada pendente'} />
        <Metrica tom={2} valor={semana} rotulo="Nos últimos 7 dias" Icone={TrendingUp} />
        <Metrica tom={3} valor={agendados} rotulo="Agendados ou atendidos" Icone={CalendarCheck} />
        <Metrica tom={4} valor={`${conversao}%`} rotulo="Viraram agendamento" Icone={Users}
          detalhe={`de ${leads.length} contato(s)`} />
      </div>

      {/* últimos contatos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Últimos contatos</CardTitle>
            <CardDescription>Quem preencheu o formulário do site.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/contatos">Ver todos</Link>
          </Button>
        </CardHeader>

        <CardContent>
          {carregando ? (
            <p className="py-8 text-center text-sm text-muted-foreground">carregando…</p>
          ) : leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground italic">
              Nenhum contato ainda. Quando alguém preencher o formulário do site,
              aparece aqui.
            </p>
          ) : (
            <ul className="divide-y">
              {leads.slice(0, 6).map((lead) => (
                <li key={lead.id} className="flex items-center gap-4 py-3">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      background:
                        lead.status === 'novo'
                          ? 'var(--primary)'
                          : lead.status === 'agendado' || lead.status === 'atendido'
                            ? 'var(--success)'
                            : 'var(--muted-foreground)',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{lead.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {lead.procedimento ?? 'sem procedimento indicado'}
                    </p>
                  </div>
                  <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                    {desdeQuando(lead.criado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
