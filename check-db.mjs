import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const tables = ['notas', 'clientes', 'certificados', 'download_logs', 'cte_notas', 'cte_download_logs', 'cte_nsu_control', 'agendamentos', 'audit_logs', 'contabilidades', 'settings'];

for (const table of tables) {
  try {
    const [rows] = await conn.execute(`SELECT COUNT(*) as cnt FROM ${table}`);
    console.log(`${table}: ${rows[0].cnt}`);
  } catch (e) {
    console.log(`${table}: ERROR - ${e.message}`);
  }
}

// Check distinct contabilidadeId in notas
const [notasContab] = await conn.execute(`SELECT contabilidadeId, COUNT(*) as cnt FROM notas GROUP BY contabilidadeId`);
console.log('\nNotas por contabilidadeId:', JSON.stringify(notasContab));

// Check distinct clienteId in notas
const [notasCliente] = await conn.execute(`SELECT n.clienteId, c.razaoSocial, COUNT(*) as cnt FROM notas n LEFT JOIN clientes c ON n.clienteId = c.id GROUP BY n.clienteId, c.razaoSocial ORDER BY cnt DESC LIMIT 10`);
console.log('\nNotas por cliente (top 10):', JSON.stringify(notasCliente));

// Check clientes
const [clientesList] = await conn.execute(`SELECT id, cnpj, razaoSocial FROM clientes LIMIT 10`);
console.log('\nClientes:', JSON.stringify(clientesList));

await conn.end();
