$ErrorActionPreference = "Stop"

$mongoUri = [Environment]::GetEnvironmentVariable("MONGODB_URI", "User")
$jwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")

if ([string]::IsNullOrWhiteSpace($mongoUri)) {
  throw "MONGODB_URI is not set in User environment variables."
}
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
  throw "JWT_SECRET is not set in User environment variables."
}

$env:MONGODB_URI = $mongoUri
$env:JWT_SECRET = $jwtSecret

Write-Host "Loaded MONGODB_URI and JWT_SECRET from User environment variables." -ForegroundColor Green

# Atlas host fallback map (used when local DNS is unstable on hotspot/router DNS).
$atlasHostDefaults = [ordered]@{
  "ac-pxbrdzo-shard-00-00.zbci1vn.mongodb.net" = "159.143.51.11"
  "ac-pxbrdzo-shard-00-01.zbci1vn.mongodb.net" = "159.143.51.47"
  "ac-pxbrdzo-shard-00-02.zbci1vn.mongodb.net" = "159.143.51.30"
  "mtm-aws-aps1-6-m0-2-shard-00-00.a8cnc.mongodb.net" = "159.143.51.11"
  "mtm-aws-aps1-6-m0-2-shard-00-01.a8cnc.mongodb.net" = "159.143.51.47"
  "mtm-aws-aps1-6-m0-2-shard-00-02.a8cnc.mongodb.net" = "159.143.51.30"
}

$hostLines = @()
foreach ($atlasHost in $atlasHostDefaults.Keys) {
  $ipv4 = $null

  try {
    $ipv4 = ([System.Net.Dns]::GetHostAddresses($atlasHost) |
      Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork } |
      Select-Object -First 1).IPAddressToString
  } catch {
    $ipv4 = $null
  }

  if (-not $ipv4) {
    try {
      $ipv4 = (Resolve-DnsName -Name $atlasHost -Type A -Server 8.8.8.8 -ErrorAction Stop |
        Select-Object -First 1).IPAddress
    } catch {
      $ipv4 = $null
    }
  }

  if (-not $ipv4) {
    $ipv4 = $atlasHostDefaults[$atlasHost]
  }

  $hostLines += "$ipv4 $atlasHost"
}

$hostsFile = Join-Path $env:TEMP "campus-atlas-hosts.txt"
$hostLines | Set-Content -Path $hostsFile

$hostArg = "-Djdk.net.hosts.file=$hostsFile"
if ([string]::IsNullOrWhiteSpace($env:JAVA_TOOL_OPTIONS)) {
  $env:JAVA_TOOL_OPTIONS = $hostArg
} elseif ($env:JAVA_TOOL_OPTIONS -notmatch "jdk\.net\.hosts\.file=") {
  $env:JAVA_TOOL_OPTIONS = "$($env:JAVA_TOOL_OPTIONS) $hostArg"
}

Write-Host "Using Java hosts override: $hostsFile" -ForegroundColor Yellow

$port = if ($env:SERVER_PORT) { [int]$env:SERVER_PORT } else { 8080 }
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1

if ($listener) {
  $ownerPid = $listener.OwningProcess
  $proc = Get-Process -Id $ownerPid -ErrorAction SilentlyContinue

  if ($proc -and $proc.ProcessName -eq "java") {
    Write-Host "Port $port is already used by java (PID $ownerPid). Stopping old Java process..." -ForegroundColor Yellow
    Stop-Process -Id $ownerPid -Force
    Start-Sleep -Seconds 1
  } else {
    throw "Port $port is already in use by process ID $ownerPid. Free this port, then run again."
  }
}

Write-Host "Starting backend on http://localhost:$port ..." -ForegroundColor Green
mvn spring-boot:run
