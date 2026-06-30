import { db, expedienteConfigTable } from "../../../database/index.js";
import { eq, and, isNull } from "drizzle-orm";

export class BusinessHoursRepository {
  // Busca os horários de um barbeiro específico ou o geral da casa se o ID for nulo
  async getSchedule(barbeiroId: number | null) {
    if (barbeiroId) {
      // Se temos o ID, buscamos usando eq() de forma segura
      const result = await db
        .select()
        .from(expedienteConfigTable)
        .where(eq(expedienteConfigTable.barbeiroId, barbeiroId))
        .orderBy(expedienteConfigTable.diaSemana);
        
      if (result.length > 0) return result;
    }
    
    // Se não achou do barbeiro ou se pediu o geral (null), traz onde barbeiroId é nulo de verdade
    return await db
      .select()
      .from(expedienteConfigTable)
      .where(isNull(expedienteConfigTable.barbeiroId))
      .orderBy(expedienteConfigTable.diaSemana);
  }

  // Cria ou atualiza as configurações de horário de forma totalmente autônoma
  async upsertDayConfig(data: {
    id?: number;
    barbeiroId: number | null;
    diaSemana: number;
    diaNome: string;
    trabalha: boolean;
    horaAbertura: string;
    horaFechamento: string;
    intervaloMinutos: number;
  }) {
    const { id, ...dadosParaAtualizar } = data;

    // 🔍 1. Descobrir se já existe esse dia da semana no banco para este alvo (Geral ou Barbeiro)
    // Se data.barbeiroId for null, filtramos por isNull(), se for número, usamos eq()
    const filtroAlvo = data.barbeiroId === null 
      ? isNull(expedienteConfigTable.barbeiroId)
      : eq(expedienteConfigTable.barbeiroId, data.barbeiroId);

    const registroExistente = await db
      .select()
      .from(expedienteConfigTable)
      .where(
        and(
          filtroAlvo,
          eq(expedienteConfigTable.diaSemana, data.diaSemana)
        )
      );

    const atual = registroExistente[0];

    // 🔄 2. Se já existir no banco (seja da barbearia ou do barbeiro), faz UPDATE na linha real
    if (registroExistente.length > 0 && atual) {
      await db
        .update(expedienteConfigTable)
        .set({
          diaSemana: dadosParaAtualizar.diaSemana,
          diaNome: dadosParaAtualizar.diaNome,
          trabalha: dadosParaAtualizar.trabalha,
          horaAbertura: dadosParaAtualizar.horaAbertura,
          horaFechamento: dadosParaAtualizar.horaFechamento,
          intervaloMinutos: dadosParaAtualizar.intervaloMinutos
        })
        .where(eq(expedienteConfigTable.id, atual.id));
    } else {
      // ➕ 3. Se não existir (primeira vez que o barbeiro mexe na sua grade), faz INSERT do zero
      await db
        .insert(expedienteConfigTable)
        .values({
          barbeiroId: data.barbeiroId, // Mantém null se for admin gerando a grade master, ou o ID do barbeiro
          diaSemana: data.diaSemana,
          diaNome: data.diaNome,
          trabalha: data.trabalha,
          horaAbertura: data.horaAbertura,
          horaFechamento: data.horaFechamento,
          intervaloMinutos: data.intervaloMinutos
        });
    }
  }
}