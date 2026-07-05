import { relations } from "drizzle-orm";

import { whatsappSettingsTable } from "../schema/whatsapp.schema.js";

import { barbersTable } from "../schema/barber.schema.js";

export const whatsappSettingsRelations = relations(
  whatsappSettingsTable,
  ({ one }) => ({
    barber: one(barbersTable, {
      fields: [whatsappSettingsTable.barberId],
      references: [barbersTable.id],
    }),
  })
);