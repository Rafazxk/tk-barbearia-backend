import { pgTable, serial, varchar, date, time, integer, boolean } from "drizzle-orm/pg-core";

export const agendaBloqueiosTable = pgTable("agenda_bloqueios", {
  id: serial("id").primaryKey(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'horario' ou 'data'
  descricao: varchar("descricao", { length: 255 }).notNull(),
  dataInicio: date("data_inicio").notNull(),
  horaInicio: time("hora_inicio"), // Preenchido apenas se tipo for 'horario'
  horaFim: time("hora_fim"),       // Preenchido apenas se tipo for 'horario'
  barbeiroId: integer("barbeiro_id"), // Nulo significa "Todos os Barbeiros"
});

export const expedienteConfigTable = pgTable("expediente_configs", {
  id: serial("id").primaryKey(),
  barbeiroId: integer("barbeiro_id"),
  diaSemana: integer("dia_semana").notNull(),
  diaNome: varchar("dia_nome", { length: 20 }).notNull(),
  trabalha: boolean("trabalha").default(true).notNull(),
  horaAbertura: varchar("hora_abertura", { length: 5 }).default("09:00").notNull(),
  horaFechamento: varchar("hora_fechamento", { length: 5 }).default("19:00").notNull(),
  horaInicioAlmoco: varchar("hora_inicio_almoco", { length: 5 }).default("12:00"),
  horaFimAlmoco: varchar("hora_fim_almoco", { length: 5 }).default("13:00"),
  intervaloMinutos: integer("intervalo_minutos").default(30).notNull(),
});