# WeChat Miniprogram Package Size Analysis

$projectRoot = "d:\cherrystudio\yyousn"
Set-Location $projectRoot

Write-Host "=============================================="
Write-Host "WECHAT MINIPROGRAM PACKAGE SIZE ANALYSIS"
Write-Host "=============================================="
Write-Host ""

# Function to get directory size
function Get-DirSize {
    param([string]$Path, [int]$Depth = 0)
    $items = Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.git' -and $_.Name -notlike '*.log' }
    $totalSize = ($items | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    return @{
        Count = $items.Count
        Size = $totalSize
    }
}

# 1. Main Package Components (pages/, miniprogram_npm/, components/, images/, utils/, app.*)
Write-Host "=== MAIN PACKAGE COMPONENTS ===" -ForegroundColor Cyan

$components = @{
    "pages/" = @{}
    "miniprogram_npm/" = @{}
    "components/" = @{}
    "images/" = @{}
    "utils/" = @{}
    "app.*" = @{}
}

foreach ($comp in $components.Keys) {
    if ($comp -like "app.*") {
        $files = Get-ChildItem -Path . -Include "app.*" -Force -ErrorAction SilentlyContinue
        $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
        $count = $files.Count
    } else {
        if (Test-Path $comp) {
            $result = Get-DirSize -Path $comp
            $totalSize = $result.Size
            $count = $result.Count
        } else {
            $totalSize = 0
            $count = 0
        }
    }
    $components[$comp] = @{Size = $totalSize; Count = $count}
    $sizeKB = [math]::Round($totalSize / 1KB, 2)
    Write-Host ("  {0,-20} {1,10:N2} KB ({2} files)" -f $comp, $sizeKB, $count)
}

# Calculate main package total
$mainPackageTotal = 0
foreach ($comp in $components.Values) {
    $mainPackageTotal += $comp.Size
}
Write-Host ("  {0,-20} {1,10:N2} KB (TOTAL)" -f "MAIN PACKAGE:", [math]::Round($mainPackageTotal/1KB, 2)) -ForegroundColor Yellow

Write-Host ""
Write-Host "=== LARGEST FILES IN PAGES/ ===" -ForegroundColor Cyan
if (Test-Path "pages") {
    $pagesFiles = Get-ChildItem -Path "pages" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '.git' -and $_.Name -notlike '*.log' }
    $pagesFiles | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
        $relPath = $_.FullName.Replace("$projectRoot\", "")
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host ("  {0,10:N2} KB - {1}" -f $sizeKB, $relPath)
    }
}

Write-Host ""
Write-Host "=== LARGEST FILES IN MINIPROGRAM_NPM/ ===" -ForegroundColor Cyan
if (Test-Path "miniprogram_npm") {
    Get-ChildItem -Path "miniprogram_npm" -Directory -Force | ForEach-Object {
        $subResult = Get-DirSize -Path $_.FullName
        $subSizeKB = [math]::Round($subResult.Size / 1KB, 2)
        Write-Host ("  {0,10:N2} KB - {1}/" -f $subSizeKB, $_.Name)
        # Show largest files in each package
        Get-ChildItem -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Sort-Object Length -Descending | Select-Object -First 3 | ForEach-Object {
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host ("      {0,8:N2} KB - {1}" -f $sizeKB, $_.Name)
        }
    }
}

Write-Host ""
Write-Host "=== LARGEST FILES IN COMPONENTS/ ===" -ForegroundColor Cyan
if (Test-Path "components") {
    Get-ChildItem -Path "components" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Sort-Object Length -Descending | Select-Object -First 10 | ForEach-Object {
        $relPath = $_.FullName.Replace("$projectRoot\", "")
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Host ("  {0,10:N2} KB - {1}" -f $sizeKB, $relPath)
    }
}

Write-Host ""
Write-Host "=== SUBPACKAGES ===" -ForegroundColor Cyan
if (Test-Path "subpackage") {
    $subpackageTotal = 0
    Get-ChildItem -Path "subpackage" -Directory -Force | ForEach-Object {
        $result = Get-DirSize -Path $_.FullName
        $subpackageTotal += $result.Size
        $sizeKB = [math]::Round($result.Size / 1KB, 2)
        Write-Host ("  {0,-25} {1,10:N2} KB ({2} files)" -f $_.Name, $sizeKB, $result.Count)
        
        # Show largest files in subpackage
        Get-ChildItem -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Sort-Object Length -Descending | Select-Object -First 5 | ForEach-Object {
            $relPath = $_.FullName.Replace("$projectRoot\subpackage\$($_.Name)\", "")
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host ("      {0,8:N2} KB - {1}" -f $sizeKB, $relPath)
        }
    }
    Write-Host ("  {0,-25} {1,10:N2} KB (SUBPACKAGES TOTAL)" -f "ALL SUBPACKAGES:", [math]::Round($subpackageTotal/1KB, 2)) -ForegroundColor Green
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host ("  Main Package Size:     {0:N2} KB" -f ([math]::Round($mainPackageTotal/1KB, 2)))
Write-Host ("  Subpackages Size:      {0:N2} KB" -f ([math]::Round($subpackageTotal/1KB, 2)))
Write-Host ("  Main Package Limit:    2048 KB (2 MB)")
Write-Host ("  Main Package Usage:    {0:N2}% " -f (($mainPackageTotal / 2MB) * 100))
if ($mainPackageTotal -gt 2MB) {
    Write-Host ("  STATUS: OVER LIMIT by {0:N2} KB!" -f ([math]::Round(($mainPackageTotal - 2MB)/1KB, 2))) -ForegroundColor Red
} else {
    Write-Host ("  STATUS: Within limit ({0:N2} KB remaining)" -f ([math]::Round((2MB - $mainPackageTotal)/1KB, 2))) -ForegroundColor Green
}

Write-Host ""
Write-Host "=============================================="
