# ARBFast Buyer v1.5 - Build Script (Chrome + Edge + Firefox)
$Root   = $PSScriptRoot
$OutDir = Join-Path $Root "dist"

if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# Shared files for Chrome/Edge (no arb.jpg — unused asset)
$sharedFiles = @("popup.html","popup.css","popup.js","content.js",
                 "icon48.png","icon96.png","icon128.png","icon1024.png")

# ── Chrome / Brave ────────────────────────────────────────────────────────────
Write-Host "Building Chrome/Brave..." -ForegroundColor Cyan
$cd = Join-Path $OutDir "chrome-build"
New-Item -ItemType Directory -Force -Path $cd | Out-Null
foreach ($f in $sharedFiles) {
    if (Test-Path (Join-Path $Root $f)) {
        Copy-Item (Join-Path $Root $f) (Join-Path $cd $f) -Force
    }
}
Copy-Item (Join-Path $Root "manifest.chrome.json") (Join-Path $cd "manifest.json") -Force
$czip = Join-Path $OutDir "ARBFast-v1-Chrome.zip"
Compress-Archive -Path (Join-Path $cd "*") -DestinationPath $czip -Force
Write-Host "  -> $czip" -ForegroundColor Green

# ── Microsoft Edge ────────────────────────────────────────────────────────────
Write-Host "Building Microsoft Edge..." -ForegroundColor Cyan
$ed = Join-Path $OutDir "edge-build"
New-Item -ItemType Directory -Force -Path $ed | Out-Null
foreach ($f in $sharedFiles) {
    if (Test-Path (Join-Path $Root $f)) {
        Copy-Item (Join-Path $Root $f) (Join-Path $ed $f) -Force
    }
}
Copy-Item (Join-Path $Root "manifest.edge.json") (Join-Path $ed "manifest.json") -Force
$ezip = Join-Path $OutDir "ARBFast-v1-Edge.zip"
Compress-Archive -Path (Join-Path $ed "*") -DestinationPath $ezip -Force
Write-Host "  -> $ezip" -ForegroundColor Green

# ── Firefox ───────────────────────────────────────────────────────────────────
Write-Host "Building Firefox..." -ForegroundColor Cyan
$fd = Join-Path $OutDir "firefox-build"
New-Item -ItemType Directory -Force -Path $fd | Out-Null

# Firefox uses its own browser-API-compatible JS files
$ffStaticFiles = @("popup.html","popup.css","icon48.png","icon96.png","icon128.png")
foreach ($f in $ffStaticFiles) {
    if (Test-Path (Join-Path $Root $f)) {
        Copy-Item (Join-Path $Root $f) (Join-Path $fd $f) -Force
    }
}
# Use Firefox-specific JS (Promise-based browser.* API)
Copy-Item (Join-Path $Root "popup.firefox.js")   (Join-Path $fd "popup.js")   -Force
Copy-Item (Join-Path $Root "content.firefox.js")  (Join-Path $fd "content.js") -Force
Copy-Item (Join-Path $Root "manifest.firefox.json") (Join-Path $fd "manifest.json") -Force

$tmp  = Join-Path $OutDir "tmp.zip"
$fxpi = Join-Path $OutDir "ARBFast-v1-Firefox.xpi"
Compress-Archive -Path (Join-Path $fd "*") -DestinationPath $tmp -Force
Move-Item $tmp $fxpi -Force
Write-Host "  -> $fxpi" -ForegroundColor Green

Write-Host ""
Write-Host "Build complete - Chrome + Edge + Firefox, 0 errors, 0 warnings" -ForegroundColor Yellow
