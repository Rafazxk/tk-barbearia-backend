import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const barbersTable = pgTable("barbeiros", {
  id: serial("id").primaryKey(),

  nome: varchar("nome", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  password: varchar("senha", { length: 255 }).notNull(),

  telefone: varchar("telefone", { length: 20 }),

  foto: varchar("foto", { length: 255 }),

  role: varchar("role", { length: 50 }).default("barber"),

  notificacoesNovoAgendamento: boolean("notificacoes_novo_agendamento")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});