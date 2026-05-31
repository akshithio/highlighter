import renderMathInElement from "katex/contrib/auto-render";

export function renderComment(element: HTMLElement, text: string) {
  element.textContent = text;
  if (element.ownerDocument.compatMode !== "CSS1Compat") return;

  renderMathInElement(element, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false }
    ],
    throwOnError: false,
    strict: "ignore"
  });
}
