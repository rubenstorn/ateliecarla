import * as React from 'react'
import { Download, MessageCircle, AlertCircle } from 'lucide-react'

import {
  supabase, configurado, STATUS_LEAD, type Lead, type StatusLead,
} from '@/lib/supabase'
import { desdeQuando, linkWhatsApp } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COR_STATUS: Record<StatusLead, string> = {
  novo: 'var(--primary)',
  contatado: 'var(--warning)',
  agendado: 'var(--success)',
  atendido: 'var(--muted-foreground)',
  perdido: 'var(--destructive)',
}

export function Contatos() {
  const [leads, setLeads] = React.useState<Lead[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  const [filtro, setFiltro] = React.useState<StatusLead | ''>('')
  const [busca, setBusca] = React.useState('')

  React.useEffect(() => {
    if (!configurado) { setCarregando(false); return }

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

  async function atualizar(id: string, campos: Partial<Lead>) {
    const antes = leads
    setLeads((atual) => atual.map((l) => (l.id === id ? { ...l, ...campos } : l)))

    const { error } = await supabase.from('leads').update(campos).eq('id', id)
    if (error) {
      setLeads(antes)          /* desfaz se o banco recusar */
      setErro(error.message)
    }
  }

  const visiveis = leads.filter((l) => {
    if (filtro && l.status !== filtro) return false
    if (!busca) return true
    return (l.nome + ' ' + l.telefone).toLowerCase().includes(busca.toLowerCase())
  })

  function exportar() {
    const cabecalho = ['Data', 'Nome', 'Telefone', 'E-mail', 'Interesse', 'Mensagem', 'Status', 'Anotações']

    /* prefixa = + - @ para o Excel não interpretar como fórmula */
    const seguro = (v: unknown) => {
      const s = String(v ?? '')
      return /^[=+\-@]/.test(s) ? "'" + s : s
    }
    const celula = (v: unknown) => '"' + seguro(v).replace(/"/g, '""') + '"'

    const linhas = visiveis.map((l) =>
      [
        new Date(l.criado_em).toLocaleString('pt-BR'),
        l.nome, l.telefone, l.email, l.procedimento, l.mensagem, l.status, l.observacoes,
      ].map(celula).join(';'),
    )

    /* BOM para o Excel abrir os acentos certos */
    const blob = new Blob(['﻿' + [cabecalho.map(celula).join(';'), ...linhas].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    })

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `contatos-atelie-carla-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col gap-6">
      {erro && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="font-mono text-xs text-destructive">{erro}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Contatos recebidos</CardTitle>
            <CardDescription>
              Mude o status conforme for atendendo. Salva automaticamente.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportar} disabled={!visiveis.length}>
            <Download />
            Baixar planilha
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-status" className="text-xs">Status</Label>
              <select
                id="f-status"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value as StatusLead | '')}
                className="h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="">todos</option>
                {STATUS_LEAD.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <Label htmlFor="f-busca" className="text-xs">Buscar</Label>
              <Input
                id="f-busca"
                type="search"
                placeholder="nome ou telefone"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {carregando ? (
            <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
          ) : !visiveis.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground italic">
              {leads.length ? 'Nenhum contato com esse filtro.' : 'Nenhum contato ainda.'}
            </p>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    {['Quando', 'Nome', 'Telefone', 'Interesse', 'Status', 'Anotações', ''].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left font-mono text-[10px] tracking-[0.1em] whitespace-nowrap text-muted-foreground uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((lead) => (
                    <tr key={lead.id} className="border-b transition-colors last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {desdeQuando(lead.criado_em)}
                      </td>
                      <td className="px-3 py-3 font-medium">{lead.nome}</td>
                      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">
                        <a href={`tel:${lead.telefone.replace(/\D/g, '')}`} className="hover:text-primary">
                          {lead.telefone}
                        </a>
                      </td>
                      <td className="max-w-52 truncate px-3 py-3 text-muted-foreground">
                        {lead.procedimento ?? '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: COR_STATUS[lead.status] }}
                          />
                          <select
                            value={lead.status}
                            onChange={(e) => atualizar(lead.id, { status: e.target.value as StatusLead })}
                            aria-label={`Status de ${lead.nome}`}
                            className="rounded-full border border-input bg-card px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {STATUS_LEAD.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          defaultValue={lead.observacoes ?? ''}
                          placeholder="anotação interna"
                          onBlur={(e) => {
                            const v = e.target.value.trim()
                            if (v !== (lead.observacoes ?? '')) {
                              atualizar(lead.id, { observacoes: v || null })
                            }
                          }}
                          className="h-9 min-w-40 text-xs"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={linkWhatsApp(
                              lead.telefone,
                              `Olá, ${lead.nome.split(' ')[0]}! Aqui é do Ateliê Carla Denise.`,
                            )}
                            target="_blank"
                            rel="noopener"
                          >
                            <MessageCircle />
                            WhatsApp
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
