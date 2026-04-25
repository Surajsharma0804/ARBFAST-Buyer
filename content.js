// ARBFast Buyer v1.4 — content.js (exact amount match only)
let arbInterval = null;
let buyCount    = 0;
let observer    = null;

function stopInterval() {
  if (arbInterval) { clearInterval(arbInterval); arbInterval = null; }
  if (observer)    { observer.disconnect();      observer    = null; }
}

function startObserver() {
  if (observer) observer.disconnect();
  observer = new MutationObserver(() => {
    const list = document.querySelector(".x-buyList-list");
    if (!list || list.children.length === 0) stopInterval();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function parseAmount(text) {
  if (!text) return NaN;
  const m = text.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
}

function findReloadButton(reloadType) {
  if (reloadType === "NONE") return null;
  const nav = document.querySelector(".van-tabs__nav");
  if (!nav) return null;
  return Array.from(nav.children).find(
    (n) => (n.textContent || "").trim().toUpperCase().includes(reloadType),
  );
}

function buyExactOrder(targetAmount, delay, reloadType) {
  stopInterval();
  if (!document.querySelector(".x-buyList-list")) return;

  startObserver();
  const reloadBtn = findReloadButton(reloadType);

  arbInterval = setInterval(() => {
    const list = document.querySelector(".x-buyList-list");
    if (!list) { stopInterval(); return; }

    document.querySelectorAll(".x-buyList-list .item").forEach((item) => {
      const el = item.querySelector(".amount");
      if (!el) return;
      const amount = parseAmount(el.textContent || "");
      if (!Number.isFinite(amount)) return;

      // ── EXACT match only ──────────────────────────
      if (amount === targetAmount) {
        const btn = item.querySelector("button");
        if (btn) { btn.click(); buyCount++; }
      }
    });

    if (reloadBtn) reloadBtn.click();
  }, delay);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "ping") {
    sendResponse({ ok: true });
    return false;
  }
  if (msg.action === "start") {
    const amount     = Number.isFinite(msg.amount) && msg.amount > 0 ? msg.amount : 1000;
    const delay      = Number.isFinite(msg.delay) ? Math.max(100, msg.delay) : 500;
    const reloadType = ["NONE","OTP","BANK"].includes(msg.reloadType) ? msg.reloadType : "NONE";
    buyExactOrder(amount, delay, reloadType);
    sendResponse({ running: true, buyCount });
    return false;
  }
  if (msg.action === "stop") {
    stopInterval();
    sendResponse({ running: false, buyCount });
    return false;
  }
  if (msg.action === "status") {
    sendResponse({ running: !!arbInterval, buyCount });
    return false;
  }
  return false;
});
