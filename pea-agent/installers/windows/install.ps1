Param(
  [Parameter(Mandatory=$false)][string]$BinPath,
  [string]$Bus="http://localhost:3001",
  [int]$Hb=3600,
  [int]$Qd=30
)

if (-not $BinPath) {
  $debugPath = Join-Path (Split-Path -Parent $PSScriptRoot) "target\debug\pea-agent.exe"
  $releasePath = Join-Path (Split-Path -Parent $PSScriptRoot) "target\release\pea-agent.exe"
  if (Test-Path $releasePath) { $BinPath = $releasePath } elseif (Test-Path $debugPath) { $BinPath = $debugPath } else { Write-Error "Provide BinPath"; exit 1 }
}

if (-not (Test-Path $BinPath)) { Write-Error "Binary not found: $BinPath"; exit 1 }

$action = New-ScheduledTaskAction -Execute $BinPath -Argument "run --bus $Bus --hb $Hb --qd $Qd"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 0)
Register-ScheduledTask -TaskName "KMP-PEA-Agent" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Host "Scheduled task 'KMP-PEA-Agent' created to run at logon" 