
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  server: { watch: { ignored: ["**/work/**", "**/playwright-report/**", "**/test-results/**", "**/node_modules/.cache/**"] } },
  plugins: [
    {
      name: "kurio-preload-app-shell",
      transformIndexHtml: {
        order: "post",
        handler(_html, context) {
          if (!context.bundle) return [];
          const bundle = context.bundle;
          const files = new Set<string>();
          const visit = (name: string, target = files) => {
            if (target.has(name)) return;
            const chunk = bundle[name];
            if (!chunk || chunk.type !== "chunk") return;
            target.add(name);
            chunk.imports.forEach(imported => visit(imported, target));
          };
          for (const chunk of Object.values(bundle)) {
            if (chunk.type === "chunk" && chunk.facadeModuleId?.replaceAll("\\", "/").endsWith("/src/App.tsx")) visit(chunk.fileName);
          }
          // modulepreload fetches/parses without evaluating modules. Engine.IO
          // still executes only after MSW starts, as required by main.tsx.
          const tags = [...files].map(file => ({ tag: "link", attrs: { rel: "modulepreload", crossorigin: "", href: `/${file}` }, injectTo: "head" as const }));
          const detail = new Set<string>();
          for (const chunk of Object.values(bundle)) {
            if (chunk.type === "chunk" && chunk.facadeModuleId?.replaceAll("\\", "/").includes("/src/routes/nfts.$nftId.tsx")) visit(chunk.fileName, detail);
          }
          const paths = [...detail].filter(file => !files.has(file)).map(file => `/${file}`);
          return [...tags, { tag: "script", children: `if(location.pathname.startsWith('/nfts/')){for(const href of ${JSON.stringify(paths)}){const link=document.createElement('link');link.rel='modulepreload';link.crossOrigin='';link.href=href;document.head.append(link)}}`, injectTo: "head" as const }];
        },
      },
    },
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
