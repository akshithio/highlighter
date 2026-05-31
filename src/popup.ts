export {};

import { renderComment } from "./render-math";

const notesEl = document.querySelector("#notes") as HTMLOListElement;
const emptyEl = document.querySelector("#empty") as HTMLDivElement;
const countEl = document.querySelector("#count") as HTMLSpanElement;
const domainToggleButton = document.querySelector("#domain-toggle") as HTMLButtonElement;
const clearButton = document.querySelector("#clear") as HTMLButtonElement;
const onboardingEl = document.querySelector("#onboarding") as HTMLElement;
const notesMainEl = document.querySelector("#notes-main") as HTMLElement;
const notesFooterEl = document.querySelector("#notes-footer") as HTMLElement;
const enableAccessButton = document.querySelector("#enable-access") as HTMLButtonElement;
const accessStatusEl = document.querySelector("#access-status") as HTMLParagraphElement;
const DISABLED_HOSTS_KEY = "pageNotesDisabledHosts";
const ALL_SITES = "<all_urls>";

let currentPage = null;
let activeTabId = null;
let activeDomain = "";
let domainDisabled = false;

async function hasAllSitesAccess() {
  return chrome.permissions.contains({ origins: [ALL_SITES] });
}

function setOnboardingVisible(visible) {
  onboardingEl.hidden = !visible;
  notesMainEl.hidden = visible;
  notesFooterEl.hidden = visible;
  countEl.hidden = visible;
}

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
    files: ["dist/katex.content.css", "dist/content.css"]
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
    renderComment(note, highlight.note || "No comment");

    item.append(quote, note);
    notesEl.append(item);
  }
}

async function refresh() {
  if (!(await hasAllSitesAccess())) {
    currentPage = null;
    setOnboardingVisible(true);
    return;
  }

  setOnboardingVisible(false);
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

enableAccessButton.addEventListener("click", async () => {
  enableAccessButton.disabled = true;
  accessStatusEl.textContent = "";

  try {
    const granted = await chrome.permissions.request({ origins: [ALL_SITES] });
    if (!granted) {
      accessStatusEl.textContent = "Webpage access was not enabled.";
      return;
    }

    const result = await chrome.runtime.sendMessage({ type: "PAGE_NOTES_ENABLE_ALL_SITES" });
    if (!result?.ok) throw new Error("Unable to register webpage access");
    await refresh();
  } catch {
    accessStatusEl.textContent = "Webpage access could not be enabled.";
  } finally {
    enableAccessButton.disabled = false;
  }
});

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
