/**
 * run-migrations.mjs — Aplica migrations do Drizzle em produção.
 * Usa a API drizzle-orm/mysql2/migrator (sem precisar do drizzle-kit).
 * Os arquivos SQL em /app/drizzle/ são aplicados automaticamente na ordem correta.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("[Migrations] ERRO: DATABASE_URL não definida.");
    process.exit(1);
}

// Log da URL sem expor a senha
const urlSafe = url.replace(/:([^:@]+)@/, ":***@");
console.log("[Migrations] Conectando:", urlSafe);

const db = drizzle({ connection: { uri: url, timezone: "Z" } });

const migrationsFolder = path.resolve(__dirname, "drizzle");
console.log("[Migrations] Pasta:", migrationsFolder);
console.log("[Migrations] Aplicando migrations pendentes...");

await migrate(db, { migrationsFolder });

console.log("[Migrations] ✓ Concluído com sucesso!");
process.exit(0);
