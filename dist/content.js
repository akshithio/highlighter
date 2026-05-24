(() => {
  // src/content.ts
  (() => {
    const STORE_KEY = "pageNotes";
    const DISABLED_HOSTS_KEY = "pageNotesDisabledHosts";
    const HIGHLIGHT_CLASS = "page-notes-highlight";
    const UI_ROOT_CLASS = "page-notes-ui";
    const CONTENT_VERSION = "0.2.2";
    if (window.__pageNotesLoaded === CONTENT_VERSION) return;
    document.querySelectorAll(`.${UI_ROOT_CLASS}`).forEach((node) => node.remove());
    window.__pageNotesLoaded = CONTENT_VERSION;
    const DEFAULT_COLOR = "#fff176";
    const LIGHT_COLORS = [
      "#fff176",
      "#ffd54f",
      "#ffab91",
      "#f48fb1",
      "#ce93d8",
      "#b39ddb",
      "#90caf9",
      "#80deea",
      "#a5d6a7",
      "#c5e1a5",
      "#d7ccc8",
      "#cfd8dc"
    ];
    const DARK_COLORS = [
      "#6f5700",
      "#704000",
      "#6b2d24",
      "#6b2445",
      "#553067",
      "#3f3a78",
      "#294a78",
      "#1f5965",
      "#1f6651",
      "#45611f",
      "#56524a",
      "#45515a"
    ];
    const pageId = location.href.split("#")[0];
    const pageDomain = location.hostname.replace(/^www\./, "");
    let pageData = { highlights: [] };
    let selectedRange = null;
    let activeHighlightId = null;
    let popoverMode = "edit";
    let selectedColor = DEFAULT_COLOR;
    let sideCommentUpdateQueued = false;
    let currentColors = LIGHT_COLORS;
    let paletteOverride = null;
    let dragState = null;
    let sideDragState = null;
    let currentPaletteTheme = "light";
    const SUN_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8.00004 12.6667C10.5774 12.6667 12.6667 10.5774 12.6667 8.00004C12.6667 5.42271 10.5774 3.33337 8.00004 3.33337C5.42271 3.33337 3.33337 5.42271 3.33337 8.00004C3.33337 10.5774 5.42271 12.6667 8.00004 12.6667Z"></path>
    <path d="M7.99996 15.3066C7.63329 15.3066 7.33329 15.0333 7.33329 14.6666V14.6133C7.33329 14.2466 7.63329 13.9466 7.99996 13.9466C8.36663 13.9466 8.66663 14.2466 8.66663 14.6133C8.66663 14.98 8.36663 15.3066 7.99996 15.3066ZM12.76 13.4266C12.5866 13.4266 12.42 13.36 12.2866 13.2333L12.2 13.1466C11.94 12.8866 11.94 12.4666 12.2 12.2066C12.46 11.9466 12.88 11.9466 13.14 12.2066L13.2266 12.2933C13.4866 12.5533 13.4866 12.9733 13.2266 13.2333C13.1 13.36 12.9333 13.4266 12.76 13.4266ZM3.23996 13.4266C3.06663 13.4266 2.89996 13.36 2.76663 13.2333C2.50663 12.9733 2.50663 12.5533 2.76663 12.2933L2.85329 12.2066C3.11329 11.9466 3.53329 11.9466 3.79329 12.2066C4.05329 12.4666 4.05329 12.8866 3.79329 13.1466L3.70663 13.2333C3.57996 13.36 3.40663 13.4266 3.23996 13.4266ZM14.6666 8.66663H14.6133C14.2466 8.66663 13.9466 8.36663 13.9466 7.99996C13.9466 7.63329 14.2466 7.33329 14.6133 7.33329C14.98 7.33329 15.3066 7.63329 15.3066 7.99996C15.3066 8.36663 15.0333 8.66663 14.6666 8.66663ZM1.38663 8.66663H1.33329C0.966626 8.66663 0.666626 8.36663 0.666626 7.99996C0.666626 7.63329 0.966626 7.33329 1.33329 7.33329C1.69996 7.33329 2.02663 7.63329 2.02663 7.99996C2.02663 8.36663 1.75329 8.66663 1.38663 8.66663ZM12.6733 3.99329C12.5 3.99329 12.3333 3.92663 12.2 3.79996C11.94 3.53996 11.94 3.11996 12.2 2.85996L12.2866 2.77329C12.5466 2.51329 12.9666 2.51329 13.2266 2.77329C13.4866 3.03329 13.4866 3.45329 13.2266 3.71329L13.14 3.79996C13.0133 3.92663 12.8466 3.99329 12.6733 3.99329ZM3.32663 3.99329C3.15329 3.99329 2.98663 3.92663 2.85329 3.79996L2.76663 3.70663C2.50663 3.44663 2.50663 3.02663 2.76663 2.76663C3.02663 2.50663 3.44663 2.50663 3.70663 2.76663L3.79329 2.85329C4.05329 3.11329 4.05329 3.53329 3.79329 3.79329C3.66663 3.92663 3.49329 3.99329 3.32663 3.99329ZM7.99996 2.02663C7.63329 2.02663 7.33329 1.75329 7.33329 1.38663V1.33329C7.33329 0.966626 7.63329 0.666626 7.99996 0.666626C8.36663 0.666626 8.66663 0.966626 8.66663 1.33329C8.66663 1.69996 8.36663 2.02663 7.99996 2.02663Z"></path>
  </svg>`;
    const MOON_ICON = `<svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M14.3533 10.62C14.2466 10.44 13.9466 10.16 13.1999 10.2933C12.7866 10.3667 12.3666 10.4 11.9466 10.38C10.3933 10.3133 8.98659 9.6 8.00659 8.5C7.13993 7.53333 6.60659 6.27333 6.59993 4.91333C6.59993 4.15333 6.74659 3.42 7.04659 2.72666C7.33993 2.05333 7.13326 1.7 6.98659 1.55333C6.83326 1.4 6.47326 1.18666 5.76659 1.48C3.03993 2.62666 1.35326 5.36 1.55326 8.28666C1.75326 11.04 3.68659 13.3933 6.24659 14.28C6.85993 14.4933 7.50659 14.62 8.17326 14.6467C8.27993 14.6533 8.38659 14.66 8.49326 14.66C10.7266 14.66 12.8199 13.6067 14.1399 11.8133C14.5866 11.1933 14.4666 10.8 14.3533 10.62Z"></path>
  </svg>`;
    const toolbar = document.createElement("div");
    toolbar.className = `page-notes-toolbar ${UI_ROOT_CLASS}`;
    toolbar.hidden = true;
    const highlightButton = document.createElement("button");
    highlightButton.type = "button";
    highlightButton.className = "page-notes-icon-button";
    highlightButton.title = "Highlight";
    highlightButton.setAttribute("aria-label", "Highlight");
    highlightButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 11l-6 6v3h9l3-3"></path>
      <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"></path>
    </svg>
  `;
    const commentButton = document.createElement("button");
    commentButton.type = "button";
    commentButton.className = "page-notes-icon-button";
    commentButton.title = "Comment";
    commentButton.setAttribute("aria-label", "Comment");
    commentButton.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  `;
    toolbar.append(highlightButton, commentButton);
    const popover = document.createElement("div");
    popover.className = `page-notes-popover ${UI_ROOT_CLASS}`;
    popover.hidden = true;
    const sideRail = document.createElement("div");
    sideRail.className = `page-notes-side-rail ${UI_ROOT_CLASS}`;
    const popoverTitle = document.createElement("div");
    popoverTitle.className = "page-notes-popover-title";
    const popoverHeader = document.createElement("div");
    popoverHeader.className = "page-notes-popover-header";
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.className = "page-notes-theme-button";
    themeButton.setAttribute("aria-label", "Switch highlight palette");
    const noteInput = document.createElement("textarea");
    noteInput.placeholder = "Write a note...";
    const popoverActions = document.createElement("div");
    popoverActions.className = "page-notes-popover-actions";
    const colorMenu = document.createElement("div");
    colorMenu.className = "page-notes-color-menu";
    const colorButton = document.createElement("button");
    colorButton.type = "button";
    colorButton.className = "page-notes-color-button";
    colorButton.title = "Highlight color";
    colorButton.setAttribute("aria-label", "Highlight color");
    const colorOptions = document.createElement("div");
    colorOptions.className = "page-notes-color-options";
    colorOptions.hidden = true;
    colorMenu.append(colorButton, colorOptions);
    function setIconButton(button, label, svg) {
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = svg;
    }
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "page-notes-action-icon-button page-notes-danger";
    setIconButton(
      deleteButton,
      "Delete",
      `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16"></path>
      <path d="M10 11v6"></path>
      <path d="M14 11v6"></path>
      <path d="M6 7l1 14h10l1-14"></path>
      <path d="M9 7V4h6v3"></path>
    </svg>`
    );
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "page-notes-action-icon-button";
    setIconButton(
      saveButton,
      "Save",
      `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>`
    );
    popoverActions.append(colorMenu, deleteButton, saveButton);
    popoverHeader.append(popoverTitle, themeButton);
    popover.append(popoverHeader, noteInput, popoverActions);
    document.documentElement.append(toolbar, popover, sideRail);
    popoverTitle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      dragState = { startX: event.clientX, startY: event.clientY, startLeft: popover.offsetLeft, startTop: popover.offsetTop };
      popover.setPointerCapture(event.pointerId);
    });
    document.addEventListener("pointermove", (event) => {
      if (!dragState) return;
      popover.style.left = `${dragState.startLeft + event.clientX - dragState.startX}px`;
      popover.style.top = `${dragState.startTop + event.clientY - dragState.startY}px`;
    });
    document.addEventListener("pointerup", (event) => {
      if (!dragState) return;
      dragState = null;
      popover.releasePointerCapture(event.pointerId);
      if (activeHighlightId) {
        const highlight = getHighlight(activeHighlightId);
        if (highlight) {
          highlight.popoverLeft = popover.offsetLeft;
          highlight.popoverTop = popover.offsetTop;
          savePage();
        }
      }
    });
    toolbar.addEventListener("pointerdown", (event) => {
      event.preventDefault();
    });
    function uid() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    }
    function parseRgb(value) {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(",").map((part) => Number.parseFloat(part.trim()));
      if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return null;
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length >= 4 ? parts[3] : 1
      };
    }
    function luminance(color) {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    }
    function getPageBackground() {
      const candidates = [document.body, document.documentElement].filter(Boolean);
      for (const element of candidates) {
        const color = parseRgb(getComputedStyle(element).backgroundColor);
        if (color && color.a > 0.05) return color;
      }
      return null;
    }
    function usesDarkPageTheme() {
      const background = getPageBackground();
      if (background) return luminance(background) < 0.38;
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches || false;
    }
    function renderColorOptions() {
      colorOptions.textContent = "";
      for (const color of currentColors) {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "page-notes-color-option";
        option.dataset.color = color;
        option.title = color;
        option.setAttribute("aria-label", `Use ${color}`);
        option.style.setProperty("--page-notes-color", color);
        option.style.setProperty("background-color", color, "important");
        colorOptions.append(option);
      }
    }
    function updateThemeButton() {
      const isDark = currentPaletteTheme === "dark";
      themeButton.innerHTML = isDark ? MOON_ICON : SUN_ICON;
      themeButton.title = isDark ? "Dark palette" : "Light palette";
      themeButton.setAttribute("aria-label", isDark ? "Switch to light highlight palette" : "Switch to dark highlight palette");
      themeButton.dataset.theme = currentPaletteTheme;
    }
    function syncPaletteWithPage() {
      const nextTheme = paletteOverride || (usesDarkPageTheme() ? "dark" : "light");
      const nextColors = nextTheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
      if (nextColors === currentColors && colorOptions.childElementCount) return;
      currentPaletteTheme = nextTheme;
      currentColors = nextColors;
      renderColorOptions();
      updateThemeButton();
    }
    syncPaletteWithPage();
    function canUseStorage() {
      return Boolean(chrome?.runtime?.id && chrome.storage?.local);
    }
    async function isDomainDisabled() {
      if (!canUseStorage() || !pageDomain) return false;
      try {
        const result = await chrome.storage.local.get({ [DISABLED_HOSTS_KEY]: [] });
        return result[DISABLED_HOSTS_KEY].includes(pageDomain);
      } catch {
        return false;
      }
    }
    function getStore() {
      if (!canUseStorage()) return Promise.resolve({});
      return chrome.storage.local.get({ [STORE_KEY]: {} }).then((result) => result[STORE_KEY]).catch(() => ({}));
    }
    async function loadPage() {
      const store = await getStore();
      pageData = store[pageId] || { highlights: [] };
    }
    async function savePage() {
      if (!canUseStorage()) return;
      const store = await getStore();
      if (pageData.highlights.length) {
        store[pageId] = pageData;
      } else {
        delete store[pageId];
      }
      await chrome.storage.local.set({ [STORE_KEY]: store }).catch(() => {
      });
    }
    function isIgnoredNode(node) {
      const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      return Boolean(
        element && element.closest(
          [
            `.${UI_ROOT_CLASS}`,
            "script",
            "style",
            "textarea",
            "input",
            "select",
            "button",
            "iframe",
            "canvas",
            "svg",
            "[contenteditable='true']"
          ].join(",")
        )
      );
    }
    function getTextNodes(root = document.body) {
      const nodes = [];
      if (!root) return nodes;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim() || isIgnoredNode(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
      return nodes;
    }
    function getDocumentTextMap() {
      let text = "";
      const map = [];
      for (const node of getTextNodes()) {
        const start = text.length;
        text += node.nodeValue;
        const end = text.length;
        map.push({ node, start, end });
      }
      return { text, map };
    }
    function getRangeOffsets(range) {
      const { map } = getDocumentTextMap();
      let start = null;
      let end = null;
      for (const item of map) {
        if (item.node === range.startContainer) {
          start = item.start + range.startOffset;
        }
        if (item.node === range.endContainer) {
          end = item.start + range.endOffset;
        }
      }
      return start === null || end === null ? null : { start, end };
    }
    function makeAnchor(range, note) {
      const offsets = getRangeOffsets(range);
      if (!offsets || offsets.end <= offsets.start) return null;
      const { text } = getDocumentTextMap();
      const quote = text.slice(offsets.start, offsets.end);
      return {
        id: uid(),
        text: quote,
        prefix: text.slice(Math.max(0, offsets.start - 80), offsets.start),
        suffix: text.slice(offsets.end, offsets.end + 80),
        note,
        color: selectedColor,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    function scoreAnchor(text, index, anchor) {
      let score = 0;
      const before = text.slice(Math.max(0, index - anchor.prefix.length), index);
      const after = text.slice(index + anchor.text.length, index + anchor.text.length + anchor.suffix.length);
      if (anchor.prefix && before.endsWith(anchor.prefix)) score += anchor.prefix.length;
      if (anchor.suffix && after.startsWith(anchor.suffix)) score += anchor.suffix.length;
      return score;
    }
    function findAnchorRange(anchor) {
      const { text, map } = getDocumentTextMap();
      let bestIndex = -1;
      let bestScore = -1;
      let cursor = 0;
      while (cursor <= text.length) {
        const index = text.indexOf(anchor.text, cursor);
        if (index === -1) break;
        const score = scoreAnchor(text, index, anchor);
        if (score > bestScore) {
          bestIndex = index;
          bestScore = score;
        }
        cursor = index + Math.max(1, anchor.text.length);
      }
      if (bestIndex === -1) return null;
      const startOffset = bestIndex;
      const endOffset = bestIndex + anchor.text.length;
      const startItem = map.find((item) => startOffset >= item.start && startOffset <= item.end);
      const endItem = map.find((item) => endOffset >= item.start && endOffset <= item.end);
      if (!startItem || !endItem) return null;
      const range = document.createRange();
      range.setStart(startItem.node, startOffset - startItem.start);
      range.setEnd(endItem.node, endOffset - endItem.start);
      return range;
    }
    function textNodesInRange(range) {
      const nodes = [];
      const ancestor = range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? range.commonAncestorContainer.parentNode : range.commonAncestorContainer;
      const walker = document.createTreeWalker(ancestor, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (isIgnoredNode(node) || !range.intersectsNode(node)) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      while (walker.nextNode()) nodes.push(walker.currentNode);
      return nodes;
    }
    function wrapRange(range, highlight) {
      const nodes = textNodesInRange(range);
      for (const node of nodes) {
        const nodeRange = document.createRange();
        nodeRange.selectNodeContents(node);
        const start = node === range.startContainer ? range.startOffset : 0;
        const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
        if (start >= end) continue;
        nodeRange.setStart(node, start);
        nodeRange.setEnd(node, end);
        const marker = document.createElement("span");
        marker.className = HIGHLIGHT_CLASS;
        marker.dataset.pageNotesId = highlight.id;
        marker.dataset.hasNote = String(Boolean(highlight.note));
        marker.style.setProperty("--page-notes-highlight-color", highlight.color || DEFAULT_COLOR);
        marker.style.setProperty("background-color", highlight.color || DEFAULT_COLOR, "important");
        try {
          nodeRange.surroundContents(marker);
        } catch {
          const contents = nodeRange.extractContents();
          marker.append(contents);
          nodeRange.insertNode(marker);
        }
      }
    }
    function removeHighlightNodes(id) {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}[data-page-notes-id="${CSS.escape(id)}"]`).forEach((node) => {
        node.replaceWith(document.createTextNode(node.textContent));
      });
      document.body.normalize();
    }
    function getFirstHighlightNode(id) {
      return document.querySelector(`.${HIGHLIGHT_CLASS}[data-page-notes-id="${CSS.escape(id)}"]`);
    }
    function updateHighlightNoteState(id, hasNote) {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}[data-page-notes-id="${CSS.escape(id)}"]`).forEach((node) => {
        node.dataset.hasNote = String(hasNote);
      });
    }
    function updateHighlightColor(id, color) {
      document.querySelectorAll(`.${HIGHLIGHT_CLASS}[data-page-notes-id="${CSS.escape(id)}"]`).forEach((node) => {
        node.style.setProperty("--page-notes-highlight-color", color);
        node.style.setProperty("background-color", color, "important");
      });
    }
    function restoreHighlights() {
      for (const highlight of pageData.highlights) {
        const range = findAnchorRange(highlight);
        if (range) wrapRange(range, highlight);
      }
    }
    function showSideComments() {
      sideRail.textContent = "";
      const notes = pageData.highlights.map((highlight) => ({ highlight, marker: getFirstHighlightNode(highlight.id) })).filter((item) => item.highlight.note && item.marker).map((item) => ({ ...item, rect: item.marker.getBoundingClientRect() })).filter((item) => item.rect.bottom > 0 && item.rect.top < window.innerHeight).sort((a, b) => a.rect.top - b.rect.top);
      let nextTop = 12;
      for (const { highlight, rect } of notes) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "page-notes-side-card";
        card.dataset.pageNotesId = highlight.id;
        card.style.setProperty("--page-notes-highlight-color", highlight.color || DEFAULT_COLOR);
        card.textContent = highlight.note;
        const hasCustomPosition = typeof highlight.sideOffsetLeft === "number" && typeof highlight.sideOffsetTop === "number";
        if (hasCustomPosition) {
          card.style.top = `${rect.top + highlight.sideOffsetTop}px`;
          card.style.left = `${rect.left + highlight.sideOffsetLeft}px`;
          card.style.right = "auto";
        } else {
          card.style.top = `${Math.max(rect.top, nextTop)}px`;
          card.style.left = "";
          card.style.right = "12px";
        }
        card.addEventListener("pointerdown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          hideToolbar();
          hidePopover();
          sideDragState = {
            id: highlight.id,
            card,
            startX: event.clientX,
            startY: event.clientY,
            startLeft: card.offsetLeft,
            startTop: card.offsetTop,
            moved: false
          };
          card.classList.add("page-notes-side-card-dragging");
          card.setPointerCapture(event.pointerId);
        });
        card.addEventListener("pointermove", (event) => {
          if (!sideDragState || sideDragState.card !== card) return;
          const nextLeft = Math.min(
            Math.max(12, sideDragState.startLeft + event.clientX - sideDragState.startX),
            Math.max(12, window.innerWidth - card.offsetWidth - 12)
          );
          const nextTop2 = Math.min(
            Math.max(12, sideDragState.startTop + event.clientY - sideDragState.startY),
            Math.max(12, window.innerHeight - card.offsetHeight - 12)
          );
          card.style.left = `${nextLeft}px`;
          card.style.right = "auto";
          card.style.top = `${nextTop2}px`;
          sideDragState.moved = sideDragState.moved || Math.abs(event.clientY - sideDragState.startY) > 3 || Math.abs(event.clientX - sideDragState.startX) > 3;
        });
        card.addEventListener("pointerup", async (event) => {
          if (!sideDragState || sideDragState.card !== card) return;
          const state = sideDragState;
          sideDragState = null;
          card.classList.remove("page-notes-side-card-dragging");
          card.releasePointerCapture(event.pointerId);
          const current = getHighlight(state.id);
          if (!current) return;
          if (!state.moved) {
            showPopover(state.id, card.getBoundingClientRect());
            return;
          }
          const marker = getFirstHighlightNode(current.id);
          const markerRect = marker?.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          if (!markerRect) return;
          current.sideOffsetLeft = cardRect.left - markerRect.left;
          current.sideOffsetTop = cardRect.top - markerRect.top;
          delete current.sideLeft;
          delete current.sideTop;
          await savePage();
        });
        card.addEventListener("pointercancel", () => {
          if (!sideDragState || sideDragState.card !== card) return;
          sideDragState = null;
          card.classList.remove("page-notes-side-card-dragging");
        });
        sideRail.append(card);
        nextTop = card.offsetTop + card.offsetHeight + 8;
      }
    }
    function scheduleSideComments() {
      if (sideCommentUpdateQueued) return;
      sideCommentUpdateQueued = true;
      window.requestAnimationFrame(() => {
        sideCommentUpdateQueued = false;
        showSideComments();
      });
    }
    function hideToolbar({ keepSelection = false } = {}) {
      toolbar.hidden = true;
      if (!keepSelection) selectedRange = null;
    }
    function hidePopover() {
      popover.hidden = true;
      activeHighlightId = null;
      popoverMode = "edit";
      colorOptions.hidden = true;
    }
    function removePageNotesUi() {
      for (const highlight of pageData.highlights) removeHighlightNodes(highlight.id);
      document.querySelectorAll(`.${UI_ROOT_CLASS}`).forEach((node) => node.remove());
      window.__pageNotesLoaded = "";
    }
    function placeElement(element, rect) {
      const spacing = 8;
      const width = element.offsetWidth || 220;
      const height = element.offsetHeight || 44;
      const left = Math.min(Math.max(spacing, rect.left), window.innerWidth - width - spacing);
      const topCandidate = rect.top - height - spacing;
      const top = topCandidate > spacing ? topCandidate : Math.min(rect.bottom + spacing, window.innerHeight - height - spacing);
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    }
    function showToolbarForSelection() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        hideToolbar({ keepSelection: !popover.hidden });
        return;
      }
      const range = selection.getRangeAt(0);
      if (isIgnoredNode(range.commonAncestorContainer) || !range.toString().trim()) {
        hideToolbar({ keepSelection: !popover.hidden });
        return;
      }
      selectedRange = range.cloneRange();
      toolbar.hidden = false;
      placeElement(toolbar, range.getBoundingClientRect());
    }
    async function createHighlight(note = "") {
      if (!selectedRange) return;
      const anchor = makeAnchor(selectedRange, note.trim());
      if (!anchor) return;
      const newText = anchor.text;
      for (const existing of pageData.highlights) {
        if (newText.includes(existing.text)) {
          removeHighlightNodes(existing.id);
        }
      }
      pageData.highlights = pageData.highlights.filter((h) => !newText.includes(h.text));
      if (pageData.highlights.some((h) => h.text.includes(newText))) {
        window.getSelection()?.removeAllRanges();
        hideToolbar();
        return;
      }
      pageData.highlights.push(anchor);
      wrapRange(selectedRange, anchor);
      await savePage();
      showSideComments();
      window.getSelection()?.removeAllRanges();
      hideToolbar();
    }
    function getHighlight(id) {
      return pageData.highlights.find((highlight) => highlight.id === id);
    }
    function showPopover(id, rect) {
      const highlight = getHighlight(id);
      if (!highlight) return;
      activeHighlightId = id;
      popoverMode = "edit";
      selectedColor = highlight.color || DEFAULT_COLOR;
      colorButton.style.setProperty("--page-notes-color", selectedColor);
      colorButton.style.setProperty("background-color", selectedColor, "important");
      colorOptions.hidden = true;
      popoverTitle.textContent = "Edit comment";
      noteInput.value = highlight.note || "";
      setIconButton(
        deleteButton,
        "Delete",
        `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M6 7l1 14h10l1-14"></path>
        <path d="M9 7V4h6v3"></path>
      </svg>`
      );
      deleteButton.classList.add("page-notes-danger");
      setIconButton(
        saveButton,
        "Save",
        `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>`
      );
      popover.hidden = false;
      if (highlight.popoverLeft != null && highlight.popoverTop != null) {
        popover.style.left = `${highlight.popoverLeft}px`;
        popover.style.top = `${highlight.popoverTop}px`;
      } else {
        placeElement(popover, rect);
      }
      noteInput.focus();
    }
    function showNewNotePopover(rect) {
      if (!selectedRange) return;
      popoverMode = "create";
      activeHighlightId = null;
      syncPaletteWithPage();
      selectedColor = currentColors[0] || DEFAULT_COLOR;
      colorButton.style.setProperty("--page-notes-color", selectedColor);
      colorButton.style.setProperty("background-color", selectedColor, "important");
      colorOptions.hidden = true;
      popoverTitle.textContent = "Add comment";
      noteInput.value = "";
      setIconButton(
        deleteButton,
        "Cancel",
        `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>`
      );
      deleteButton.classList.remove("page-notes-danger");
      setIconButton(
        saveButton,
        "Save",
        `<svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6 9 17l-5-5"></path>
      </svg>`
      );
      popover.hidden = false;
      hideToolbar({ keepSelection: true });
      placeElement(popover, rect);
      noteInput.focus();
    }
    highlightButton.addEventListener("click", () => {
      syncPaletteWithPage();
      selectedColor = currentColors[0] || DEFAULT_COLOR;
      createHighlight("");
    });
    commentButton.addEventListener("click", () => {
      if (!selectedRange) return;
      showNewNotePopover(selectedRange.getBoundingClientRect());
    });
    saveButton.addEventListener("click", async () => {
      if (popoverMode === "create") {
        await createHighlight(noteInput.value);
        if (pageData.highlights.length > 0) {
          const last = pageData.highlights[pageData.highlights.length - 1];
          last.popoverLeft = popover.offsetLeft;
          last.popoverTop = popover.offsetTop;
          await savePage();
        }
        hidePopover();
        return;
      }
      const highlight = activeHighlightId ? getHighlight(activeHighlightId) : null;
      if (!highlight) return;
      highlight.note = noteInput.value.trim();
      highlight.color = selectedColor;
      updateHighlightNoteState(highlight.id, Boolean(highlight.note));
      updateHighlightColor(highlight.id, selectedColor);
      await savePage();
      showSideComments();
      hidePopover();
    });
    colorButton.addEventListener("click", () => {
      colorOptions.hidden = !colorOptions.hidden;
    });
    themeButton.addEventListener("click", () => {
      paletteOverride = currentPaletteTheme === "dark" ? "light" : "dark";
      syncPaletteWithPage();
      if (popoverMode === "create") {
        selectedColor = currentColors[0] || DEFAULT_COLOR;
        colorButton.style.setProperty("--page-notes-color", selectedColor);
        colorButton.style.setProperty("background-color", selectedColor, "important");
      }
    });
    colorOptions.addEventListener("click", async (event) => {
      const option = event.target?.closest?.(".page-notes-color-option");
      if (!option) return;
      selectedColor = option.dataset.color || DEFAULT_COLOR;
      colorButton.style.setProperty("--page-notes-color", selectedColor);
      colorButton.style.setProperty("background-color", selectedColor, "important");
      colorOptions.hidden = true;
      if (popoverMode !== "edit" || !activeHighlightId) return;
      const highlight = getHighlight(activeHighlightId);
      if (!highlight) return;
      highlight.color = selectedColor;
      updateHighlightColor(highlight.id, selectedColor);
      await savePage();
      showSideComments();
    });
    deleteButton.addEventListener("click", async () => {
      if (popoverMode === "create") {
        hidePopover();
        return;
      }
      if (!activeHighlightId) return;
      pageData.highlights = pageData.highlights.filter((highlight) => highlight.id !== activeHighlightId);
      removeHighlightNodes(activeHighlightId);
      await savePage();
      showSideComments();
      hidePopover();
    });
    document.addEventListener("selectionchange", () => {
      window.requestAnimationFrame(showToolbarForSelection);
    });
    const themeObserver = new MutationObserver(syncPaletteWithPage);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "color-scheme"]
    });
    if (document.body) {
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme", "color-scheme"]
      });
    }
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", syncPaletteWithPage);
    document.addEventListener("pointerdown", (event) => {
      const target = event.target;
      const marker = target?.closest?.(`.${HIGHLIGHT_CLASS}`);
      const insideUi = target?.closest?.(`.${UI_ROOT_CLASS}`);
      if (marker) {
        event.preventDefault();
        hideToolbar();
        showPopover(marker.dataset.pageNotesId, marker.getBoundingClientRect());
        return;
      }
      const sideCard = target?.closest?.(".page-notes-side-card");
      if (sideCard) {
        event.preventDefault();
        hideToolbar();
        return;
      }
      if (!insideUi) hidePopover();
    });
    window.addEventListener("scroll", scheduleSideComments, { passive: true });
    window.addEventListener("resize", scheduleSideComments);
    if (chrome?.runtime?.id) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.type === "PAGE_NOTES_GET") {
          sendResponse({ pageId, highlights: pageData.highlights });
          return false;
        }
        if (message?.type === "PAGE_NOTES_CLEAR") {
          for (const highlight of pageData.highlights) removeHighlightNodes(highlight.id);
          pageData = { highlights: [] };
          savePage().then(() => {
            showSideComments();
            sendResponse({ ok: true });
          }).catch(() => sendResponse({ ok: false }));
          return true;
        }
        if (message?.type === "PAGE_NOTES_DISABLE_HOST") {
          removePageNotesUi();
          sendResponse({ ok: true });
          return false;
        }
        if (message?.type === "PAGE_NOTES_CONTEXT_HIGHLIGHT" || message?.type === "PAGE_NOTES_CONTEXT_COMMENT") {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            sendResponse({ ok: false });
            return false;
          }
          selectedRange = selection.getRangeAt(0).cloneRange();
          if (message.type === "PAGE_NOTES_CONTEXT_COMMENT") {
            showNewNotePopover(selectedRange.getBoundingClientRect());
            sendResponse({ ok: true });
            return false;
          }
          syncPaletteWithPage();
          selectedColor = currentColors[0] || DEFAULT_COLOR;
          createHighlight("").then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
          return true;
        }
        return false;
      });
    }
    isDomainDisabled().then((disabled) => {
      if (disabled) {
        removePageNotesUi();
        return null;
      }
      return loadPage().then(() => {
        restoreHighlights();
        showSideComments();
      });
    }).catch(() => {
    });
  })();
})();
