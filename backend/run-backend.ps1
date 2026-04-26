$ErrorActionPreference = "Stop"

function Import-DotEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string] $Path
  )

  if (-not (Test-Path -Path $Path)) {
    return
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1).Trim().Trim("'").Trim('"')
    if ($name) {
      # Don't override existing env vars (User/Process)
      if (-not (Test-Path -Path "Env:$name")) {
        Set-Item -Path "Env:$name" -Value $value
      }
    }
  }
}

# Prefer User environment variables if present.
$userMongoUri = [Environment]::GetEnvironmentVariable("MONGODB_URI", "User")
$userJwtSecret = [Environment]::GetEnvironmentVariable("JWT_SECRET", "User")

if (-not $env:MONGO_URI -and -not [string]::IsNullOrWhiteSpace($userMongoUri)) {
  $env:MONGO_URI = $userMongoUri
}
if (-not $env:JWT_SECRET -and -not [string]::IsNullOrWhiteSpace($userJwtSecret)) {
  $env:JWT_SECRET = $userJwtSecret
}

# Ensure Spring sees the Mongo URI even if .env contains localhost defaults.
if (-not [string]::IsNullOrWhiteSpace($userMongoUri)) {
  $env:SPRING_DATA_MONGODB_URI = $userMongoUri
}

# Load project root .env (docker-compose style) so local mvn run works too.
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Import-DotEnv -Path (Join-Path $projectRoot ".env")

# Backward compatibility: some machines have these as User env vars.
if (-not $env:MONGO_URI -and $env:MONGODB_URI) { $env:MONGO_URI = $env:MONGODB_URI }
if (-not $env:JWT_SECRET) {
  $env:JWT_SECRET = $userJwtSecret
}

if ([string]::IsNullOrWhiteSpace($env:MONGO_URI)) {
  throw "MONGO_URI is not set. Add it to the project root .env (recommended) or set it as an environment variable."
}
if ([string]::IsNullOrWhiteSpace($env:JWT_SECRET)) {
  throw "JWT_SECRET is not set. Add it to the project root .env (recommended) or set it as an environment variable."
}

# Spring Boot reads these environment variables automatically.
$env:SPRING_DATA_MONGODB_URI = if (-not [string]::IsNullOrWhiteSpace($env:SPRING_DATA_MONGODB_URI)) { $env:SPRING_DATA_MONGODB_URI } else { $env:MONGO_URI }
$env:APP_SECURITY_JWT_SECRET = $env:JWT_SECRET

$mongoHostHint = if ($env:SPRING_DATA_MONGODB_URI -match "localhost:27017") { "localhost" } else { "remote/atlas" }
Write-Host "Loaded backend env. Mongo=$mongoHostHint, root env=$projectRoot\.env" -ForegroundColor Green

# Atlas host fallback map (used when local DNS is unstable on hotspot/router DNS).
$atlasHostDefaults = [ordered]@{
  "ac-pxbrdzo-shard-00-00.zbci1vn.mongodb.net" = "159.143.51.11"
  "ac-pxbrdzo-shard-00-01.zbci1vn.mongodb.net" = "159.143.51.47"
  "ac-pxbrdzo-shard-00-02.zbci1vn.mongodb.net" = "159.143.51.30"
  "mtm-aws-aps1-6-m0-2-shard-00-00.a8cnc.mongodb.net" = "159.143.51.11"
  "mtm-aws-aps1-6-m0-2-shard-00-01.a8cnc.mongodb.net" = "159.143.51.47"
  "mtm-aws-aps1-6-m0-2-shard-00-02.a8cnc.mongodb.net" = "159.143.51.30"
  "www.googleapis.com" = "142.250.193.10"
  "oauth2.googleapis.com" = "142.250.193.10"
  "accounts.google.com" = "142.250.193.13"
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
$netstatOutput = netstat -ano | findstr "LISTENING" | findstr ":$port " | Select-Object -First 1

if ($netstatOutput) {
  $ownerPid = ($netstatOutput.Trim() -split '\s+')[-1]
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
