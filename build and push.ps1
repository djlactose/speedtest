#requires -Version 5.1
$ErrorActionPreference = "Stop"

$Image = "djlactose/speedtest"
$Tag = Get-Date -Format "yyyyMMdd-HHmm"

Write-Host "Building $Image with tags :latest and :$Tag" -ForegroundColor Cyan

# Build with SBOM + provenance so Docker Scout can grade supply-chain attestations.
docker buildx build `
  --sbom=true `
  --provenance=mode=max `
  -t "${Image}:latest" `
  -t "${Image}:$Tag" `
  --push `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "Scanning with Docker Scout..." -ForegroundColor Cyan

docker scout quickview "${Image}:latest"

# Fail the script if any critical or high vulnerability is reported.
docker scout cves --only-severity critical,high --exit-code "${Image}:latest"
$scoutExit = $LASTEXITCODE

if ($scoutExit -ne 0) {
    Write-Host "Docker Scout found critical/high CVEs. Review the output above." -ForegroundColor Red
    exit $scoutExit
}

Write-Host "Build + scan complete: ${Image}:$Tag" -ForegroundColor Green
