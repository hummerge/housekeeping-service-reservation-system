# WeChat Miniprogram Package Size Analysis - Simple Version

Set-Location "d:\cherrystudio\yyousn"

Write-Host ""
Write-Host "=============================================="
Write-Host "WECHAT MINIPROGRAM PACKAGE SIZE ANALYSIS"
Write-Host "=============================================="
Write-Host ""

# Function to get directory info
function Get-DirInfo {
    param([string]$Path)
    $items = Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.git' -and $_.Name -notlike '*.log' }
    $totalSize = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    return @{
        Count = $items.Count
        Size = $totalSize
    }
}

# 1. Pages
Write-Host "=== MAIN PACKAGE COMPONENTS ===" -ForegroundColor Cyan
$result = Get-DirInfo -Path "pages"
Write-Host ("pages/:           {0:N2} KB ({1} files)" -f ($result.Size / 1KB), $result.Count)

# 2. miniprogram_npm
$result = Get-DirInfo -Path "miniprogram_npm"
Write-Host ("miniprogram_npm/: {0:N2} KB ({1} files)" -f ($result.Size / 1KB), $result.Count)

# List each package in miniprogram_npm
Write-Host ""
Write-Host "miniprogram_npm breakdown:" -ForegroundColor Yellow
Get-ChildItem -Path "miniprogram_npm" -Directory | ForEach-Object {
    $subResult = Get-DirInfo -Path $_.FullName
    Write-Host ("  {0,-25} {1:N2} KB" -f ($_.Name + "/"), ($subResult.Size / 1KB))
}

# 3. Images
$result = Get-DirInfo -Path "images"
Write-Host ("images/:          {0:N2} KB ({1} files)" -f ($result.Size / 1KB), $result.Count)

# 4. Utils
$result = Get-DirInfo -Path "utils"
Write-Host ("utils/:          {0:N2} KB ({1} files)" -f ($result.Size / 1KB), $result.Count)

# 5. Components
$result = Get-DirInfo -Path "components"
Write-Host ("components/:     {0:N2} KB ({1} files)" -f ($result.Size / 1KB), $result.Count)

# 6. App files
$appFiles = Get-ChildItem -Path . -Include "app.*" -Force -ErrorAction SilentlyContinue
$appSize = ($appFiles | Measure-Object -Property Length -Sum).Sum
Write-Host ("app.* files:      {0:N2} KB ({1} files)" -f ($appSize / 1KB), $appFiles.Count)

# Calculate MAIN PACKAGE TOTAL
$mainTotal = 0
$mainTotal += (Get-DirInfo -Path "pages").Size
$mainTotal += (Get-DirInfo -Path "miniprogram_npm").Size
$mainTotal += (Get-DirInfo -Path "images").Size
$mainTotal += (Get-DirInfo -Path "utils").Size
$mainTotal += (Get-DirInfo -Path "components").Size
$mainTotal += $appSize

Write-Host ""
Write-Host ("MAIN PACKAGE TOTAL: {0:N2} KB" -f ($mainTotal / 1KB)) -ForegroundColor Yellow
$limitMB = 2MB
$limitKB = $limitMB / 1KB
$usagePercent = ($mainTotal / $limitMB) * 100
Write-Host ("Limit: {0:N2} KB (2 MB)" -f $limitKB)
Write-Host ("Usage: {0:N2}% " -f $usagePercent)

if ($mainTotal -gt $limitMB) {
    $overBy = ($mainTotal - $limitMB) / 1KB
    Write-Host ("STATUS: OVER LIMIT by {0:N2} KB!" -f $overBy) -ForegroundColor Red
} else {
    $remaining = ($limitMB - $mainTotal) / 1KB
    Write-Host ("STATUS: Within limit ({0:N2} KB remaining)" -f $remaining) -ForegroundColor Green
}

Write-Host ""
Write-Host "=== LARGEST FILES IN MINIPROGRAM_NPM ===" -ForegroundColor Cyan
Get-ChildItem -Path "miniprogram_npm" -Recurse -Force | Where-Object { -not $_.PSIsContainer } | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
    $relPath = $_.FullName.Replace("d:\cherrystudio\yyousn\", "")
    Write-Host ("  {0,10:N2} KB - {1}" -f ($_.Length / 1KB), $relPath)
}

Write-Host ""
Write-Host "=== SUBPACKAGES ===" -ForegroundColor Cyan
$subTotal = 0
Get-ChildItem -Path "subpackage" -Directory | ForEach-Object {
    $result = Get-DirInfo -Path $_.FullName
    $subTotal += $result.Size
    Write-Host ("  {0,-25} {1:N2} KB ({2} files)" -f ($_.Name + "/"), ($result.Size / 1KB), $result.Count)
    
    # Show largest files
    Get-ChildItem -Path $_.FullName -Recurse -Force | Where-Object { -not $_.PSIsContainer } | Sort-Object Length -Descending | Select-Object -First 5 | ForEach-Object {
        $relPath = $_.FullName.Replace("d:\cherrystudio\yyousn\subpackage\", "")
        Write-Host ("      {0,8:N2} KB - {1}" -f ($_.Length / 1KB), $relPath)
    }
}
Write-Host ("  {0,-25} {1:N2} KB (SUBPACKAGES TOTAL)" -f "ALL SUBPACKAGES:", ($subTotal / 1KB)) -ForegroundColor Green

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host ("  Main Package:     {0:N2} KB" -f ($mainTotal / 1KB))
Write-Host ("  Subpackages:      {0:N2} KB" -f ($subTotal / 1KB))
Write-Host ("  Combined Total:  {0:N2} KB" -f (($mainTotal + $subTotal) / 1KB))
Write-Host ""
Write-Host "=============================================="
