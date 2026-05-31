import { cp, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("dist/fonts", { recursive: true });
const katexCss = await readFile("node_modules/katex/dist/katex.min.css", "utf8");
const contentScriptCss = katexCss.replaceAll(
  "url(fonts/",
  "url(chrome-extension://__MSG_@@extension_id__/dist/fonts/"
);

await writeFile("dist/katex.min.css", katexCss);
await writeFile("dist/katex.content.css", contentScriptCss);
await cp("node_modules/katex/dist/fonts", "dist/fonts", { recursive: true });
