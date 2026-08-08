import { createClient } from '@supabase/supabase-js'

/* =========================================================
   Cliente Supabase do painel

   As chaves vêm de painel/.env (copie de .env.example). O Vite
   só expõe variáveis com prefixo VITE_ — as outras ficam fora
   do pacote final, o que é justamente o que queremos.

   A chave anon é pública por desenho. O que protege o banco são
   as políticas de RLS do backend/schema.sql, não o segredo da
   chave. Nunca use aqui a service_role.
   ========================================================= */

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL as string | undefined
const CHAVE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configurado =
  Boolean(URL_SUPABASE && CHAVE_ANON) &&
  !URL_SUPABASE!.includes('SEU-PROJETO') &&
  !CHAVE_ANON!.includes('COLE_AQUI')

/* Cliente sempre existe, para o app não quebrar no import.
   Sem configuração ele aponta para um host inválido e as
   chamadas falham — os componentes tratam isso mostrando o
   aviso de "backend não configurado". */
export const supabase = createClient(
  URL_SUPABASE || 'https://nao-configurado.supabase.co',
  CHAVE_ANON || 'chave-ausente',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

/* ---------------------------------------------------------
   Tipos das tabelas — espelham backend/schema.sql
   --------------------------------------------------------- */

export type StatusLead = 'novo' | 'contatado' | 'agendado' | 'atendido' | 'perdido'

export const STATUS_LEAD: StatusLead[] = [
  'novo',
  'contatado',
  'agendado',
  'atendido',
  'perdido',
]

export interface Lead {
  id: string
  nome: string
  telefone: string
  email: string | null
  procedimento: string | null
  mensagem: string | null
  origem: string
  status: StatusLead
  observacoes: string | null
  criado_em: string
  atualizado_em: string
}

export interface Hero {
  id: number
  selo: string
  titulo: string
  titulo_destaque: string
  subtitulo: string
  cta_texto: string
  cta_url: string
}

export interface Video {
  id: string
  titulo: string
  descricao: string | null
  url: string
  thumbnail_url: string | null
  ordem: number
  publicado: boolean
  criado_em: string
}

export interface Midia {
  id: string
  titulo: string
  imagem_url: string
  alt: string
  grupo: string
  largura: number | null
  altura: number | null
  ordem: number
  publicado: boolean
  criado_em: string
}

export interface Seo {
  id: number
  meta_title: string
  meta_description: string
  og_title: string | null
  og_description: string | null
  og_image_url: string
  canonical_url: string
}

export type TomCategoria = 'rosa' | 'lilas' | 'azul' | 'verde' | 'dourado'

export const TONS_CATEGORIA: TomCategoria[] = ['rosa', 'lilas', 'azul', 'verde', 'dourado']

export interface CatalogoConfig {
  id: number
  vigencia: string
  agendamento: string
}

export interface CatalogoCategoria {
  id: string
  titulo: string
  tom: TomCategoria
  preco_partir: string
  tempo: string
  foto_url: string | null
  etiqueta: string
  ordem: number
}

export interface CatalogoItem {
  id: string
  categoria_id: string
  nome: string
  preco: string
  duracao: string
  foto_url: string | null
  etiqueta: string
  ordem: number
}

/** URL pública de um arquivo do bucket de mídias */
export function urlPublica(caminho: string | null): string | null {
  if (!caminho) return null
  if (/^https?:\/\//.test(caminho)) return caminho
  if (!configurado) return null

  return `${URL_SUPABASE}/storage/v1/object/public/midias/${caminho}`
}
