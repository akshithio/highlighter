import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const quirksGuardStart = "// KaTeX's styles don't work properly in quirks mode.";
const quirksGuardEnd = "/**\n * Parse and build an expression";

await build({
  entryPoints: ["src/content.ts", "src/background.ts", "src/popup.ts"],
  bundle: true,
  outdir: "dist",
  format: "iife",
  target: "chrome120",
  plugins: [
    {
      name: "katex-quirks-mode-fallback",
      setup(build) {
        build.onLoad({ filter: /node_modules\/katex\/dist\/katex\.mjs$/ }, async ({ path }) => {
          let contents = await readFile(path, "utf8");
          const start = contents.indexOf(quirksGuardStart);
          const end = contents.indexOf(quirksGuardEnd, start);

          if (start === -1 || end === -1) {
            throw new Error("Unable to locate the KaTeX quirks-mode guard");
          }

          contents = `${contents.slice(0, start)}${contents.slice(end)}`;
          return { contents, loader: "js" };
        });
      }
    }
  ]
});
