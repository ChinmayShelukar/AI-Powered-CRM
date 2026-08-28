# Seeds CortexCRM with realistic demo contacts + deals across all stages.
# Idempotent-ish: skips if existing data is already plentiful.

param(
  [string]$ApiBase = "http://localhost:8080",
  [string]$AdminEmail = "admin@cortex.com",
  [string]$AdminPassword = "password123"
)

$ErrorActionPreference = "Stop"

function Invoke-Json {
  param([string]$Method, [string]$Url, $Body, [string]$Token)
  $headers = @{ "Content-Type" = "application/json" }
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $json = if ($Body) { $Body | ConvertTo-Json -Depth 6 -Compress } else { $null }
  return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $json
}

Write-Host "Logging in as $AdminEmail..." -ForegroundColor Cyan
$auth = Invoke-Json -Method Post -Url "$ApiBase/api/auth/login" -Body @{ email = $AdminEmail; password = $AdminPassword }
$token = $auth.token
Write-Host "  ok, role=$($auth.role) userId=$($auth.userId)" -ForegroundColor Green

# --- Users (for owner variety) ---
$ownerIds = @($auth.userId)
try {
  $users = Invoke-Json -Method Get -Url "$ApiBase/api/users" -Token $token
  $ownerIds = @($users | ForEach-Object { $_.id })
} catch {
  Write-Host "  /api/users not reachable, using only current admin as owner." -ForegroundColor DarkYellow
}
Write-Host "Found $($ownerIds.Count) user(s) for owner rotation."

# --- Contacts ---
$existingContacts = Invoke-Json -Method Get -Url "$ApiBase/api/contacts" -Token $token
$contactsByName = @{}
foreach ($c in $existingContacts) { $contactsByName[$c.name] = $c }

$desiredContacts = @(
  @{ name = "Avery Chen";       company = "Northwind Systems";   email = "avery@northwind.io";    phone = "+1 415 555 0142"; status = "QUALIFIED" },
  @{ name = "Priya Raman";      company = "Helix Robotics";      email = "priya@helix.ai";        phone = "+1 408 555 0118"; status = "CONTACTED" },
  @{ name = "Marcus Hale";      company = "Brightline Logistics"; email = "marcus@brightline.co"; phone = "+1 312 555 0177"; status = "QUALIFIED" },
  @{ name = "Sofia Alvarez";    company = "Kestrel Analytics";   email = "sofia@kestrel.dev";     phone = "+1 646 555 0199"; status = "NEW" },
  @{ name = "Daniel Okafor";    company = "Lumen Ventures";      email = "daniel@lumenvc.com";    phone = "+1 212 555 0166"; status = "CUSTOMER" },
  @{ name = "Hana Yoshida";     company = "Quill Data";          email = "hana@quill.dev";        phone = "+1 503 555 0181"; status = "CONTACTED" },
  @{ name = "Theo Lindqvist";   company = "Cobalt Foundry";      email = "theo@cobalt.studio";    phone = "+44 20 7946 0921"; status = "QUALIFIED" },
  @{ name = "Renata Costa";     company = "Polaris Health";      email = "renata@polaris.health"; phone = "+1 617 555 0134"; status = "NEW" }
)

foreach ($c in $desiredContacts) {
  if (-not $contactsByName.ContainsKey($c.name)) {
    Write-Host "Creating contact: $($c.name) ($($c.company))" -ForegroundColor Yellow
    $created = Invoke-Json -Method Post -Url "$ApiBase/api/contacts" -Token $token -Body $c
    $contactsByName[$created.name] = $created
  }
}

# --- Deals ---
$existingDeals = Invoke-Json -Method Get -Url "$ApiBase/api/deals" -Token $token
$skipDeals = $existingDeals.Count -ge 22
if ($skipDeals) {
  Write-Host "Found $($existingDeals.Count) existing deals - skipping deal seed." -ForegroundColor DarkGray
}

function Days([int]$n) { return (Get-Date).AddDays($n).ToString("yyyy-MM-dd") }

