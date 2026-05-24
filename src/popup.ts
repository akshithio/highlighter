export {};

const notesEl = document.querySelector("#notes") as HTMLOListElement;
const emptyEl = document.querySelector("#empty") as HTMLDivElement;
const countEl = document.querySelector("#count") as HTMLSpanElement;
const domainToggleButton = document.querySelector("#domain-toggle") as HTMLButtonElement;
const clearButton = document.querySelector("#clear") as HTMLButtonElement;
const DISABLED_HOSTS_KEY = "pageNotesDisabledHosts";

let currentPage = null;
let activeTabId = null;
let activeDomain = "";
let domainDisabled = false;

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

async function getDisabledHosts() {
  const result = await chrome.storage.local.get({ [DISABLED_HOSTS_KEY]: [] });
  return result[DISABLED_HOSTS_KEY];
}

async function setDomainDisabled(domain, disabled) {
  const domains = new Set(await getDisabledHosts());
  if (disabled) {
    domains.add(domain);
  } else {
    domains.delete(domain);
  }

  await chrome.storage.local.set({ [DISABLED_HOSTS_KEY]: Array.from(domains).sort() });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab");
  activeTabId = tab.id;
  activeDomain = getDomain(tab.url || "");
  return tab;
}

async function ensureContentScript() {
  const tab = await getActiveTab();
  const url = tab.url || "";

  if (!/^https?:|^file:/.test(url)) {
    throw new Error("Unsupported page");
  }

  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ["dist/content.css"]
  });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["dist/content.js"]
  });
}

async function sendToActiveTab(message) {
  await getActiveTab();
  return chrome.tabs.sendMessage(activeTabId, message);
}

async function sendToPage(message) {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (!tab?.id) throw new Error("No active tab");
    return chrome.tabs.sendMessage(tab.id, message);
  });
}

function render(highlights) {
  notesEl.textContent = "";
  countEl.textContent = String(highlights.length);
  emptyEl.hidden = highlights.length > 0;
  clearButton.disabled = highlights.length === 0;
  domainToggleButton.disabled = !activeDomain;
  domainToggleButton.textContent = domainDisabled ? "Enable on this domain" : "Disable on this domain";

  for (const highlight of highlights) {
    const item = document.createElement("li");
    const quote = document.createElement("blockquote");
    const note = document.createElement("p");

    quote.textContent = highlight.text;
    note.textContent = highlight.note || "No comment";

    item.append(quote, note);
    notesEl.append(item);
  }
}

async function refresh() {
  try {
    await getActiveTab();
    domainDisabled = activeDomain ? (await getDisabledHosts()).includes(activeDomain) : false;

    if (domainDisabled) {
      currentPage = null;
      emptyEl.textContent = `highlighter is disabled on ${activeDomain}.`;
      render([]);
      return;
    }

    currentPage = await chrome.tabs.sendMessage(activeTabId, { type: "PAGE_NOTES_GET" });
    render(currentPage.highlights || []);
  } catch {
    try {
      await ensureContentScript();
      currentPage = await sendToActiveTab({ type: "PAGE_NOTES_GET" });
      emptyEl.textContent = "Select text on the page, then use the floating toolbar or right-click menu.";
      render(currentPage.highlights || []);
    } catch {
      currentPage = null;
      emptyEl.textContent = "Open a regular webpage to use highlights and comments.";
      render([]);
    }
  }
}

domainToggleButton.addEventListener("click", async () => {
  await getActiveTab();
  if (!activeDomain) return;

  domainDisabled = !domainDisabled;
  await setDomainDisabled(activeDomain, domainDisabled);

  if (domainDisabled) {
    await sendToPage({ type: "PAGE_NOTES_DISABLE_HOST" }).catch(() => {});
  }

  await refresh();
});

clearButton.addEventListener("click", async () => {
  if (!currentPage?.highlights?.length) return;
  await sendToPage({ type: "PAGE_NOTES_CLEAR" });
  await refresh();
});

refresh();
