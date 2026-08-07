import * as React from 'react'
import { ExternalLink } from 'lucide-react'

import { supabase, type Hero } from '@/lib/supabase'
import { URL_SITE } from '@/lib/urls'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EstadoSalvo, useSalvamento } from '@/components/ui/estado-salvo'

const VAZIO: Hero = {
  id: 1, selo: '', titulo: '', titulo_destaque: '',
  subtitulo: '', cta_texto: '', cta_url: '',
}

export function Abertura() {
  const [hero, setHero] = React.useState<Hero>(VAZIO)
  const [carregando, setCarregando] = React.useState(true)
  const { estado, erro, executar } = useSalvamento()

  React.useEffect(() => {
    supabase
      .from('hero')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHero(data as Hero)
        setCarregando(false)
      })
  }, [])

  const campo = (chave: keyof Hero) => ({
    value: String(hero[chave] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setHero((h) => ({ ...h, [chave]: e.target.value })),
  })

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    await executar(() => supabase.from('hero').upsert({ ...hero, id: 1 }))
  }

  if (carregando) {
    return <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Bloco de abertura</CardTitle>
          <CardDescription>
            O primeiro texto que a visitante lê ao abrir o site.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={salvar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="selo">Selo pequeno acima do título</Label>
              <Input id="selo" maxLength={120} {...campo('selo')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo">Título — primeira parte</Label>
              <Input id="titulo" maxLength={200} {...campo('titulo')} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destaque">
                Título — parte em destaque{' '}
                <span className="font-normal text-muted-foreground">
                  (aparece em serifa itálica roxa)
                </span>
              </Label>
              <Input id="destaque" maxLength={200} {...campo('titulo_destaque')} />
            </div>

            {/* prévia da tipografia, para não precisar abrir o site */}
            <div className="rounded-md border bg-secondary/40 p-5">
              <p className="mb-3 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                como vai aparecer
              </p>
              <p className="text-2xl leading-tight font-semibold tracking-tight">
                {hero.titulo || <span className="text-muted-foreground">título…</span>}{' '}
                <em className="font-serif font-normal text-primary italic">
                  {hero.titulo_destaque}
                </em>
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subtitulo">Parágrafo de apoio</Label>
              <textarea
                id="subtitulo"
                rows={4}
                maxLength={600}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
                {...campo('subtitulo')}
              />
              <span className="self-end font-mono text-[11px] text-muted-foreground">
                {hero.subtitulo.length}/600
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cta-texto">Texto do botão</Label>
                <Input id="cta-texto" maxLength={60} {...campo('cta_texto')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cta-url">Link do botão</Label>
                <Input id="cta-url" type="url" maxLength={500} {...campo('cta_url')} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={estado === 'salvando'}>
                Salvar abertura
              </Button>
              <EstadoSalvo estado={estado} erro={erro} />
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <a href={URL_SITE} target="_blank" rel="noopener">
                  <ExternalLink />
                  Ver no site
                </a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-5 text-sm leading-relaxed">
          <p className="font-medium">O site atualiza na hora</p>
          <p className="mt-1 text-muted-foreground">
            Para que o texto novo apareça também no Google e na prévia do
            WhatsApp, rode{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              node backend/publicar.js
            </code>{' '}
            e publique o site — buscadores não executam JavaScript.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
