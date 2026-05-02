// ARBFast Buyer v1.5 — popup.js
let running = false;

const els = {
  status:        document.getElementById("status"),
  statusDot:     document.getElementById("statusDot"),
  toggle:        document.getElementById("toggle"),
  toggleLabel:   document.getElementById("toggleLabel"),
  toggleIcon:    document.getElementById("toggleIcon"),
  count:         document.getElementById("count"),
  amountDisplay: document.getElementById("amountDisplay"),
  amount:        document.getElementById("amount"),
  delay:         document.getElementById("delay"),
  reloadType:    document.getElementById("reloadType"),
  openArb:       document.getElementById("open-arb"),
  planeWrap:     document.getElementById("planeWrap"),
};

// ── Airplane animation ──────────────────────────────
function launchPlane() {
  const p = els.planeWrap;
  // Remove old animation class, force reflow, re-add
  p.classList.remove("flying");
  void p.offsetWidth; // reflow
  p.classList.add("flying");
  // Clean up after animation
  p.addEventListener("animationend", () => p.classList.remove("flying"), { once: true });
}

// ── Tab helper ──────────────────────────────────────
function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.id) { callback(null); return; }
    callback(tab);
  });
}

// ── Message sender ──────────────────────────────────
function send(action, callback) {
  getActiveTab((tab) => {
    if (!tab) { callback?.({ running: false, buyCount: 0 }); return; }

    const sendToTab = () => {
      chrome.tabs.sendMessage(tab.id, action, (response) => {
        if (chrome.runtime.lastError) { callback?.({ running: false, buyCount: 0 }); return; }
        callback?.(response);
      });
    };

    chrome.tabs.sendMessage(tab.id, { action: "ping" }, () => {
      if (!chrome.runtime.lastError) { sendToTab(); return; }
      chrome.scripting.executeScript(
        { target: { tabId: tab.id }, files: ["content.js"] },
        () => {
          if (chrome.runtime.lastError) { callback?.({ running: false, buyCount: 0 }); return; }
          sendToTab();
        },
      );
    });
  });
}

// ── UI Update ───────────────────────────────────────
let prevCount = 0;

function updateUI(status) {
  if (!status) return;
  running = !!status.running;

  // Status badge
  els.status.textContent = running ? "Running" : "Stopped";
  els.status.className   = running ? "running"  : "stopped";
  els.statusDot.className = running ? "status-dot active-dot" : "status-dot";

  // Toggle button
  els.toggle.className   = running ? "btn-toggle stop" : "btn-toggle start";
  els.toggleLabel.textContent = running ? "Stop" : "Start Auto-Buy";
  els.toggleIcon.textContent  = running ? "■" : "▶";

  // Order count with bump animation
  const newCount = status.buyCount ?? 0;
  if (newCount !== prevCount) {
    els.count.textContent = newCount;
    els.count.classList.remove("count-bump");
    void els.count.offsetWidth;
    els.count.classList.add("count-bump");
    els.count.addEventListener("animationend", () => els.count.classList.remove("count-bump"), { once: true });
    prevCount = newCount;
  }

  // Shimmer on order count when running
  if (running) {
    els.count.classList.add("shimmer");
  } else {
    els.count.classList.remove("shimmer");
  }
}

function refreshStatus() { send({ action: "status" }, updateUI); }

// ── Settings ────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

function getSanitizedSettings() {
  let amount = Number(els.amount.value);
  let delay  = Number(els.delay.value);

  if (!Number.isFinite(amount) || amount <= 0) amount = 1000;
  if (!Number.isFinite(delay))                 delay  = 500;

  amount = clamp(Math.floor(amount), 1, 1_000_000_000);
  delay  = clamp(Math.floor(delay), 100, 60_000);

  els.amount.value = String(amount);
  els.delay.value  = String(delay);

  // Update live display
  if (els.amountDisplay) els.amountDisplay.textContent = amount;

  return { amount, delay, reloadType: els.reloadType.value };
}

function saveSettings() {
  const s = getSanitizedSettings();
  chrome.storage.local.set({ buyerSettings: s });
  return s;
}

function loadSettings(callback) {
  chrome.storage.local.get("buyerSettings", (data) => {
    const s = data?.buyerSettings;
    if (s) {
      els.amount.value     = String(s.amount     ?? 1000);
      els.delay.value      = String(s.delay       ?? 500);
      els.reloadType.value = s.reloadType          ?? "OTP";
      if (els.amountDisplay) els.amountDisplay.textContent = s.amount ?? 1000;
    }
    callback?.();
  });
}

// ── Events ──────────────────────────────────────────
els.toggle.addEventListener("click", () => {
  const s = saveSettings();
  const isStarting = !running;

  // 🛫 Launch plane when STARTING
  if (isStarting) launchPlane();

  send(
    { action: running ? "stop" : "start", amount: s.amount, delay: s.delay, reloadType: s.reloadType },
    (result) => {
      updateUI(result);
      // Extra plane launch after confirmed start
      if (isStarting && result?.running) {
        setTimeout(launchPlane, 800);
      }
    }
  );
});

// Live amount display sync
els.amount.addEventListener("input", () => {
  const v = Number(els.amount.value);
  if (els.amountDisplay && v > 0) els.amountDisplay.textContent = Math.floor(v);
});

[els.amount, els.delay, els.reloadType].forEach((el) =>
  el.addEventListener("change", saveSettings)
);

els.openArb.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.tabs.create({ url: "https://arbpay.me" });
});

// ── Init ────────────────────────────────────────────
loadSettings(refreshStatus);
