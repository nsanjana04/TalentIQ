# Push TalentIQ schema + seed data to local PostgreSQL 18
# Usage: .\scripts\setup-local-postgres.ps1 -Password "your_postgres_password"

param(
    [Parameter(Mandatory = $true)]
    [string]$Password,

    [string]$User = "postgres",
    [string]$HostName = "localhost",
    [int]$Port = 5432,
    [string]$Database = "talentiq",
    [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

if (-not (Test-Path $psql)) {
    throw "psql not found at $psql. Update the path in this script if PostgreSQL is installed elsewhere."
}

$env:PGPASSWORD = $Password
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

Write-Host "Testing connection to PostgreSQL 18..." -ForegroundColor Cyan
& $psql -U $User -h $HostName -p $Port -d postgres -c "SELECT version();" | Out-Null
Write-Host "Connected." -ForegroundColor Green

Write-Host "Creating database '$Database' (if missing)..." -ForegroundColor Cyan
$exists = & $psql -U $User -h $HostName -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database';"
if ($exists.Trim() -ne "1") {
    & $psql -U $User -h $HostName -p $Port -d postgres -c "CREATE DATABASE $Database;"
    Write-Host "Database '$Database' created." -ForegroundColor Green
} else {
    Write-Host "Database '$Database' already exists." -ForegroundColor Yellow
}

$encodedPassword = [uri]::EscapeDataString($Password)
$databaseUrl = "postgresql://${User}:${encodedPassword}@${HostName}:${Port}/${Database}?schema=public"

Write-Host "Updating DATABASE_URL in .env.local and .env..." -ForegroundColor Cyan
foreach ($envFile in @(".env.local", ".env")) {
    $path = Join-Path $projectRoot $envFile
    if (-not (Test-Path $path)) { continue }
    $content = Get-Content $path -Raw
    $content = $content -replace 'DATABASE_URL=.*', "DATABASE_URL=$databaseUrl"
    Set-Content $path $content -NoNewline
}

$env:DATABASE_URL = $databaseUrl

Write-Host "Running Prisma migrations (creates all tables)..." -ForegroundColor Cyan
npx prisma generate
npx prisma migrate deploy

if (-not $SkipSeed) {
    Write-Host "Seeding sample data (users, roles, skills)..." -ForegroundColor Cyan
    npm run db:seed
}

Write-Host ""
Write-Host "Done! TalentIQ tables are now in local PostgreSQL:" -ForegroundColor Green
Write-Host "  Server:  PostgreSQL 18 @ ${HostName}:${Port}"
Write-Host "  Database: $Database"
Write-Host "  Refresh pgAdmin -> Databases -> $Database -> Schemas -> public -> Tables"
Write-Host ""
Write-Host "Login: anna.kowalski@talentiq.com / TalentIQ@2026"
Write-Host "Restart app: npm run dev"