$desiredDeals = @(
  # PROSPECT
  @{ title = "Northwind - pilot evaluation";         contact = "Avery Chen";    value = 18000;  stage = "PROSPECT";   close = Days 45 },
  @{ title = "Cobalt Foundry - Q3 expansion";        contact = "Theo Lindqvist"; value = 32000;  stage = "PROSPECT";  close = Days 60 },
  @{ title = "Polaris Health - discovery call";      contact = "Renata Costa";  value = 12500;  stage = "PROSPECT";   close = Days 30 },

  # QUALIFIED
  @{ title = "Helix Robotics - annual platform";     contact = "Priya Raman";   value = 64000;  stage = "QUALIFIED";  close = Days 22 },
  @{ title = "Brightline - fleet rollout phase 1";   contact = "Marcus Hale";   value = 88500;  stage = "QUALIFIED";  close = Days 18 },
  @{ title = "Quill Data - analytics seats";         contact = "Hana Yoshida";  value = 24000;  stage = "QUALIFIED";  close = Days 26 },

  # PROPOSAL
  @{ title = "Kestrel Analytics - enterprise tier";  contact = "Sofia Alvarez"; value = 156000; stage = "PROPOSAL";   close = Days 12 },
  @{ title = "Cobalt Foundry - design partnership";  contact = "Theo Lindqvist"; value = 47500; stage = "PROPOSAL";   close = Days 9 },
  @{ title = "Quill Data - data warehouse add-on";   contact = "Hana Yoshida";  value = 38000;  stage = "PROPOSAL";   close = Days 14 },

  # NEGOTIATION
  @{ title = "Lumen Ventures - multi-year deal";     contact = "Daniel Okafor"; value = 240000; stage = "NEGOTIATION"; close = Days 6 },
  @{ title = "Helix Robotics - premium support";     contact = "Priya Raman";   value = 52000;  stage = "NEGOTIATION"; close = Days 4 },
  @{ title = "Brightline - phase 2 expansion";       contact = "Marcus Hale";   value = 110000; stage = "NEGOTIATION"; close = Days 11 },
  @{ title = "Polaris Health - clinical pilot";      contact = "Renata Costa";  value = 28000;  stage = "NEGOTIATION"; close = Days -3 }, # overdue

  # WON — spread across 6 months for a clean revenue chart
  @{ title = "Helix Robotics - pilot win";           contact = "Priya Raman";   value = 34000;  stage = "WON";        close = Days -150 }, # Dec
  @{ title = "Brightline - logistics contract";      contact = "Marcus Hale";   value = 51000;  stage = "WON";        close = Days -120 }, # Jan
  @{ title = "Kestrel Analytics - growth tier";      contact = "Sofia Alvarez"; value = 78000;  stage = "WON";        close = Days -90  }, # Feb
  @{ title = "Cobalt Foundry - studio license";      contact = "Theo Lindqvist"; value = 94000; stage = "WON";        close = Days -60  }, # Mar
  @{ title = "Polaris Health - data contract";       contact = "Renata Costa";  value = 11000;  stage = "WON";        close = Days -35  }, # Apr (early)
  @{ title = "Lumen Ventures - initial contract";    contact = "Daniel Okafor"; value = 95000;  stage = "WON";        close = Days -14  }, # Apr
  @{ title = "Northwind - starter package";          contact = "Avery Chen";    value = 12000;  stage = "WON";        close = Days -22  }, # Apr
  @{ title = "Quill Data - platform upgrade";        contact = "Hana Yoshida";  value = 46500;  stage = "WON";        close = Days -3   }, # May
  @{ title = "Quill Data - onboarding services";     contact = "Hana Yoshida";  value = 18500;  stage = "WON";        close = Days -7   }, # May

  # LOST
  @{ title = "Kestrel Analytics - competitor switch"; contact = "Sofia Alvarez"; value = 42000; stage = "LOST";       close = Days -19 },
  @{ title = "Cobalt Foundry - budget freeze";       contact = "Theo Lindqvist"; value = 36000; stage = "LOST";       close = Days -30 }
)

