import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  out: "./drizzle",          
  schema: "./src/database/schema/*",
  dialect: "postgresql",     
  dbCredentials: {
    url: "DATABASE_URL",
  },
});