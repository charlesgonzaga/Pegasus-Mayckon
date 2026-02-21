import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serve os arquivos estáticos do frontend buildado (produção).
 * dist/index.js → import.meta.dirname = /app/dist
 * Arquivos do frontend buildados em: /app/dist/public/
 */
export function serveStatic(app: Express) {
    const distPath = path.resolve(import.meta.dirname, "public");

    if (!fs.existsSync(distPath)) {
        console.error(
            `Diretório de build não encontrado: ${distPath}, certifique-se de buildar o frontend primeiro`
        );
    }

    app.use(express.static(distPath));

    // Redireciona para index.html caso o arquivo não seja encontrado (SPA fallback)
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
