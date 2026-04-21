$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent $PSScriptRoot

function Stop-DevPort([int]$port) {
  $conns = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
  if (-not $conns) { return }

  foreach ($procId in ($conns | Select-Object -ExpandProperty OwningProcess -Unique)) {
    $p = Get-CimInstance Win32_Process -Filter "ProcessId=$procId" -ErrorAction SilentlyContinue
    if (-not $p) { continue }
    if ($p.CommandLine -notlike "*$root*") { continue }
    Stop-Process -Id $procId -Force
    Write-Host "Stopped $procId on :$port"
  }
}

Stop-DevPort 3000
Stop-DevPort 5000

