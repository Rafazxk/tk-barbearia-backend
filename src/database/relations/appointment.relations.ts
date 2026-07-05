import { relations } from "drizzle-orm";

import {
  appointmentsTable,
  appointmentServicesTable,
  servicesTable,
  categoriesTable,
} from "../schema/appointment.schema.js";

import { barbersTable } from "../schema/barber.schema.js";


// ===========================
// AGENDAMENTOS
// ===========================

export const appointmentsRelations = relations(
  appointmentsTable,
  ({ one, many }) => ({
    barber: one(barbersTable, {
      fields: [appointmentsTable.barbeiroId],
      references: [barbersTable.id],
    }),

    services: many(appointmentServicesTable),
  })
);


// ===========================
// AGENDAMENTO_SERVICOS
// ===========================

export const appointmentServicesRelations = relations(
  appointmentServicesTable,
  ({ one }) => ({
    appointment: one(appointmentsTable, {
      fields: [appointmentServicesTable.appointmentId],
      references: [appointmentsTable.id],
    }),

    service: one(servicesTable, {
      fields: [appointmentServicesTable.serviceId],
      references: [servicesTable.id],
    }),
  })
);


// ===========================
// SERVIÇOS
// ===========================

export const servicesRelations = relations(
  servicesTable,
  ({ one, many }) => ({
    category: one(categoriesTable, {
      fields: [servicesTable.categoriaId],
      references: [categoriesTable.id],
    }),

    appointments: many(appointmentServicesTable),
  })
);


// ===========================
// CATEGORIAS
// ===========================

export const categoriesRelations = relations(
  categoriesTable,
  ({ many }) => ({
    services: many(servicesTable),
  })
);