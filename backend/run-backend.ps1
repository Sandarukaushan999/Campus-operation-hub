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
Write-Host "Starting backend on http://localhost:8080 ..." -ForegroundColor Green

mvn spring-boot:run