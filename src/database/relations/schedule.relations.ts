import { relations } from "drizzle-orm";

import {
  agendaBloqueiosTable,
  expedienteConfigTable,
} from "../schema/schedule.schema.js";

import { barbersTable } from "../schema/barber.schema.js";

export const agendaBloqueiosRelations = relations(
  agendaBloqueiosTable,
  ({ one }) => ({
    barber: one(barbersTable, {
      fields: [agendaBloqueiosTable.barbeiroId],
      references: [barbersTable.id],
    }),
  })
);

export const expedienteRelations = relations(
  expedienteConfigTable,
  ({ one }) => ({
    barber: one(barbersTable, {
      fields: [expedienteConfigTable.barbeiroId],
      references: [barbersTable.id],
    }),
  })
);