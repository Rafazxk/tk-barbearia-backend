import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";

dotenv.config();

// Se não houver a string de conexão no arquivo .env, o sistema avisa na hora
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi encontrada nas variáveis de ambiente (.env)");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export * from "./schema.js";