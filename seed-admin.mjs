import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function main() {
  const email = "lan7@gmail.com";
  const password = "123456";
  const name = "Admin Lan7";
  
  const passwordHash = await bcrypt.hash(password, 10);
  const openId = "admin-local-" + Date.now();
  
  // Check if user already exists
  const existing = await db.execute(
    `SELECT id FROM users WHERE email = '${email}' LIMIT 1`
  );
  
  if (existing[0] && existing[0].length > 0) {
    // Update existing user
    await db.execute(
      `UPDATE users SET passwordHash = '${passwordHash}', role = 'admin', name = '${name}' WHERE email = '${email}'`
    );
    console.log(`Usuário admin atualizado: ${email}`);
  } else {
    // Insert new user
    await db.execute(
      `INSERT INTO users (openId, email, name, passwordHash, role, loginMethod, createdAt, updatedAt, lastSignedIn) VALUES ('${openId}', '${email}', '${name}', '${passwordHash}', 'admin', 'local', NOW(), NOW(), NOW())`
    );
    console.log(`Usuário admin criado: ${email}`);
  }
  
  console.log("Login: " + email);
  console.log("Senha: " + password);
  console.log("Role: admin");
  
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exit(1);
});
