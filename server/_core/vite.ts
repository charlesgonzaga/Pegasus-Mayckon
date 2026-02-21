import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

/**
 * Configura o servidor Vite para desenvolvimento (hot reload, HMR, etc).
 * ATENÇÃO: este arquivo usa 'vite' como devDependency.
 * É importado DINAMICAMENTE em index.ts apenas quando NODE_ENV=development,
 * garantindo que nunca seja carregado em produção.
 */
export async function setupVite(app: Express, server: Server) {
  // Import dinâmico: 'vite' é devDependency e não existe em produção
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "../../vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as unknown as string[],
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // Sempre recarrega o arquivo index.html do disco para capturar mudanças
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
