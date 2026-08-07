import * as React from 'react'
import { Search, Share2 } from 'lucide-react'

import { supabase, type Seo as SeoTipo } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EstadoSalvo, useSalvamento } from '@/components/ui/estado-salvo'

const VAZIO: SeoTipo = {
  id: 1, meta_title: '', meta_description: '', og_image_url: '', canonical_url: '',
}

/* limites do Google: acima disso ele corta com reticências */
const LIMITE_TITULO = 60
const LIMITE_DESCRICAO = 155

export function Seo() {
  const [seo, setSeo] = React.useState<SeoTipo>(VAZIO)
  const [carregando, setCarregando] = React.useState(true)
  const { estado, erro, executar } = useSalvamento()

  React.useEffect(() => {
    supabase
      .from('seo')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSeo(data as SeoTipo)
        setCarregando(false)
      })
  }, [])

  const campo = (chave: keyof SeoTipo) => ({
    value: String(seo[chave] ?? ''),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSeo((s) => ({ ...s, [chave]: e.target.value })),
  })

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault()
    await executar(() => supabase.from('seo').upsert({ ...seo, id: 1 }))
  }

  if (carregando) {
    return <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
  }

  const tituloLongo = seo.meta_title.length > LIMITE_TITULO
  const descricaoLonga = seo.meta_description.length > LIMITE_DESCRICAO
  const dominioExemplo = seo.canonical_url.includes('SEU-DOMINIO')

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Busca e compartilhamento</CardTitle>
          <CardDescription>
            Como o site aparece no Google e quando alguém cola o link no WhatsApp.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={salvar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mt">Título na busca</Label>
              <Input id="mt" maxLength={70} {...campo('meta_title')} />
              <span
                className={cn(
                  'self-end font-mono text-[11px]',
                  tituloLongo ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {seo.meta_title.length}/{LIMITE_TITULO}
                {tituloLongo && ' — o Google vai cortar'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="md">Descrição na busca</Label>
              <textarea
                id="md"
                rows={3}
                maxLength={200}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm leading-relaxed focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
                {...campo('meta_description')}
              />
              <span
                className={cn(
                  'self-end font-mono text-[11px]',
                  descricaoLonga ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {seo.meta_description.length}/{LIMITE_DESCRICAO}
                {descricaoLonga && ' — o Google vai cortar'}
              </span>
            </div>

            {/* prévia do resultado no Google */}
            <div className="rounded-md border bg-secondary/40 p-5">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                <Search className="size-3" />
                no google
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {seo.canonical_url || 'seu-dominio.com.br'}
              </p>
              <p className="mt-1 truncate text-lg text-primary">
                {seo.meta_title.slice(0, LIMITE_TITULO) || 'título…'}
                {tituloLongo && '…'}
              </p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {seo.meta_description.slice(0, LIMITE_DESCRICAO) || 'descrição…'}
                {descricaoLonga && '…'}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="og">Imagem de compartilhamento — 1200×630</Label>
              <Input id="og" type="url" maxLength={500} {...campo('og_image_url')} />
              <span className="text-xs text-muted-foreground">
                Envie na aba Imagens e cole a URL aqui, ou gere uma em{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                  ferramentas/og-image.html
                </code>
              </span>
            </div>

            {/* prévia do cartão do WhatsApp */}
            <div className="rounded-md border bg-secondary/40 p-5">
              <p className="mb-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                <Share2 className="size-3" />
                no whatsapp
              </p>
              <div className="max-w-sm overflow-hidden rounded-md border bg-card">
                {seo.og_image_url ? (
                  <img
                    src={seo.og_image_url}
                    alt=""
                    className="aspect-[1200/630] w-full bg-muted object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="grid aspect-[1200/630] w-full place-items-center bg-muted text-xs text-muted-foreground">
                    sem imagem — o link vai aparecer sem prévia
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{seo.meta_title || 'título…'}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {seo.meta_description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="canon">Endereço oficial do site</Label>
              <Input id="canon" type="url" maxLength={500} {...campo('canonical_url')} />
              {dominioExemplo && (
                <span className="font-mono text-[11px] text-destructive">
                  ainda é o domínio de exemplo — troque pelo endereço real
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button type="submit" disabled={estado === 'salvando'}>
                Salvar SEO
              </Button>
              <EstadoSalvo estado={estado} erro={erro} />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-5 text-sm leading-relaxed">
          <p className="font-medium">Salvar aqui não muda o site sozinho</p>
          <p className="mt-1 text-muted-foreground">
            Buscadores e o robô de prévia do WhatsApp não executam JavaScript, então
            estas informações precisam estar escritas no arquivo. Depois de salvar, rode{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              node backend/publicar.js
            </code>{' '}
            e publique o site.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
