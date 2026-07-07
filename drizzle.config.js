import { defineConfig } from "drizzle-kit";
if (!process.env.DATABASE_URL) {
    throw new Error("Drizzle Config: DATABASE_URL não foi encontrada no process.env");
}

export default defineConfig({
    out: "./drizzle",
    schema: "./src/database/index.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
});
//# sourceMappingURL=drizzle.config.js.map