import * as React from 'react'
import { Upload, Trash2, AlertCircle, Copy, Check } from 'lucide-react'

import { supabase, urlPublica, type Midia } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const BUCKET = 'midias'
const LIMITE_BYTES = 5 * 1024 * 1024

/* =========================================================
   Grupos de imagem

   A distinção que importa é "automatico":

   · automatico = true  → a imagem aparece no site sozinha assim
     que você marca "no site". Hoje só a galeria funciona assim.

   · automatico = false → o site NÃO lê este grupo. A imagem fica
     guardada aqui e você copia a URL para colar onde ela é usada.
     O botão de copiar (ícone ao lado da lixeira) serve para isso.

   Isto existe porque antes a tela oferecia cinco grupos com o
   mesmo botão "no site", e quatro deles não faziam nada — dava a
   entender que a foto tinha sido publicada quando não tinha.
   ========================================================= */

interface Grupo {
  valor: string
  rotulo: string
  automatico: boolean
  onde: string
  /** proporção usada no recorte (object-fit: cover) do lugar onde a imagem entra */
  proporcao: string
  /** tamanho de arquivo sugerido para não sair borrado nem pesado demais */
  tamanho: string
}

const GRUPOS: Grupo[] = [
  {
    valor: 'galeria',
    rotulo: 'Galeria do site',
    automatico: true,
    onde: 'aparece na seção "antes e depois" da página',
    proporcao: 'quadrada (1:1)',
    tamanho: '1000×1000px',
  },
  {
    valor: 'compartilhamento',
    rotulo: 'Imagem de compartilhamento',
    automatico: false,
    onde: 'copie a URL e cole na aba Busca e SEO',
    proporcao: 'paisagem (1200×630, fixo)',
    tamanho: '1200×630px',
  },
  {
    valor: 'capa-categoria',
    rotulo: 'Capa de categoria',
    automatico: false,
    onde: 'copie a URL e cole no campo "foto" da categoria (não do item) em dados/catalogo.json',
    proporcao: 'faixa larga (~2:1)',
    tamanho: '900×450px',
  },
  {
    valor: 'foto-procedimento',
    rotulo: 'Foto de procedimento',
    automatico: false,
    onde: 'copie a URL e cole no campo "foto" do item dentro de "itens" em dados/catalogo.json',
    proporcao: 'quadrada (1:1)',
    tamanho: '300×300px',
  },
  {
    valor: 'atelie',
    rotulo: 'Fotos do ateliê',
    automatico: false,
    onde: 'guardadas aqui; ainda não há seção no site que as use',
    proporcao: 'livre — ainda sem lugar fixo no site',
    tamanho: '1200×900px',
  },
]

const grupoDe = (valor: string): Grupo =>
  GRUPOS.find((g) => g.valor === valor) ?? {
    valor,
    rotulo: valor,
    automatico: false,
    onde: 'grupo antigo — o site não lê',
    proporcao: '—',
    tamanho: '—',
  }

/** tira acento e caractere estranho do nome do arquivo */
function nomeSeguro(nome: string) {
  return nome
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80)
}

/** mede antes de enviar, para gravar largura/altura e evitar salto de layout */
function medir(arquivo: File): Promise<{ largura: number | null; altura: number | null }> {
  return new Promise((ok) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); ok({ largura: img.naturalWidth, altura: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); ok({ largura: null, altura: null }) }
    img.src = url
  })
}

