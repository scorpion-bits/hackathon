# AgroBits - sobe tudo com Docker (Windows / PowerShell).
#
#   .\iniciar.ps1              sobe API + interface e abre o navegador
#   .\iniciar.ps1 atualizar    git pull + sobe
#   .\iniciar.ps1 resetar      recria a propriedade de demonstracao e sobe
#   .\iniciar.ps1 sincronizar  confere o portal do MAPA (baixa so o que mudou) e sobe
#   .\iniciar.ps1 logs         mostra os logs ao vivo (Ctrl+C sai dos logs, nao derruba)
#   .\iniciar.ps1 parar        derruba tudo
# Ou de dois cliques em iniciar.bat.
param([string]$acao = "subir")
$ErrorActionPreference = "Continue"  # erros de comandos externos tratados via $LASTEXITCODE
Set-Location -Path $PSScriptRoot

function Say($m)  { Write-Host "> $m" -ForegroundColor Green }
function Fail($m) { Write-Host "X $m" -ForegroundColor Red; exit 1 }

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Fail "Docker nao encontrado. Instale o Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/" }
docker compose version *> $null
if ($LASTEXITCODE -ne 0) { Fail "Docker Compose nao encontrado (atualize o Docker Desktop)." }
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail "O Docker Desktop nao esta aberto. Abra o Docker Desktop, espere ficar verde e tente de novo." }

# chave dedicada a avaliacao (ver README): vira o .env se ainda nao existe um
if (-not (Test-Path .env) -and (Test-Path .env.avaliacao)) { Copy-Item .env.avaliacao .env }
$env:RESET = "0"; $env:SYNC = "0"
# No Windows a recarga automatica ao salvar arquivos precisa de polling
$env:POLLING = "true"

switch ($acao.ToLower()) {
  { $_ -in "parar", "stop" } { docker compose down; Say "Tudo parado."; exit 0 }
  "logs" { docker compose logs -f --tail 50; exit 0 }
  { $_ -in "atualizar", "update" } {
    Say "Atualizando o codigo (git pull)"
    git pull --no-rebase
    if ($LASTEXITCODE -ne 0) { Fail "git pull falhou - veja a mensagem acima (alteracoes locais? rode: git stash -u)" }
  }
  { $_ -in "resetar", "reset" } { $env:RESET = "1" }
  { $_ -in "sincronizar", "sync" } { $env:SYNC = "1" }
  { $_ -in "subir", "up", "" } { }
  { $_ -in "ajuda", "-h", "--help" } { Get-Content $PSCommandPath -TotalCount 9; exit 0 }
  default { Fail "Opcao desconhecida: $acao (use: .\iniciar.ps1 ajuda)" }
}

Say "Preparando os containers (a 1a vez demora alguns minutos; depois e rapido)"
docker compose build
if ($LASTEXITCODE -ne 0) { Fail "Falha ao preparar os containers - veja a mensagem acima." }
Say "Subindo API e interface"
docker compose up -d --force-recreate --no-build
if ($LASTEXITCODE -ne 0) { Fail "Falha ao subir - veja a mensagem acima." }

Write-Host "  aguardando" -NoNewline
$ok = $false
for ($i = 0; $i -lt 180; $i++) {
  try {
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop http://localhost:8000/api/farm | Out-Null
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop http://localhost:5173/ | Out-Null
    $ok = $true; break
  } catch { Write-Host "." -NoNewline; Start-Sleep -Seconds 2 }
}
Write-Host ""
if (-not $ok) { docker compose logs --tail 30; Fail "Nao respondeu em 6 minutos - veja os logs acima (.\iniciar.ps1 logs)." }

$iaKey = $null; $iaModel = $null
if (Test-Path .env) {
  foreach ($l in Get-Content .env) {
    if ($l -match '^(AGROBITS|AGROIA)_LLM_API_KEY=(.+)$') { $iaKey = $Matches[2] }
    if ($l -match '^(AGROBITS|AGROIA)_LLM_MODEL=(.+)$') { $iaModel = $Matches[2] }
  }
}
$url = "http://localhost:5173"
Say "Pronto!"
Write-Host "   AgroBits:   $url"
if ($iaKey -and $iaModel) { Write-Host "   IA: ligada ($iaModel)" } else { Write-Host "   IA: modo offline (sem chave) - veja docs/implementacao/M5-ia.md" }
Write-Host "   API (docs): http://localhost:8000/docs"
Write-Host "   Parar:      .\iniciar.ps1 parar   -   Logs: .\iniciar.ps1 logs"
Start-Process $url
