import { db, expedienteConfigTable } from "../../../database/index.js";
import { eq, and, isNull } from "drizzle-orm";
// 1. Importe as suas interfaces (ajuste o caminho do arquivo se necessário)
import { type IBusinessHoursInput, type IBusinessHoursRepository } from "./IBusinessHoursRepository.js";

// 2. Use a palavra chave 'implements' para assinar o contrato da interface
export class BusinessHoursRepository implements IBusinessHoursRepository {
  
  // Busca os horários de um barbeiro específico ou o geral da casa se o ID for nulo
  // Alterado o retorno de Promise<any> para refletir os dados reais do Drizzle (ou mantenha Promise<any>)
  async getSchedule(barbeiroId: number | null): Promise<any> {
    if (barbeiroId) {
      const result = await db
        .select()
        .from(expedienteConfigTable)
        .where(eq(expedienteConfigTable.barbeiroId, barbeiroId))
        .orderBy(expedienteConfigTable.diaSemana);
        
      if (result.length > 0) return result;
    }
    
    return await db
      .select()
      .from(expedienteConfigTable)
      .where(isNull(expedienteConfigTable.barbeiroId))
      .orderBy(expedienteConfigTable.diaSemana);
  }

  // Cria ou atualiza as configurações usando o tipo IBusinessHoursInput da sua interface
  async upsertDayConfig(data: IBusinessHoursInput): Promise<void> {
    const { id, ...dadosParaAtualizar } = data;

    // 🔍 1. Descobrir se já existe esse dia da semana no banco para este alvo (Geral ou Barbeiro)
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

    // 🔄 2. Se já existir no banco, faz UPDATE
    if (registroExistente.length > 0 && atual) {
      await db
        .update(expedienteConfigTable)
        .set({
          diaSemana: dadosParaAtualizar.diaSemana,
          diaNome: dadosParaAtualizar.diaNome,
          trabalha: dadosParaAtualizar.trabalha,
          horaAbertura: dadosParaAtualizar.horaAbertura,
          horaFechamento: dadosParaAtualizar.horaFechamento,
          horaInicioAlmoco: dadosParaAtualizar.horaInicioAlmoco,
          horaFimAlmoco: dadosParaAtualizar.horaFimAlmoco,
          intervaloMinutos: dadosParaAtualizar.intervaloMinutos
        })
        .where(eq(expedienteConfigTable.id, atual.id));
    } else {
      // ➕ 3. Se não existir, faz INSERT
      await db
        .insert(expedienteConfigTable)
        .values({
          barbeiroId: data.barbeiroId,
          diaSemana: data.diaSemana,
          diaNome: data.diaNome,
          trabalha: data.trabalha,
          horaAbertura: data.horaAbertura,
          horaFechamento: data.horaFechamento,
          horaInicioAlmoco: data.horaInicioAlmoco,
          horaFimAlmoco: data.horaFimAlmoco,
          intervaloMinutos: data.intervaloMinutos
        });
    }
  }
}