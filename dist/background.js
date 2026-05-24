(() => {
  // src/background.ts
  var MENU_HIGHLIGHT = "page-notes-highlight-selection";
  var MENU_COMMENT = "page-notes-comment-selection";
  var DISABLED_HOSTS_KEY = "pageNotesDisabledHosts";
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
      files: ["dist/content.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/content.js"]
    });
  }
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
