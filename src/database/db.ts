import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";

import * as schema from "./schema/index.js";
import * as relations from "./relations/index.js";

console.log(Object.keys(schema));
// Apenas registra as relations


dotenv.config();

const drizzleSchema = {
  ...schema,
  ...relations,
};


if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não foi encontrada nas variáveis de ambiente (.env)");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

  export const db = drizzle(pool, {
  schema: drizzleSchema,
});