$ownerIdx = 0
if (-not $skipDeals) {
foreach ($d in $desiredDeals) {
  $contact = $contactsByName[$d.contact]
  if (-not $contact) {
    Write-Host "Skipping deal '$($d.title)' - contact not found." -ForegroundColor DarkYellow
    continue
  }
  $assigned = $ownerIds[$ownerIdx % $ownerIds.Count]
  $ownerIdx++

  $body = @{
    title              = $d.title
    value              = $d.value
    stage              = $d.stage
    closeDate          = $d.close
    contactId          = $contact.id
    assignedToUserId   = $assigned
  }
  Write-Host "Creating deal [$($d.stage)] $($d.title)" -ForegroundColor Yellow
  try {
    Invoke-Json -Method Post -Url "$ApiBase/api/deals" -Token $token -Body $body | Out-Null
  } catch {
    Write-Host "  failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}
}

# --- Activities ---
$existingActivities = @()
try {
  $existingActivities = Invoke-Json -Method Get -Url "$ApiBase/api/activities" -Token $token
} catch { }

if ($existingActivities.Count -ge 12) {
  Write-Host "`nFound $($existingActivities.Count) existing activities - skipping activity seed." -ForegroundColor DarkGray
  Write-Host "Seed complete." -ForegroundColor Green
  return
}

$allDeals = Invoke-Json -Method Get -Url "$ApiBase/api/deals" -Token $token
$allContacts = Invoke-Json -Method Get -Url "$ApiBase/api/contacts" -Token $token
$contactByName = @{}
foreach ($c in $allContacts) { $contactByName[$c.name] = $c }
$dealByTitle = @{}
foreach ($d in $allDeals) { $dealByTitle[$d.title] = $d }

function HoursAgo([int]$h) { return (Get-Date).ToUniversalTime().AddHours(-1 * $h).ToString("o") }

$desiredActivities = @(
  @{ type = "CALL";    contact = "Daniel Okafor";  deal = "Lumen Ventures - multi-year deal";    hours = 2;   notes = "Discussed multi-year structure. Daniel wants quarterly business reviews and a 90-day exit clause. Sending revised contract by Friday." },
  @{ type = "EMAIL";   contact = "Sofia Alvarez";  deal = "Kestrel Analytics - enterprise tier"; hours = 5;   notes = "Sent updated proposal with the enterprise SSO add-on and revised seat counts. Awaiting procurement sign-off." },
  @{ type = "MEETING"; contact = "Priya Raman";    deal = "Helix Robotics - annual platform";    hours = 8;   notes = "On-site kickoff at the Mountain View office. Walked through implementation timeline and integration touchpoints." },
  @{ type = "NOTE";    contact = "Renata Costa";   deal = "Polaris Health - clinical pilot";     hours = 26;  notes = "Polaris legal flagged HIPAA BAA scope. Looping in our compliance team before next call." },
  @{ type = "CALL";    contact = "Marcus Hale";    deal = "Brightline - phase 2 expansion";      hours = 30;  notes = "Marcus confirmed phase 1 is on track. Phase 2 budget approved for Q3." },
  @{ type = "EMAIL";   contact = "Hana Yoshida";   deal = "Quill Data - data warehouse add-on";  hours = 50;  notes = "Sent comparison vs Snowflake. Hana's team will review internally this week." },
  @{ type = "MEETING"; contact = "Theo Lindqvist"; deal = "Cobalt Foundry - design partnership"; hours = 54;  notes = "Design review with Theo and his lead architect. Solid alignment on the partnership terms." },
  @{ type = "CALL";    contact = "Avery Chen";     deal = "Northwind - pilot evaluation";        hours = 78;  notes = "Pilot scoping call. Avery wants to start with a 30-seat trial across the analytics team." },
  @{ type = "NOTE";    contact = "Daniel Okafor";  deal = "Lumen Ventures - initial contract";   hours = 96;  notes = "Contract countersigned. Kicked off implementation handover to onboarding." },
  @{ type = "EMAIL";   contact = "Priya Raman";    deal = "Helix Robotics - premium support";    hours = 120; notes = "Forwarded SOC 2 report and infosec questionnaire responses. Ball is in their court." },
  @{ type = "MEETING"; contact = "Sofia Alvarez";  deal = "Kestrel Analytics - competitor switch"; hours = 168; notes = "Lost to Looker. Sofia cited tighter integration with their existing BI stack. Requested re-eval in 6 months." },
  @{ type = "CALL";    contact = "Marcus Hale";    deal = "Brightline - fleet rollout phase 1";  hours = 200; notes = "Quarterly check-in. Adoption is healthy across the dispatch team." }
)

foreach ($a in $desiredActivities) {
  $contact = $contactByName[$a.contact]
  $deal = $dealByTitle[$a.deal]
  if (-not $contact) { Write-Host "Skipping activity, contact missing: $($a.contact)" -ForegroundColor DarkYellow; continue }

  $body = @{
    type         = $a.type
    notes        = $a.notes
    activityDate = (HoursAgo $a.hours)
    contactId    = $contact.id
  }
  if ($deal) { $body["dealId"] = $deal.id }

  Write-Host "Creating activity [$($a.type)] $($a.contact) - $($a.deal)" -ForegroundColor Yellow
  try {
    Invoke-Json -Method Post -Url "$ApiBase/api/activities" -Token $token -Body $body | Out-Null
  } catch {
    Write-Host "  failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host "`nSeed complete." -ForegroundColor Green
