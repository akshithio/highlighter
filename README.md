<p align="center">
  <img src="./assets/highlighter.svg" alt="highlighter icon" width="72">
</p>

# highlighter

A small browser extension for highlighting text and keeping private comments on webpages. Notes are stored in the browser's local extension storage, so there is no account or server.

<p>
  <a href="https://example.com/highlighter-chrome.zip">Download now for Chrome</a>
</p>

![highlighter project demo](./assets/highlighter-demo.png)

## Use

Select text on a webpage, then choose Highlight or Comment from the small toolbar. Click any highlight to edit its comment, change its color, or delete it. Comments support LaTeX with `$...$` for inline math and `$$...$$` for display math. The extension popup shows all highlights for the current page, can clear them, and can disable highlighter on the current domain.

## Permissions

The extension does not request webpage access during installation. Open the extension once and choose Allow webpage access to enable the toolbar and restore saved highlights automatically across sites. Notes and highlights remain in local browser storage and are not sent to a server.

## Arc

Arc desktop supports Chrome extensions. Install the published extension from the Chrome Web Store, or load this folder locally from `arc://extensions` with Developer mode enabled.

## Privacy

Privacy policy: https://akshith.io/highlighter-privacy-policy

## License

MIT

## Development

Runtime files live in `dist/`. Source files live in `src/` and are written in TypeScript, with Tailwind CSS entry points in `src/styles/`.

After installing dependencies, rebuild with:

```sh
npm run build
```

Build the Chrome Web Store upload package with:

```sh
npm run package
```

The repo also installs a pre-commit hook with `npm install`. When committing, it rebuilds `highlighter-chrome.zip`, stages it, stages any rebuilt `dist/` files, and continues with the same commit message.
<br />

&nbsp;<img src="./akshithio/light-logo.png#gh-dark-mode-only" alt="Akshith Garapati's Personal Icon - Doodle of Two Eyes Dark Mode" width ="24px" align = "left" /><img src="./akshithio/dark-logo.png#gh-light-mode-only" alt="Akshith Garapati's Personal Icon - Doodle of Two Eyes Dark Mode" width ="24px" align = "left" /> happy note-taking! 📝 - may 2026 
