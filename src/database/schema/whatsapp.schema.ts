import { pgTable, serial, integer, boolean, text, timestamp } from "drizzle-orm/pg-core";
import { barbersTable } from "./barber.schema.js";

export const whatsappSettingsTable = pgTable("whatsapp_settings", {
  id: serial("id").primaryKey(),
  // 🔹 Usa 'integer' para referenciar o serial da 'barbersTable'
  barberId: integer("barber_id")
    .references(() => barbersTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  receiveAdminNotifications: boolean("receive_admin_notifications").default(false).notNull(),
  sendClientNotifications: boolean("send_client_notifications").default(false).notNull(),
  welcomeMessageTemplate: text("welcome_message_template")
    .default("Olá {cliente}, seu agendamento para {servico} foi confirmado para o dia {data} às {hora}!")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});