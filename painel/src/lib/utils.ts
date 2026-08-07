import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes do Tailwind resolvendo conflitos.
 * É o helper que todo componente do shadcn importa.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "há 5 min", "há 2 h", ou a data — para a coluna de tempo dos contatos */
export function desdeQuando(iso: string): string {
  const d = new Date(iso)
  const min = Math.round((Date.now() - d.getTime()) / 60000)

  if (min < 1) return 'agora'
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.round(min / 60)} h`
  if (min < 10080) return `${Math.round(min / 1440)} d`

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/**
 * Link de conversa no WhatsApp.
 *
 * Usa a forma api.whatsapp.com/send/ — a mesma que o WhatsApp
 * Business gera. O wa.me é um encurtador que redireciona para cá;
 * os dois funcionam, mas manter uma forma só evita divergência
 * entre o site e o painel.
 *
 * @param telefone  como estiver: "(62) 3558-2655" ou "62912345678"
 * @param mensagem  texto já preenchido na conversa (opcional)
 */
export function linkWhatsApp(telefone: string, mensagem?: string): string {
  const numero = '55' + telefone.replace(/\D/g, '')
  const texto = mensagem ? encodeURIComponent(mensagem) : ''

  return `https://api.whatsapp.com/send/?phone=${numero}&text=${texto}&type=phone_number&app_absent=0`
}
