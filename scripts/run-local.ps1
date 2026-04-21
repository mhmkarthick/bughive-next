$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Stop-DevPort([int]$port) {
  $conns = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if (-not $conns) { return }

  foreach ($procId in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    if (-not $p) { continue }
    if ($p.CommandLine -notlike "*$root*") { continue } # don't kill unrelated apps
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Stopped $procId on :$port"
    } catch {
      Write-Warning "Failed stopping $procId on :$port: $($_.Exception.Message)"
    }
  }
}

Write-Host "Starting Mongo..."
docker compose up -d mongo | Out-Host

Write-Host "Freeing ports 3000/5000 (BugHive only)..."
Stop-DevPort 3000
Stop-DevPort 5000

Write-Host "Seeding DB..."
npm.cmd --prefix server run seed | Out-Host

Write-Host "Starting dev (client :3000, server :5000)..."
npm.cmd run dev
