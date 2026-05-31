(() => {
  // src/background.ts
  var MENU_HIGHLIGHT = "page-notes-highlight-selection";
  var MENU_COMMENT = "page-notes-comment-selection";
  var DISABLED_HOSTS_KEY = "pageNotesDisabledHosts";
  var CONTENT_SCRIPT_ID = "page-notes-all-sites";
  var ALL_SITES = "<all_urls>";
  function createMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: MENU_HIGHLIGHT,
        title: "Highlight selection",
        contexts: ["selection"]
      });
      chrome.contextMenus.create({
        id: MENU_COMMENT,
        title: "Comment on selection",
        contexts: ["selection"]
      });
    });
  }
  chrome.runtime.onInstalled.addListener(createMenus);
  chrome.runtime.onStartup.addListener(createMenus);
  async function hasAllSitesAccess() {
    return chrome.permissions.contains({ origins: [ALL_SITES] });
  }
  async function unregisterContentScript() {
    await chrome.scripting.unregisterContentScripts({ ids: [CONTENT_SCRIPT_ID] }).catch(() => {
    });
  }
  async function registerContentScript() {
    await unregisterContentScript();
    await chrome.scripting.registerContentScripts([
      {
        id: CONTENT_SCRIPT_ID,
        matches: [ALL_SITES],
        js: ["dist/content.js"],
        css: ["dist/katex.content.css", "dist/content.css"],
        runAt: "document_idle"
      }
    ]);
  }
  function canRunOnTab(tab) {
    return Boolean(tab?.id && /^https?:|^file:/.test(tab.url || ""));
  }
  function getDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }
  async function isDomainDisabled(tab) {
    const domain = getDomain(tab.url || "");
    if (!domain) return false;
    const result = await chrome.storage.local.get({ [DISABLED_HOSTS_KEY]: [] });
    return result[DISABLED_HOSTS_KEY].includes(domain);
  }
  async function ensureContentScript(tabId) {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ["dist/katex.content.css", "dist/content.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/content.js"]
    });
  }
  async function injectIntoOpenTabs() {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.filter(canRunOnTab).map(async (tab) => {
        if (!tab.id) return;
        if (await isDomainDisabled(tab)) return;
        try {
          await ensureContentScript(tab.id);
        } catch {
        }
      })
    );
  }
  chrome.runtime.onInstalled.addListener(() => {
    syncAllSitesAccess().catch(() => {
    });
  });
  chrome.runtime.onStartup.addListener(() => {
    syncAllSitesAccess().catch(() => {
    });
  });
  async function syncAllSitesAccess() {
    if (!await hasAllSitesAccess()) {
      await unregisterContentScript();
      return;
    }
    await registerContentScript();
    await injectIntoOpenTabs();
  }
  chrome.permissions.onRemoved.addListener(() => {
    syncAllSitesAccess().catch(() => {
    });
  });
  chrome.permissions.onAdded.addListener(() => {
    syncAllSitesAccess().catch(() => {
    });
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "PAGE_NOTES_ENABLE_ALL_SITES") return false;
    syncAllSitesAccess().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  });
  async function sendCommand(tab, message) {
    if (!canRunOnTab(tab)) return;
    if (await isDomainDisabled(tab)) return;
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch {
      try {
        await ensureContentScript(tab.id);
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
      }
    }
  }
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!canRunOnTab(tab)) return;
    if (info.menuItemId === MENU_HIGHLIGHT) {
      sendCommand(tab, { type: "PAGE_NOTES_CONTEXT_HIGHLIGHT" });
    }
    if (info.menuItemId === MENU_COMMENT) {
      sendCommand(tab, { type: "PAGE_NOTES_CONTEXT_COMMENT" });
    }
  });
})();
