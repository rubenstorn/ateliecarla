import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Sparkles, Video, Image as ImageIcon,
  Search, LogOut, Menu, X, ExternalLink, Tags,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { URL_SITE } from '@/lib/urls'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

/* =========================================================
   Estrutura do painel, na linguagem do CoreUI

   Medidas tiradas do demo do CoreUI rodando: sidebar de 256px,
   header no topo, cards com raio de 6px. As cores são as da
   marca, não as do template.
   ========================================================= */

interface ItemNav {
  para: string
  rotulo: string
  Icone: React.ComponentType<{ className?: string }>
  contador?: number
}

export interface ShellProps {
  children: React.ReactNode
  email: string
  novosLeads: number
  onSair: () => void
}

export function Shell({ children, email, novosLeads, onSair }: ShellProps) {
  const [aberta, setAberta] = React.useState(false)
  const local = useLocation()

  /* fecha a gaveta ao trocar de página no celular */
  React.useEffect(() => setAberta(false), [local.pathname])

  const itens: ItemNav[] = [
    { para: '/', rotulo: 'Visão geral', Icone: LayoutDashboard },
    { para: '/contatos', rotulo: 'Contatos', Icone: Users, contador: novosLeads },
    { para: '/abertura', rotulo: 'Abertura', Icone: Sparkles },
    { para: '/videos', rotulo: 'Vídeos', Icone: Video },
    { para: '/catalogo', rotulo: 'Catálogo', Icone: Tags },
    { para: '/imagens', rotulo: 'Imagens', Icone: ImageIcon },
    { para: '/seo', rotulo: 'Busca e SEO', Icone: Search },
  ]

  const titulo = itens.find((i) => i.para === local.pathname)?.rotulo ?? 'Painel'

  return (
    <div className="min-h-svh bg-background">
      {/* ---------------- SIDEBAR ---------------- */}
      {/* w-40 = 160px, a largura da barra do WordPress.

          A gaveta usa -translate-x-40 (pixels exatos), NÃO
          -translate-x-full (porcentagem): interpolar de -100% para
          0px mistura unidades e a transição fica travada no valor
          inicial — a barra nunca aparecia no celular. Como a largura
          é fixa, -40 (10rem) é exatamente o mesmo deslocamento. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-40 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300',
          aberta ? 'translate-x-0' : '-translate-x-40 lg:translate-x-0',
        )}
      >
        <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-3">
          <img
            src="/logo-atelie-carla.svg"
            alt="Ateliê Carla Denise"
            className="h-6 w-auto brightness-0 invert"
          />
        </div>

        {/* sem espaçamento entre itens e sem cantos: no WordPress a
            navegação é uma lista contínua, e o item ativo é um bloco
            sólido que encosta nas duas bordas */}
        <nav className="flex-1 overflow-y-auto py-1">
          <ul className="flex flex-col">
            {itens.map(({ para, rotulo, Icone, contador }) => (
              <li key={para}>
                <NavLink
                  to={para}
                  end={para === '/'}
                  /* sem transition-colors aqui de propósito.

                     Duas razões. A prática: transicionar de
                     "transparent" para uma cor oklch vinda de
                     variável trava no valor inicial — o item
                     clicado continuava parecendo não selecionado até
                     algo forçar um repaint. A de projeto: seleção de
                     menu deve responder na hora; o próprio WordPress
                     não anima isso. */
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2.5 text-[13px] leading-tight',
                      isActive
                        ? 'bg-sidebar-accent font-semibold text-white'
                        : 'text-sidebar-muted hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  <Icone className="size-4 shrink-0" />
                  <span className="flex-1">{rotulo}</span>
                  {Boolean(contador) && (
                    <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {contador}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border">
          <a
            href={URL_SITE}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-sidebar-muted transition-colors hover:bg-white/8 hover:text-white"
          >
            <ExternalLink className="size-4 shrink-0" />
            Ver o site
          </a>
        </div>
      </aside>

      {/* véu do celular */}
      {aberta && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setAberta(false)}
          aria-hidden
        />
      )}

      {/* ---------------- CONTEÚDO ---------------- */}
      <div className="lg:pl-40">
        {/* barra superior fina e escura, como a admin bar do WordPress */}
        <header className="sticky top-0 z-20 flex h-8 items-center gap-3 bg-sidebar px-3 text-sidebar-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setAberta((v) => !v)}
            aria-label={aberta ? 'Fechar menu' : 'Abrir menu'}
          >
            {aberta ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>

          <span className="flex-1 truncate text-[12px] text-sidebar-muted">
            Ateliê Carla Denise
          </span>

          <span className="hidden truncate text-[12px] text-sidebar-muted sm:inline">
            {email}
          </span>
          <Avatar className="size-5">
            <AvatarImage src="/carla-retrato.png" alt="" />
            <AvatarFallback className="bg-primary text-[9px] text-primary-foreground">
              {email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-sidebar-muted hover:bg-white/10 hover:text-white"
            onClick={onSair}
            aria-label="Sair"
          >
            <LogOut className="size-3.5" />
          </Button>
        </header>

        {/* título grande da página, fora de card — o "wrap" do WordPress */}
        <main className="px-5 py-4 lg:px-8">
          <h1 className="mb-4 text-[23px] leading-tight font-normal">{titulo}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------
   Widget de métrica — a faixa de quatro cartões coloridos que
   abre o dashboard do CoreUI, nas cores da marca
   --------------------------------------------------------- */

export interface MetricaProps {
  valor: string | number
  rotulo: string
  detalhe?: string
  tom: 1 | 2 | 3 | 4
  Icone?: React.ComponentType<{ className?: string }>
}

const TONS: Record<MetricaProps['tom'], string> = {
  1: 'bg-metrica-1',
  2: 'bg-metrica-2',
  3: 'bg-metrica-3',
  4: 'bg-metrica-4',
}

export function Metrica({ valor, rotulo, detalhe, tom, Icone }: MetricaProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md p-5 text-primary-foreground',
        TONS[tom],
      )}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="tabular text-3xl leading-none font-semibold">{valor}</div>
          <div className="mt-2 text-sm opacity-90">{rotulo}</div>
          {detalhe && <div className="mt-1 text-xs opacity-70">{detalhe}</div>}
        </div>
        {Icone && <Icone className="size-5 shrink-0 opacity-60" />}
      </div>
    </div>
  )
}
