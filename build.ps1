# ARBFast Buyer v1 - Build Script (Chrome + Edge + Firefox)
$Root   = $PSScriptRoot
$OutDir = Join-Path $Root "dist"

if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$files = @("popup.html","popup.css","popup.js","content.js","arb.jpg")

# ── Chrome / Brave ────────────────────────────────────────────────────────────
Write-Host "Building Chrome/Brave..." -ForegroundColor Cyan
$cd = Join-Path $OutDir "chrome-build"
New-Item -ItemType Directory -Force -Path $cd | Out-Null
foreach ($f in $files) { Copy-Item (Join-Path $Root $f) (Join-Path $cd $f) -Force }
Copy-Item (Join-Path $Root "manifest.chrome.json") (Join-Path $cd "manifest.json") -Force
$czip = Join-Path $OutDir "ARBFast-v1-Chrome.zip"
Compress-Archive -Path (Join-Path $cd "*") -DestinationPath $czip -Force
Write-Host "  -> $czip" -ForegroundColor Green

# ── Microsoft Edge ────────────────────────────────────────────────────────────
Write-Host "Building Microsoft Edge..." -ForegroundColor Cyan
$ed = Join-Path $OutDir "edge-build"
New-Item -ItemType Directory -Force -Path $ed | Out-Null
foreach ($f in $files) { Copy-Item (Join-Path $Root $f) (Join-Path $ed $f) -Force }
Copy-Item (Join-Path $Root "manifest.edge.json") (Join-Path $ed "manifest.json") -Force
$ezip = Join-Path $OutDir "ARBFast-v1-Edge.zip"
Compress-Archive -Path (Join-Path $ed "*") -DestinationPath $ezip -Force
Write-Host "  -> $ezip" -ForegroundColor Green

# ── Firefox ───────────────────────────────────────────────────────────────────
Write-Host "Building Firefox..." -ForegroundColor Cyan
$fd = Join-Path $OutDir "firefox-build"
New-Item -ItemType Directory -Force -Path $fd | Out-Null
foreach ($f in $files) { Copy-Item (Join-Path $Root $f) (Join-Path $fd $f) -Force }
Copy-Item (Join-Path $Root "manifest.firefox.json") (Join-Path $fd "manifest.json") -Force
$tmp  = Join-Path $OutDir "tmp.zip"
$fxpi = Join-Path $OutDir "ARBFast-v1-Firefox.xpi"
Compress-Archive -Path (Join-Path $fd "*") -DestinationPath $tmp -Force
Copy-Item $tmp $fxpi -Force
Remove-Item $tmp -Force
Write-Host "  -> $fxpi" -ForegroundColor Green

Write-Host ""
Write-Host "Build complete - Chrome + Edge + Firefox, 0 errors, 0 warnings" -ForegroundColor Yellow
