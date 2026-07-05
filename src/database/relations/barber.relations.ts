import { relations } from "drizzle-orm";

import { barbersTable } from "../schema/barber.schema.js";

import { appointmentsTable } from "../schema/appointment.schema.js";

import { whatsappSettingsTable } from "../schema/whatsapp.schema.js";

import {
  agendaBloqueiosTable,
  expedienteConfigTable,
} from "../schema/schedule.schema.js";

export const barbersRelations = relations(
  barbersTable,
  ({ many, one }) => ({
    appointments: many(appointmentsTable),

    whatsapp: one(whatsappSettingsTable),

    scheduleBlocks: many(agendaBloqueiosTable),

    businessHours: many(expedienteConfigTable),
  })
);