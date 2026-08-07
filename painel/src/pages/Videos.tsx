import * as React from 'react'
import { Plus, Trash2, AlertCircle, PlayCircle } from 'lucide-react'

import { supabase, urlPublica, type Video } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** capa automática do YouTube, quando não houver thumbnail própria */
function capaAutomatica(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : null
}

export function Videos() {
  const [videos, setVideos] = React.useState<Video[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const recarregar = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: false })

    if (error) setErro(error.message)
    else setVideos((data ?? []) as Video[])
    setCarregando(false)
  }, [])

  React.useEffect(() => { void recarregar() }, [recarregar])

  async function alterar(id: string, campos: Partial<Video>) {
    const antes = videos
    setVideos((v) => v.map((x) => (x.id === id ? { ...x, ...campos } : x)))

    const { error } = await supabase.from('videos').update(campos).eq('id', id)
    if (error) { setVideos(antes); setErro(error.message) }
  }

  async function criar() {
    const { error } = await supabase
      .from('videos')
      .insert({ titulo: 'Novo vídeo', url: '', publicado: false, ordem: 99 })

    if (error) setErro(error.message)
    else void recarregar()
  }

  async function apagar(v: Video) {
    if (!confirm(`Apagar o vídeo "${v.titulo}"? Não tem como desfazer.`)) return

    const { error } = await supabase.from('videos').delete().eq('id', v.id)
    if (error) setErro(error.message)
    else void recarregar()
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
        <CardHeader className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Galeria de vídeos</CardTitle>
            <CardDescription>
              Cole o link do YouTube ou do Vimeo. Só os marcados como “no site”
              aparecem para as clientes.
            </CardDescription>
          </div>
          <Button size="sm" onClick={criar}>
            <Plus />
            Novo vídeo
          </Button>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {carregando ? (
            <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
          ) : !videos.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground italic">
              Nenhum vídeo cadastrado. A seção de vídeos fica escondida no site
              enquanto não houver nenhum publicado.
            </p>
          ) : (
            videos.map((v) => {
              const capa = urlPublica(v.thumbnail_url) ?? capaAutomatica(v.url)

              return (
                <div
                  key={v.id}
                  className={cn(
                    'grid gap-4 rounded-md border p-4 md:grid-cols-[200px_1fr_auto]',
                    !v.publicado && 'border-dashed bg-muted/30',
                  )}
                >
                  <div className="grid aspect-video place-items-center overflow-hidden rounded-md bg-muted">
                    {capa ? (
                      <img
                        src={capa}
                        alt=""
                        className="size-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <PlayCircle className="size-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-3">
                    {!v.publicado && (
                      <span className="self-start rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-warning uppercase">
                        rascunho
                      </span>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`t-${v.id}`} className="text-xs">Título</Label>
                      <Input
                        id={`t-${v.id}`}
                        defaultValue={v.titulo}
                        maxLength={200}
                        onBlur={(e) => {
                          if (e.target.value !== v.titulo) alterar(v.id, { titulo: e.target.value })
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`u-${v.id}`} className="text-xs">
                        Link do vídeo
                      </Label>
                      <Input
                        id={`u-${v.id}`}
                        type="url"
                        defaultValue={v.url}
                        maxLength={500}
                        placeholder="https://youtube.com/watch?v=…"
                        onBlur={(e) => {
                          if (e.target.value !== v.url) alterar(v.id, { url: e.target.value })
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row items-start gap-3 md:flex-col">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={v.publicado}
                        onChange={(e) => {
                          if (e.target.checked && !v.url) {
                            setErro('Cole o link do vídeo antes de publicar.')
                            return
                          }
                          alterar(v.id, { publicado: e.target.checked })
                        }}
                      />
                      no site
                    </label>

                    <Button variant="ghost" size="sm" onClick={() => apagar(v)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 />
                      Apagar
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
