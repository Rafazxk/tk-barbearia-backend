import { pgTable, serial, varchar, timestamp, integer, decimal, boolean, text, time, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";



// 1. Tabela de Barbeiros (Tharsys, Gustavo, Kleyton...)
export const barbersTable = pgTable("barbeiros", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(), // Esse continua unique
  password: varchar("senha", { length: 255 }).notNull(), 
  foto: varchar("foto", { length: 255 }),
  role: varchar("role", { length: 50 }).default("barber"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Tabela de Categorias dos Serviços (Cabelo, Barba, Combos...)
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

// 6. Tabela de whatsapp (Onde o cliente pode enviar mensagens para o barbeiro)

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

// Relacionamento (Opcional, caso use Drizzle Relations em outros lugares)
export const whatsappSettingsRelations = relations(whatsappSettingsTable, ({ one }) => ({
  barber: one(barbersTable, {
    fields: [whatsappSettingsTable.barberId],
    references: [barbersTable.id],
  }),
}));

export const produtoCategoriasTable = pgTable("produto_categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  ordem: integer("ordem").default(0),
});

export const produtosTable = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  estoque: integer("estoque").default(0),
  imagemUrl: varchar("imagem_url", { length: 1000 }), // 📸 Já preparado para amanhã!
  categoriaId: integer("categoria_id")
    .references(() => produtoCategoriasTable.id, { onDelete: "cascade" })
    .notNull(),
  ordem: integer("ordem").default(0),
});

export const agendaBloqueiosTable = pgTable("agenda_bloqueios", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'horario' ou 'data'
  descricao: varchar("descricao", { length: 255 }).notNull(),
  dataInicio: date("data_inicio").notNull(),
  horaInicio: time("hora_inicio"), // Preenchido apenas se tipo for 'horario'
  horaFim: time("hora_fim"),       // Preenchido apenas se tipo for 'horario'
  barbeiroId: integer("barbeiro_id"), // Nulo significa "Todos os Barbeiros"
});

export const expedienteConfigTable = pgTable("expediente_config", {
  id: serial("id").primaryKey(),
  barbeiroId: integer("barbeiro_id"), // 👈 Verifique se o nome aqui é exatamente 'barbeiroId'
  diaSemana: integer("dia_semana").notNull(),
  diaNome: varchar("dia_nome", { length: 20 }).notNull(),
  trabalha: boolean("trabalha").default(true).notNull(),
  horaAbertura: time("hora_abertura").default("09:00:00"),
  horaFechamento: time("hora_fechamento").default("19:00:00"),
  intervaloMinutos: integer("intervalo_minutos").default(30).notNull(),
});