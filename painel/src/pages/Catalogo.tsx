import * as React from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'

import {
  supabase, urlPublica, TONS_CATEGORIA,
  type CatalogoConfig, type CatalogoCategoria, type CatalogoItem,
} from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/* =========================================================
   Catálogo — dois módulos, uma fonte de verdade

   O site continua lendo dados/catalogo.json (fetch estático,
   sem depender do Supabase no ar). Este painel edita as tabelas
   catalogo_config/catalogo_categorias/catalogo_itens; para o
   site enxergar a mudança, rode depois:

     node ferramentas/exportar-catalogo.mjs

   Isso regrava o JSON a partir do banco. É um passo manual de
   propósito — publicar sem revisar a tabela de preços é o tipo
   de erro caro de deixar automático.
   ========================================================= */

type Modulo = 'categorias' | 'procedimentos'

export function Catalogo() {
  const [modulo, setModulo] = React.useState<Modulo>('categorias')
  const [config, setConfig] = React.useState<CatalogoConfig | null>(null)
  const [categorias, setCategorias] = React.useState<CatalogoCategoria[]>([])
  const [itens, setItens] = React.useState<CatalogoItem[]>([])
  const [carregando, setCarregando] = React.useState(true)
  const [erro, setErro] = React.useState<string | null>(null)

  const recarregar = React.useCallback(async () => {
    const [c, cats, its] = await Promise.all([
      supabase.from('catalogo_config').select('*').eq('id', 1).maybeSingle(),
      supabase.from('catalogo_categorias').select('*').order('ordem').order('titulo'),
      supabase.from('catalogo_itens').select('*').order('ordem').order('nome'),
    ])

    const primeiroErro = c.error || cats.error || its.error
    if (primeiroErro) setErro(primeiroErro.message)

    setConfig((c.data ?? null) as CatalogoConfig | null)
    setCategorias((cats.data ?? []) as CatalogoCategoria[])
    setItens((its.data ?? []) as CatalogoItem[])
    setCarregando(false)
  }, [])

  React.useEffect(() => { void recarregar() }, [recarregar])

  async function salvarConfig(campos: Partial<CatalogoConfig>) {
    if (!config) return
    const antes = config
    setConfig({ ...config, ...campos })

    const { error } = await supabase.from('catalogo_config').update(campos).eq('id', 1)
    if (error) { setConfig(antes); setErro(error.message) }
  }

  async function criarCategoria() {
    const { error } = await supabase.from('catalogo_categorias').insert({
      titulo: 'Nova categoria', tom: 'rosa', preco_partir: '', tempo: '', etiqueta: '', ordem: categorias.length,
    })
    if (error) setErro(error.message)
    else void recarregar()
  }

  async function alterarCategoria(id: string, campos: Partial<CatalogoCategoria>) {
    const antes = categorias
    setCategorias((cs) => cs.map((c) => (c.id === id ? { ...c, ...campos } : c)))
    const { error } = await supabase.from('catalogo_categorias').update(campos).eq('id', id)
    if (error) { setCategorias(antes); setErro(error.message) }
  }

  async function apagarCategoria(c: CatalogoCategoria) {
    const qtd = itens.filter((i) => i.categoria_id === c.id).length
    const aviso = qtd
      ? `Apagar "${c.titulo}" e os ${qtd} procedimentos dentro dela? Não tem como desfazer.`
      : `Apagar "${c.titulo}"? Não tem como desfazer.`
    if (!confirm(aviso)) return

    const { error } = await supabase.from('catalogo_categorias').delete().eq('id', c.id)
    if (error) setErro(error.message)
    else void recarregar()
  }

  async function criarItem(categoriaId: string) {
    const daCategoria = itens.filter((i) => i.categoria_id === categoriaId)
    const { error } = await supabase.from('catalogo_itens').insert({
      categoria_id: categoriaId, nome: 'Novo procedimento', preco: '', duracao: '', etiqueta: '',
      ordem: daCategoria.length,
    })
    if (error) setErro(error.message)
    else void recarregar()
  }

  async function alterarItem(id: string, campos: Partial<CatalogoItem>) {
    const antes = itens
    setItens((is) => is.map((i) => (i.id === id ? { ...i, ...campos } : i)))
    const { error } = await supabase.from('catalogo_itens').update(campos).eq('id', id)
    if (error) { setItens(antes); setErro(error.message) }
  }

  async function apagarItem(i: CatalogoItem) {
    if (!confirm(`Apagar "${i.nome}"? Não tem como desfazer.`)) return
    const { error } = await supabase.from('catalogo_itens').delete().eq('id', i.id)
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
        <CardHeader>
          <CardTitle>Vigência e agendamento</CardTitle>
          <CardDescription>
            O texto de rodapé da tabela de preços e o link padrão de agendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="vigencia" className="text-xs">Vigência (ex.: agosto/2026)</Label>
            <Input
              id="vigencia"
              defaultValue={config?.vigencia ?? ''}
              maxLength={60}
              disabled={!config}
              onBlur={(e) => {
                if (config && e.target.value !== config.vigencia) salvarConfig({ vigencia: e.target.value })
              }}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="agendamento" className="text-xs">Link de agendamento padrão</Label>
            <Input
              id="agendamento"
              type="url"
              defaultValue={config?.agendamento ?? ''}
              maxLength={500}
              disabled={!config}
              onBlur={(e) => {
                if (config && e.target.value !== config.agendamento) salvarConfig({ agendamento: e.target.value })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b">
        {([
          ['categorias', 'Categorias'],
          ['procedimentos', 'Procedimentos'],
        ] as const).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setModulo(valor)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium',
              modulo === valor
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="py-10 text-center text-sm text-muted-foreground">carregando…</p>
      ) : modulo === 'categorias' ? (
        <Card>
          <CardHeader className="flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>
                Os cartões da grade do catálogo. A capa some pelo retângulo
                pastel enquanto “foto” estiver vazio.
              </CardDescription>
            </div>
            <Button size="sm" onClick={criarCategoria}>
              <Plus />
              Nova categoria
            </Button>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {!categorias.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground italic">
                Nenhuma categoria cadastrada ainda.
              </p>
            ) : (
              categorias.map((c) => (
                <div key={c.id} className="grid gap-4 rounded-md border p-4 md:grid-cols-[96px_1fr_auto]">
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-muted">
                    {urlPublica(c.foto_url) ? (
                      <img src={urlPublica(c.foto_url) ?? ''} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">sem foto</span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label className="text-xs">Título</Label>
                      <Input
                        defaultValue={c.titulo}
                        maxLength={120}
                        onBlur={(e) => { if (e.target.value !== c.titulo) alterarCategoria(c.id, { titulo: e.target.value }) }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Tom</Label>
                      <select
                        value={c.tom}
                        onChange={(e) => alterarCategoria(c.id, { tom: e.target.value as CatalogoCategoria['tom'] })}
                        className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                      >
                        {TONS_CATEGORIA.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">A partir de</Label>
                      <Input
                        defaultValue={c.preco_partir}
                        maxLength={40}
                        placeholder="R$ 45"
                        onBlur={(e) => { if (e.target.value !== c.preco_partir) alterarCategoria(c.id, { preco_partir: e.target.value }) }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Tempo</Label>
                      <Input
                        defaultValue={c.tempo}
                        maxLength={60}
                        placeholder="10 a 35 min"
                        onBlur={(e) => { if (e.target.value !== c.tempo) alterarCategoria(c.id, { tempo: e.target.value }) }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">URL da foto</Label>
                      <Input
                        defaultValue={c.foto_url ?? ''}
                        maxLength={500}
                        placeholder="cole a URL copiada em Imagens"
                        onBlur={(e) => { if (e.target.value !== (c.foto_url ?? '')) alterarCategoria(c.id, { foto_url: e.target.value || null }) }}
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Button variant="ghost" size="sm" onClick={() => apagarCategoria(c)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 />
                      Apagar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos</CardTitle>
            <CardDescription>
              Cada procedimento pertence a uma categoria. Crie a categoria
              primeiro na outra aba.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {!categorias.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground italic">
                Cadastre uma categoria antes de adicionar procedimentos.
              </p>
            ) : (
              categorias.map((c) => {
                const daCategoria = itens.filter((i) => i.categoria_id === c.id)
                return (
                  <div key={c.id} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{c.titulo}</h3>
                      <Button variant="outline" size="sm" onClick={() => criarItem(c.id)}>
                        <Plus />
                        Procedimento
                      </Button>
                    </div>

                    {!daCategoria.length ? (
                      <p className="py-4 text-center text-xs text-muted-foreground italic">
                        Nenhum procedimento nesta categoria.
                      </p>
                    ) : (
                      daCategoria.map((i) => (
                        <div key={i.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-[64px_1fr_120px_100px_auto]">
                          <div className="grid aspect-square place-items-center overflow-hidden rounded-md bg-muted">
                            {urlPublica(i.foto_url) ? (
                              <img src={urlPublica(i.foto_url) ?? ''} alt="" className="size-full object-cover" />
                            ) : (
                              <span className="font-mono text-[9px] text-muted-foreground">sem foto</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px]">Nome</Label>
                            <Input
                              defaultValue={i.nome}
                              maxLength={150}
                              className="h-9 text-sm"
                              onBlur={(e) => { if (e.target.value !== i.nome) alterarItem(i.id, { nome: e.target.value }) }}
                            />
                            <Label className="mt-1 text-[11px]">URL da foto</Label>
                            <Input
                              defaultValue={i.foto_url ?? ''}
                              maxLength={500}
                              placeholder="cole a URL copiada em Imagens"
                              className="h-9 text-sm"
                              onBlur={(e) => { if (e.target.value !== (i.foto_url ?? '')) alterarItem(i.id, { foto_url: e.target.value || null }) }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px]">Preço</Label>
                            <Input
                              defaultValue={i.preco}
                              maxLength={40}
                              placeholder="R$ 45"
                              className="h-9 text-sm"
                              onBlur={(e) => { if (e.target.value !== i.preco) alterarItem(i.id, { preco: e.target.value }) }}
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-[11px]">Duração</Label>
                            <Input
                              defaultValue={i.duracao}
                              maxLength={40}
                              placeholder="30 min"
                              className="h-9 text-sm"
                              onBlur={(e) => { if (e.target.value !== i.duracao) alterarItem(i.id, { duracao: e.target.value }) }}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button variant="ghost" size="sm" className="size-9 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => apagarItem(i)} title="Apagar">
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
