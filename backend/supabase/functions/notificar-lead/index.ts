// Edge Function: notificar-lead
//
// Disparada pelo gatilho public.leads_notificar (ver
// backend/notificar-lead.sql) toda vez que um novo contato é
// gravado pelo formulário do site. Manda um e-mail avisando a
// Carla, pelo Resend (resend.com).
//
// Segredos necessários (Project Settings › Edge Functions › Secrets):
//   RESEND_API_KEY   — chave da conta Resend
//   WEBHOOK_SECRET   — string aleatória própria sua, só para o
//                      gatilho do banco e esta function combinarem
//                      entre si; impede que qualquer um na internet
//                      chame esta function e gaste sua cota do Resend
//
// Ver backend/notificar-lead.sql para o texto exato do segundo
// segredo (é o mesmo valor nos dois lugares).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const WEBHOOK_SECRET = Deno.env.get('WEBHOOK_SECRET')
const PARA = 'carlamaquiagem1980@gmail.com'

Deno.serve(async (req: Request) => {
  if (req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return new Response('não autorizado', { status: 401 })
  }
  if (!RESEND_API_KEY) {
    return new Response('RESEND_API_KEY não configurada', { status: 500 })
  }

  const { record } = await req.json()

  const linhas = [
    `Nome: ${record.nome}`,
    `WhatsApp: ${record.telefone}`,
    record.email ? `E-mail: ${record.email}` : null,
    record.procedimento ? `Interesse: ${record.procedimento}` : null,
    record.mensagem ? `Mensagem: ${record.mensagem}` : null,
    `Origem: ${record.origem}`,
  ].filter(Boolean).join('\n')

  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Ateliê Carla · site <onboarding@resend.dev>',
      to: [PARA],
      subject: `Novo contato pelo site: ${record.nome}`,
      text: linhas,
    }),
  })

  if (!resposta.ok) {
    const erro = await resposta.text()
    console.error('[resend]', resposta.status, erro)
    return new Response('falha ao enviar', { status: 502 })
  }

  return new Response('ok', { status: 200 })
})
