/**
 * Copia os dados de um banco SQLite (o `prod.db` que rodava antes) para o
 * Postgres apontado por DATABASE_URL.
 *
 *   node scripts/sqlite-para-postgres.mjs caminho/para/prod.db
 *
 * O Postgres precisa estar com as migrações aplicadas (`prisma migrate deploy`)
 * e vazio — o script para se encontrar dados, para nunca duplicar nada. Ele
 * só lê o arquivo SQLite; nada é alterado na origem.
 */
import { argv, env, exit } from "node:process";

import Database from "better-sqlite3";
import { Client } from "pg";

// Ordem importa: cada tabela entra depois daquelas de que depende.
const TABLES = [
  { name: "User", booleans: [], dates: ["createdAt", "updatedAt"], json: [] },
  { name: "Account", booleans: [], dates: ["createdAt", "updatedAt"], json: [] },
  { name: "AccountMember", booleans: [], dates: ["createdAt"], json: [] },
  {
    name: "AccountInvite",
    booleans: [],
    dates: ["expiresAt", "acceptedAt", "createdAt"],
    json: [],
  },
  {
    name: "Property",
    booleans: ["showCover", "published"],
    dates: ["publishedAt", "createdAt", "updatedAt"],
    json: ["translations"],
  },
  {
    name: "GuideSection",
    booleans: ["enabled"],
    dates: ["createdAt", "updatedAt"],
    json: ["content"],
  },
  { name: "Recommendation", booleans: [], dates: ["createdAt"], json: [] },
  { name: "GuestFeedback", booleans: [], dates: ["createdAt"], json: [] },
  {
    name: "CalendarFeed",
    booleans: [],
    dates: ["lastSyncedAt", "createdAt", "updatedAt"],
    json: [],
  },
  {
    name: "CalendarEvent",
    booleans: [],
    dates: ["startDate", "endDate", "createdAt", "updatedAt"],
    json: [],
  },
];

/** SQLite guarda data como texto ISO ou número (ms), e booleano como 0/1. */
function toDate(value) {
  if (value === null || value === undefined) return null;
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new Error(`Data inválida: ${value}`);
  return date;
}

function convert(row, { booleans, dates, json }) {
  const converted = { ...row };
  for (const column of dates) {
    if (column in converted) converted[column] = toDate(converted[column]);
  }
  for (const column of booleans) {
    if (column in converted && converted[column] !== null) {
      converted[column] = Boolean(converted[column]);
    }
  }
  for (const column of json) {
    // O driver do Postgres serializa objetos; o texto do SQLite já é JSON.
    if (column in converted && typeof converted[column] === "string") {
      converted[column] = JSON.parse(converted[column]);
    }
  }
  return converted;
}

async function main() {
  const sqlitePath = argv[2];
  if (!sqlitePath) {
    console.error("Uso: node scripts/sqlite-para-postgres.mjs <arquivo.db>");
    exit(1);
  }
  if (!env.DATABASE_URL?.startsWith("postgres")) {
    console.error("DATABASE_URL precisa apontar para o Postgres de destino.");
    exit(1);
  }

  const sqlite = new Database(sqlitePath, { readonly: true });
  const pg = new Client({ connectionString: env.DATABASE_URL });
  await pg.connect();

  try {
    for (const table of TABLES) {
      const { count } = await pg.query(`SELECT count(*)::int AS count FROM "${table.name}"`)
        .then((result) => result.rows[0]);
      if (count > 0) {
        throw new Error(
          `A tabela "${table.name}" do Postgres já tem ${count} registro(s). ` +
            "Rode a importação em um banco vazio.",
        );
      }
    }

    await pg.query("BEGIN");
    const totals = [];

    for (const table of TABLES) {
      const rows = sqlite.prepare(`SELECT * FROM "${table.name}"`).all();
      for (const row of rows) {
        const data = convert(row, table);
        const columns = Object.keys(data);
        const values = columns.map((column) => data[column]);
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await pg.query(
          `INSERT INTO "${table.name}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }
      totals.push({ tabela: table.name, registros: rows.length });
    }

    await pg.query("COMMIT");

    // Confere no destino, já fora da transação.
    for (const { tabela, registros } of totals) {
      const { rows } = await pg.query(`SELECT count(*)::int AS count FROM "${tabela}"`);
      const destino = rows[0].count;
      const igual = destino === registros;
      console.log(`${igual ? "ok " : "ERRO"} ${tabela}: ${registros} -> ${destino}`);
      if (!igual) throw new Error(`Contagem diferente em ${tabela}`);
    }
    console.log("\nImportação concluída.");
  } catch (error) {
    await pg.query("ROLLBACK").catch(() => {});
    console.error("\nFalhou, nada foi gravado:", error.message);
    exit(1);
  } finally {
    await pg.end();
    sqlite.close();
  }
}

await main();
