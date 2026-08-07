# =============================================================
# Roda um arquivo .sql no banco do Supabase, pelo PowerShell
#
# Usa a API de gerenciamento do Supabase — uma chamada HTTP, sem
# psql, sem Docker, sem instalar nada.
#
# COMO USAR
#
#   1. Crie um token pessoal (uma vez só):
#      https://supabase.com/dashboard/account/tokens
#      Clique em "Generate new token", dê um nome e copie.
#
#   2. Coloque o token numa variável de ambiente da sessão:
#
#        $env:SUPABASE_PAT = "cole-o-token-aqui"
#
#      Isso vale só para esta janela do PowerShell e some quando
#      você fechar. O token NÃO é gravado em arquivo nenhum e não
#      entra no repositório.
#
#   3. Rode:
#
#        .\backend\rodar-sql.ps1 backend\corrigir-hero.sql
#
# ⚠️ O token pessoal dá acesso total à sua conta Supabase. Não
#    cole ele em chat, não commite, não mande por e-mail. Se
#    vazar, revogue na mesma página onde foi criado.
# =============================================================

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Arquivo,

  [string]$ProjetoRef = 'bnnhwefceiegsaklvtec'
)

$ErrorActionPreference = 'Stop'

# ---- confere o token -----------------------------------------

if (-not $env:SUPABASE_PAT) {
  Write-Host ''
  Write-Host 'Falta o token.' -ForegroundColor Red
  Write-Host ''
  Write-Host '  1. Gere em: https://supabase.com/dashboard/account/tokens'
  Write-Host '  2. Rode:    $env:SUPABASE_PAT = "seu-token"'
  Write-Host '  3. Tente de novo.'
  Write-Host ''
  exit 1
}

# ---- confere o arquivo ---------------------------------------

if (-not (Test-Path $Arquivo)) {
  Write-Host "Arquivo nao encontrado: $Arquivo" -ForegroundColor Red
  exit 1
}

$sql = Get-Content $Arquivo -Raw -Encoding UTF8

Write-Host ''
Write-Host "Arquivo:  $Arquivo" -ForegroundColor Cyan
Write-Host "Projeto:  $ProjetoRef" -ForegroundColor Cyan
Write-Host "Tamanho:  $($sql.Length) caracteres"
Write-Host ''

# ---- envia ----------------------------------------------------

$corpo = @{ query = $sql } | ConvertTo-Json -Depth 3 -Compress
$url = "https://api.supabase.com/v1/projects/$ProjetoRef/database/query"

try {
  $resposta = Invoke-RestMethod -Method Post -Uri $url `
    -Headers @{
      'Authorization' = "Bearer $env:SUPABASE_PAT"
      'Content-Type'  = 'application/json'
    } `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($corpo))

  Write-Host 'Executado com sucesso.' -ForegroundColor Green
  Write-Host ''

  if ($resposta) {
    $resposta | ConvertTo-Json -Depth 5
  } else {
    Write-Host '(sem linhas devolvidas)'
  }
}
catch {
  Write-Host 'Falhou.' -ForegroundColor Red
  Write-Host ''

  # a mensagem util do Supabase vem no corpo da resposta, nao no
  # texto da excecao — sem isto o erro fica so "400 Bad Request"
  if ($_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message
  } elseif ($_.Exception.Response) {
    $leitor = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    Write-Host $leitor.ReadToEnd()
  } else {
    Write-Host $_.Exception.Message
  }

  Write-Host ''
  Write-Host 'Causas comuns:'
  Write-Host '  401  token invalido ou expirado'
  Write-Host '  404  ref do projeto errado'
  Write-Host '  400  erro de SQL — a mensagem acima diz a linha'
  exit 1
}
