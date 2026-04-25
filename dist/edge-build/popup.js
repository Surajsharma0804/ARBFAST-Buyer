// ARBFast Buyer v1.4 — popup.js (exact amount match, no min/max)
let running = false;

const els = {
  status:     document.getElementById("status"),
  toggle:     document.getElementById("toggle"),
  count:      document.getElementById("count"),
  amount:     document.getElementById("amount"),
  delay:      document.getElementById("delay"),
  reloadType: document.getElementById("reloadType"),
  openArb:    document.getElementById("open-arb"),
};

function getActiveTab(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.id) { callback(null); return; }
    callback(tab);
  });
}

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

function updateUI(status) {
  if (!status) return;
  running = !!status.running;
  els.status.textContent = running ? "Running" : "Stopped";
  els.status.className   = running ? "running" : "stopped";
  els.toggle.textContent = running ? "Stop" : "Start";
  els.toggle.className   = running ? "stop" : "start";
  els.count.textContent  = status.buyCount ?? 0;
}

function refreshStatus() { send({ action: "status" }, updateUI); }

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
      els.amount.value     = String(s.amount ?? 1000);
      els.delay.value      = String(s.delay  ?? 500);
      els.reloadType.value = s.reloadType ?? "OTP";
    }
    callback?.();
  });
}

els.toggle.addEventListener("click", () => {
  const s = saveSettings();
  send({ action: running ? "stop" : "start", amount: s.amount, delay: s.delay, reloadType: s.reloadType }, refreshStatus);
});

[els.amount, els.delay, els.reloadType].forEach((el) => el.addEventListener("change", saveSettings));

els.openArb.addEventListener("click", (event) => {
  event.preventDefault();
  getActiveTab((tab) => {
    if (!tab) return;
    chrome.tabs.update(tab.id, { url: "https://arbpay.me/#/buy/arb" });
    const listener = (updatedTabId, info) => {
      if (updatedTabId !== tab.id || info.status !== "complete") return;
      chrome.tabs.onUpdated.removeListener(listener);
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.setTimeout(() => {
            const el = Array.from(document.querySelectorAll('[class*="van-tab"]'))
              .find((n) => (n.textContent || "").toLowerCase().includes("buy"));
            if (el) el.click();
          }, 1200);
        },
      });
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
});

loadSettings(refreshStatus);
