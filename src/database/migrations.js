import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import "dotenv/config";
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool);
async function main() {
    console.log(" Aplicando migrations no banco de produção...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log(" Migrations aplicadas com sucesso!");
    await pool.end();
    process.exit(0);
}
main().catch((err) => {
    console.error(" Erro ao aplicar migrations:", err);
    process.exit(1);
});
//# sourceMappingURL=migrations.js.map