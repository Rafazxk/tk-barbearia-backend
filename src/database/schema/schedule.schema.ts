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