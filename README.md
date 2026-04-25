# ARB Buyer — Firefox Extension Source Code

## About
ARB Buyer is a plain HTML/CSS/JavaScript Firefox extension.  
**No build tools, transpilers, bundlers, or minifiers are used.**  
The source files ARE the final files — no compilation step is needed.

---

## Build Environment Requirements

| Requirement | Details |
|-------------|---------|
| Operating System | Windows 10/11, macOS 12+, or Linux (any distro) |
| Build tools required | **None** — pure HTML/CSS/JS, no Node.js, no npm |
| Archive tool | Any ZIP utility (PowerShell built-in, zip, 7-Zip, etc.) |

---

## File Structure

```
source/
  manifest.json   ← Extension manifest (Firefox MV3)
  popup.html      ← Extension popup UI
  popup.css       ← Popup styles
  popup.js        ← Popup logic (settings, start/stop)
  content.js      ← Content script (order detection & clicking)
  arb.jpg         ← Extension icon (1024x1024)
```

---

## Build Instructions

### Option A — Manual (any OS)

1. Create a new empty folder
2. Copy these files into it:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `content.js`
   - `arb.jpg`
3. Select all files inside the folder → compress to ZIP
4. Rename the ZIP file to `ARB-Buyer.xpi`

That's it. No compilation, no transpilation, no minification.

### Option B — PowerShell Script (Windows)

Run the included `build.ps1`:

```powershell
powershell -ExecutionPolicy Bypass -File build.ps1
```

Output: `dist/ARBFast-v1-Firefox.xpi`

---

## Verification

To verify the built XPI matches the source:

1. Rename `ARBFast-v1-Firefox.xpi` → `ARBFast-v1-Firefox.zip`
2. Open with any ZIP tool
3. Confirm it contains exactly the 6 files listed above
4. Compare each file's content with the source — they are identical (no transformation applied)

---

## No Obfuscation Statement

All JavaScript files (`popup.js`, `content.js`) are:
- Human-readable
- Not minified
- Not transpiled
- Not obfuscated
- Not machine-generated

The source code in this ZIP is byte-for-byte identical to the files inside the XPI.
