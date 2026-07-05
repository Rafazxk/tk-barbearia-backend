import { pgTable, serial, varchar, timestamp, integer, decimal} from "drizzle-orm/pg-core";
import { barbersTable } from "./barber.schema.js";

export const appointmentsTable = pgTable("agendamentos", {
  id: serial("id").primaryKey(),
  clienteNome: varchar("cliente_nome", { length: 255 }).notNull(),
  clienteTelefone: varchar("cliente_telefone", { length: 20 }).notNull(),
  dataHora: timestamp("data_hora").notNull(),
  barbeiroId: integer("barbeiro_id").references(() => barbersTable.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Tabela Intermediária (Muitos para Muitos: Um agendamento pode ter vários serviços)
export const appointmentServicesTable = pgTable("agendamento_servicos", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id")
    .references(() => appointmentsTable.id, { onDelete: "cascade" })
    .notNull(),
  serviceId: integer("service_id")
    .references(() => servicesTable.id)
    .notNull(),
});

export const categoriesTable = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ordem: integer("ordem").default(0),
});

// 3. Tabela de Serviços (Corte Social, Degradê, Barboterapia...)
export const servicesTable = pgTable("servicos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  duracaoMinutos: integer("duracao_minutos").notNull(),
  categoriaId: integer("categoria_id").references(() => categoriesTable.id),
  ordem: integer("ordem").default(0),
});

// 4. Tabela de Agendamentos (Onde o cliente marca o horário)
