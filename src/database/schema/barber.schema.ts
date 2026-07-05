import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const barbersTable = pgTable("barbeiros", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(), // Esse continua unique
  password: varchar("senha", { length: 255 }).notNull(), 
  foto: varchar("foto", { length: 255 }),
  role: varchar("role", { length: 50 }).default("barber"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});