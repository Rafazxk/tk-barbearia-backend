import { defineConfig } from "drizzle-kit";



if (!process.env.DATABASE_URL) {
  throw new Error("Drizzle Config: DATABASE_URL não foi encontrada no process.env");
}

export default defineConfig({
  out: "./drizzle",          
  schema: "./src/database/schema.ts",
  dialect: "postgresql",     
  dbCredentials: {
    url: process.env.DATABASE_URL!, 
  },
});