export function Imagens() {
  const [midias, setMidias] = React.useState<Midia[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)
  const [grupo, setGrupo] = React.useState('galeria')
  const [enviando, setEnviando] = React.useState(0)
  const [sobre, setSobre] = React.useState(false)
  const [copiada, setCopiada] = React.useState<string | null>(null)
  const entrada = React.useRef<HTMLInputElement>(null)

  const recarregar = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('midias')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) setErro(error.message)
    else setMidias((data ?? []) as Midia[])
    setCarregando(false)
  }, [])

  React.useEffect(() => { void recarregar() }, [recarregar])

  async function enviar(arquivos: File[]) {
    const imagens = arquivos.filter((a) => a.type.startsWith('image/'))
    if (!imagens.length) { setErro('Escolha arquivos de imagem.'); return }

    setErro(null)

    for (let i = 0; i < imagens.length; i++) {
      const arquivo = imagens[i]
      setEnviando(Math.round(((i + 1) / imagens.length) * 100))

      if (arquivo.size > LIMITE_BYTES) {
        setErro(`${arquivo.name} passa de 5 MB e foi ignorado.`)
        continue
      }

      const { largura, altura } = await medir(arquivo)
      const caminho = `${grupo}/${Date.now()}-${nomeSeguro(arquivo.name)}`

      const { error: erroUp } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { cacheControl: '31536000', upsert: false })

      if (erroUp) { setErro(`${arquivo.name}: ${erroUp.message}`); continue }

      const { error: erroReg } = await supabase.from('midias').insert({
        titulo: arquivo.name.replace(/\.[^.]+$/, ''),
        imagem_url: caminho,
        alt: '',
        grupo,
        largura,
        altura,
        publicado: false,
      })

      /* se o registro falhar, remove o arquivo para não deixar lixo no bucket */
      if (erroReg) {
        await supabase.storage.from(BUCKET).remove([caminho])
        setErro(`${arquivo.name}: enviou mas não registrou — ${erroReg.message}`)
      }
    }

    setEnviando(0)
    void recarregar()
  }

  async function alterar(id: string, campos: Partial<Midia>) {
    const antes = midias
    setMidias((m) => m.map((x) => (x.id === id ? { ...x, ...campos } : x)))

    const { error } = await supabase.from('midias').update(campos).eq('id', id)
    if (error) { setMidias(antes); setErro(error.message) }
  }

  async function apagar(m: Midia) {
    if (!confirm(`Apagar "${m.titulo}"? O arquivo sai do armazenamento também.`)) return

    if (!/^https?:\/\//.test(m.imagem_url)) {
      const { error } = await supabase.storage.from(BUCKET).remove([m.imagem_url])
      if (error) { setErro(`não apagou o arquivo: ${error.message}`); return }
    }

    const { error } = await supabase.from('midias').delete().eq('id', m.id)
    if (error) setErro(error.message)
    else void recarregar()
  }

  async function copiarUrl(m: Midia) {
    const url = urlPublica(m.imagem_url)
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopiada(m.id)
    setTimeout(() => setCopiada(null), 2000)
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
        <CardHeader>
          <CardTitle>Imagens</CardTitle>
          <CardDescription>
            Arraste as fotos para enviar. Elas entram como rascunho — marque
            “no site” para publicar.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5 sm:max-w-md">
            <Label htmlFor="grupo">Onde estas imagens vão ser usadas</Label>
            <select
              id="grupo"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {GRUPOS.map((g) => (
                <option key={g.valor} value={g.valor}>{g.rotulo}</option>
              ))}
            </select>

            {/* diz na hora se este grupo publica sozinho ou não */}
            <p
              className={cn(
                'text-xs leading-relaxed',
                grupoDe(grupo).automatico ? 'text-success' : 'text-warning',
              )}
            >
              {grupoDe(grupo).automatico
                ? `Publica sozinho: ${grupoDe(grupo).onde}.`
                : `Não publica sozinho — ${grupoDe(grupo).onde}.`}
            </p>

            {/* tamanho recomendado: a imagem é recortada (object-fit: cover)
                no formato do lugar onde ela entra, então mandar fora dessa
                proporção corta gente/detalhe sem avisar */}
            <p className="text-xs text-muted-foreground">
              Tamanho ideal: <span className="font-mono">{grupoDe(grupo).tamanho}</span>
              {' · '}proporção {grupoDe(grupo).proporcao}
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => entrada.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); entrada.current?.click() } }}
            onDragOver={(e) => { e.preventDefault(); setSobre(true) }}
            onDragLeave={() => setSobre(false)}
            onDrop={(e) => { e.preventDefault(); setSobre(false); void enviar(Array.from(e.dataTransfer.files)) }}
            className={cn(
              'cursor-pointer rounded-md border-2 border-dashed p-10 text-center transition-colors',
              sobre ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/60 hover:bg-accent/40',
            )}
          >
            <input
              ref={entrada}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              hidden
              onChange={(e) => { void enviar(Array.from(e.target.files ?? [])); e.target.value = '' }}
            />
            <Upload className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Arraste as fotos aqui</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ou clique para escolher · JPG, PNG, WebP ou AVIF · até 5 MB cada
            </p>

            {enviando > 0 && (
              <div className="mx-auto mt-5 h-1 max-w-xs overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${enviando}%` }} />
              </div>
            )}
          </div>

          {carregando ? (
            <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
          ) : !midias.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground italic">
              Nenhuma imagem enviada ainda.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {midias.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-col overflow-hidden rounded-md border',
                    /* tracejado = rascunho. Só faz sentido onde existe
                       publicação; nos outros grupos a imagem nunca deixaria
                       de ser "rascunho" e a borda ficaria tracejada para
                       sempre, sem querer dizer nada. */
                    grupoDe(m.grupo).automatico && !m.publicado && 'border-dashed bg-muted/30',
                  )}
                >
                  <img
                    src={urlPublica(m.imagem_url) ?? ''}
                    alt={m.alt}
                    loading="lazy"
                    className="aspect-[4/3] w-full bg-muted object-cover"
                  />

                  <div className="flex flex-1 flex-col gap-3 p-3">
                    <div>
                      <p className="truncate text-sm font-medium">{m.titulo}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {m.grupo}{m.largura ? ` · ${m.largura}×${m.altura}` : ''}
                        {' · '}ideal {grupoDe(m.grupo).tamanho}
                      </p>
                      <p
                        className={cn(
                          'mt-1.5 text-[11px] leading-snug',
                          grupoDe(m.grupo).automatico
                            ? m.publicado ? 'text-success' : 'text-muted-foreground'
                            : 'text-warning',
                        )}
                      >
                        {grupoDe(m.grupo).automatico
                          ? m.publicado
                            ? 'No ar na galeria'
                            : 'Rascunho — marque "no site" para publicar'
                          : grupoDe(m.grupo).onde}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`alt-${m.id}`} className="text-[11px]">
                        Descrição da imagem
                      </Label>
                      <Input
                        id={`alt-${m.id}`}
                        defaultValue={m.alt}
                        maxLength={300}
                        placeholder="para leitores de tela"
                        className="h-9 text-xs"
                        onBlur={(e) => {
                          if (e.target.value !== m.alt) alterar(m.id, { alt: e.target.value })
                        }}
                      />
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      {/* o "no site" só aparece em grupo que o site lê.
                          Nos outros ele não teria efeito nenhum, e um
                          controle que não faz nada engana quem usa. */}
                      {grupoDe(m.grupo).automatico && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={m.publicado}
                            onChange={(e) => alterar(m.id, { publicado: e.target.checked })}
                          />
                          no site
                        </label>
                      )}

                      <Button variant="ghost" size="sm" className="ml-auto size-8 p-0"
                        onClick={() => copiarUrl(m)} title="Copiar endereço da imagem">
                        {copiada === m.id ? <Check className="text-success" /> : <Copy />}
                      </Button>

                      <Button variant="ghost" size="sm" className="size-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => apagar(m)} title="Apagar">
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
