import { Clock, TrendingUp, CalendarCheck, Users } from 'lucide-react'

import { Metrica } from '@/components/layout/Shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { desdeQuando } from '@/lib/utils'

/* =========================================================
   Pré-visualização — SÓ EM DESENVOLVIMENTO

   Mostra o painel com dados de exemplo, sem precisar de banco
   nem de login. Serve para revisar o visual enquanto o Supabase
   não está configurado.

   O App só registra esta rota quando import.meta.env.DEV é true,
   então ela não existe no site publicado.
   ========================================================= */

const EXEMPLOS = [
  { nome: 'Fernanda Alves', proc: 'Nanoblading', min: 12, status: 'novo' },
  { nome: 'Juliana Prado', proc: 'Correção · método Repigment', min: 95, status: 'novo' },
  { nome: 'Marina Costa', proc: 'Micropigmentação labial', min: 380, status: 'agendado' },
  { nome: 'Beatriz Lima', proc: 'Design de sobrancelhas', min: 1500, status: 'atendido' },
  { nome: 'Camila Souza', proc: null, min: 4200, status: 'contatado' },
]

export function Previa() {
  const agora = Date.now()

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-5 text-sm">
          <p className="font-medium">Pré-visualização com dados fictícios</p>
          <p className="mt-1 text-muted-foreground">
            Esta tela existe só no ambiente de desenvolvimento, para revisar o
            visual sem banco de dados. Não vai para o site publicado.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metrica tom={1} valor={2} rotulo="Aguardando contato" detalhe="responda hoje" Icone={Clock} />
        <Metrica tom={2} valor={3} rotulo="Nos últimos 7 dias" Icone={TrendingUp} />
        <Metrica tom={3} valor={2} rotulo="Agendados ou atendidos" Icone={CalendarCheck} />
        <Metrica tom={4} valor="40%" rotulo="Viraram agendamento" detalhe="de 5 contato(s)" Icone={Users} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos contatos</CardTitle>
          <CardDescription>Quem preencheu o formulário do site.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {EXEMPLOS.map((e) => (
              <li key={e.nome} className="flex items-center gap-4 py-3">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      e.status === 'novo'
                        ? 'var(--primary)'
                        : e.status === 'agendado' || e.status === 'atendido'
                          ? 'var(--success)'
                          : 'var(--muted-foreground)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.proc ?? 'sem procedimento indicado'}
                  </p>
                </div>
                <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                  {desdeQuando(new Date(agora - e.min * 60000).toISOString())}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
