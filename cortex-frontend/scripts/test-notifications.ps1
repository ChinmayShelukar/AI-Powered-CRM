# End-to-end smoke test for /api/users + SSE notifications.
# - Verifies UserController fix
# - Reassigns a deal to rep, listens to SSE as rep, triggers a stage change as admin,
#   confirms the event was streamed.

param(
  [string]$ApiBase = "http://localhost:8080",
  [string]$AdminEmail = "admin@cortex.com",
  [string]$AdminPassword = "password123",
  [string]$RepEmail = "rep@cortex.com",
  [string]$RepPassword = "password123"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param([string]$Method, [string]$Url, $Body, [string]$Token)
  $headers = @{ "Content-Type" = "application/json" }
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $json = if ($Body) { $Body | ConvertTo-Json -Depth 6 -Compress } else { $null }
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $json
}

Write-Host "=== Test 1: /api/users ===" -ForegroundColor Cyan
$admin = Invoke-Json -Method Post -Url "$ApiBase/api/auth/login" -Body @{ email = $AdminEmail; password = $AdminPassword }
Write-Host "  admin login OK (userId=$($admin.userId))" -ForegroundColor Green

try {
  $users = Invoke-Json -Method Get -Url "$ApiBase/api/users" -Token $admin.token
  Write-Host "  /api/users -> 200, returned $($users.Count) users" -ForegroundColor Green
  $users | ForEach-Object { Write-Host "    - id=$($_.id) $($_.email) [$($_.role)]" -ForegroundColor DarkGray }
} catch {
  Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "  (Did you restart the backend after the UserController was added?)" -ForegroundColor Yellow
  exit 1
}

$rep = $users | Where-Object { $_.email -eq $RepEmail } | Select-Object -First 1
if (-not $rep) {
  Write-Host "  Rep user '$RepEmail' not found in /api/users response. Skipping SSE test." -ForegroundColor Yellow
  exit 0
}
Write-Host "  rep found: id=$($rep.id)" -ForegroundColor Green

Write-Host "`n=== Test 2: SSE notification flow ===" -ForegroundColor Cyan
$repAuth = Invoke-Json -Method Post -Url "$ApiBase/api/auth/login" -Body @{ email = $RepEmail; password = $RepPassword }
Write-Host "  rep login OK" -ForegroundColor Green

# Pick a deal we can reassign + flip the stage on.
$allDeals = Invoke-Json -Method Get -Url "$ApiBase/api/deals" -Token $admin.token
$target = $allDeals | Where-Object { $_.stage -ne "WON" -and $_.stage -ne "LOST" } | Select-Object -First 1
if (-not $target) {
  Write-Host "  No open deals available. Run seed-demo.ps1 first." -ForegroundColor Yellow
  exit 1
}
$origStage = $target.stage
$origAssignee = $target.assignedToUserId
$newStage = if ($origStage -eq "PROSPECT") { "QUALIFIED" } else { "PROSPECT" }
Write-Host "  test deal: id=$($target.id) '$($target.title)'" -ForegroundColor Yellow
Write-Host "    current stage=$origStage, will flip to $newStage" -ForegroundColor DarkGray

# Reassign the deal to rep so the notification recipient is rep, not admin.
$reassignBody = @{
  title              = $target.title
  value              = $target.value
  stage              = $target.stage
  closeDate          = $target.closeDate
  contactId          = $target.contactId
  assignedToUserId   = $rep.id
}
Invoke-Json -Method Put -Url "$ApiBase/api/deals/$($target.id)" -Token $admin.token -Body $reassignBody | Out-Null
Write-Host "  reassigned deal to rep (id=$($rep.id))" -ForegroundColor Green

# Spawn curl as a background process to consume the SSE stream as rep.
$logFile = Join-Path $env:TEMP "cortexcrm-sse-$($PID).log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }
$streamUrl = "$ApiBase/api/notifications/stream?token=$($repAuth.token)"
Write-Host "  opening SSE listener as rep..." -ForegroundColor Yellow
$curl = Start-Process -FilePath "curl.exe" `
  -ArgumentList @("-N", "-s", "-H", "Accept: text/event-stream", $streamUrl) `
  -RedirectStandardOutput $logFile `
  -PassThru -WindowStyle Hidden

# Wait until curl has actually printed "event:connected" — that proves the rep
# emitter is registered server-side, otherwise the stage change can fire before
# the emitter exists and the registry silently drops the event.
$connected = $false
for ($i = 0; $i -lt 50; $i++) {
  Start-Sleep -Milliseconds 100
  if (Test-Path $logFile) {
    $tmp = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
    if ($tmp -match "event:\s*connected") { $connected = $true; break }
  }
}
if (-not $connected) {
  Write-Host "  WARN: never saw 'event:connected'; proceeding anyway" -ForegroundColor Yellow
} else {
  Write-Host "  rep emitter confirmed connected" -ForegroundColor Green
}

# Trigger stage change as admin.
Write-Host "  admin triggers stage change ($origStage -> $newStage)..." -ForegroundColor Yellow
Invoke-Json -Method Put -Url "$ApiBase/api/deals/$($target.id)/stage" -Token $admin.token -Body @{ stage = $newStage } | Out-Null

# Poll for the event to land in the log (up to 5s).
$received = $false
for ($i = 0; $i -lt 50; $i++) {
  Start-Sleep -Milliseconds 100
  $tmp = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
  if ($tmp -match "event:\s*deal\.stage\.changed") { $received = $true; break }
}

# Stop the SSE consumer.
try { Stop-Process -Id $curl.Id -Force -ErrorAction SilentlyContinue } catch { }
Start-Sleep -Milliseconds 200

# Restore the deal to its original stage and original owner.
$restoreBody = @{
  title              = $target.title
  value              = $target.value
  stage              = $origStage
  closeDate          = $target.closeDate
  contactId          = $target.contactId
  assignedToUserId   = $origAssignee
}
Invoke-Json -Method Put -Url "$ApiBase/api/deals/$($target.id)" -Token $admin.token -Body $restoreBody | Out-Null
Write-Host "  restored deal to $origStage (assignee=$origAssignee)" -ForegroundColor DarkGray

# Inspect what the listener captured.
if (-not (Test-Path $logFile)) {
  Write-Host "`n  FAIL: SSE log was never created (curl couldn't connect?)" -ForegroundColor Red
  exit 1
}
$captured = Get-Content $logFile -Raw
Write-Host "`n  --- captured stream (truncated) ---" -ForegroundColor DarkGray
Write-Host ($captured.Substring(0, [Math]::Min(800, $captured.Length))) -ForegroundColor DarkGray
Write-Host "  ---" -ForegroundColor DarkGray

if ($captured -match "event:\s*deal\.stage\.changed" -and $captured -match "$($target.id)" -and $captured -match $newStage) {
  Write-Host "`n  PASS: deal.stage.changed event delivered to rep with correct payload" -ForegroundColor Green
  Remove-Item $logFile -Force
  exit 0
} else {
  Write-Host "`n  FAIL: expected 'event: deal.stage.changed' carrying dealId=$($target.id) and toStage=$newStage" -ForegroundColor Red
  Write-Host "  Log preserved at: $logFile" -ForegroundColor Yellow
  exit 1
}
