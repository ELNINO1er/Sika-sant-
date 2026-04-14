param(
  [string]$ImageName = "sika-sante-backend",
  [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

Write-Host "Building backend image $ImageName`:$Tag"
docker build -t "$ImageName`:$Tag" .\backend

Write-Host "Image build complete."
Write-Host "Run example:"
Write-Host "docker run --env-file .\backend\.env -p 4000:4000 $ImageName`:$Tag"
