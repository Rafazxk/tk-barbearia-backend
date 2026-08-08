import { eq, or, isNull, and } from "drizzle-orm";
import { db } from "../../../database/db.js"; 
import { agendaBloqueiosTable, barbersTable } from "../../../database/schema/index.js";

export class ScheduleBlocksRepository {
  // Lista todos os bloqueios para o painel de administração
  async findAll(barberId?: number | null) {
  const query = db
    .select({
      id: agendaBloqueiosTable.id,
      tipo: agendaBloqueiosTable.tipo,
      descricao: agendaBloqueiosTable.descricao,
      dataInicio: agendaBloqueiosTable.dataInicio,
      horaInicio: agendaBloqueiosTable.horaInicio,
      horaFim: agendaBloqueiosTable.horaFim,
      barbeiroId: agendaBloqueiosTable.barbeiroId,
      nomeBarbeiro: barbersTable.nome,
    })
    .from(agendaBloqueiosTable)
    .leftJoin(barbersTable, eq(agendaBloqueiosTable.barbeiroId, barbersTable.id));

  // Se um barbeiro específico foi passado (e não é admin), filtra por:
  // (Bloqueios globais IS NULL) OU (Bloqueios do próprio barbeiro)
  if (barberId !== undefined && barberId !== null) {
    const numericId = Number(barberId);
    return await query.where(
      or(
        isNull(agendaBloqueiosTable.barbeiroId),
        eq(agendaBloqueiosTable.barbeiroId, numericId)
      )
    );
  }

  return await query;
}

  // Busca bloqueios para validar horários disponíveis na agenda do cliente/painel
  async findBlocksByDate(barbeiroId: number | null, dataStr: string) {
    // Regra de Isolamento:
    // 1. Se informou um barbeiro: Busca o que é GLOBAL (barbeiroId IS NULL) OU o que é DELE (barbeiroId = barberId).
    // 2. Se NÃO informou barbeiro: Busca APENAS os bloqueios globais (barbeiroId IS NULL).
    const condicaoBarbeiro = barbeiroId
      ? or(isNull(agendaBloqueiosTable.barbeiroId), eq(agendaBloqueiosTable.barbeiroId, barbeiroId))
      : isNull(agendaBloqueiosTable.barbeiroId);

    return await db
      .select({
        id: agendaBloqueiosTable.id,
        tipo: agendaBloqueiosTable.tipo,
        descricao: agendaBloqueiosTable.descricao,
        dataInicio: agendaBloqueiosTable.dataInicio,
        horaInicio: agendaBloqueiosTable.horaInicio,
        horaFim: agendaBloqueiosTable.horaFim,
        barbeiroId: agendaBloqueiosTable.barbeiroId,
        nomeBarbeiro: barbersTable.nome,
      })
      .from(agendaBloqueiosTable)
      .leftJoin(barbersTable, eq(agendaBloqueiosTable.barbeiroId, barbersTable.id))
      .where(
        and(
          eq(agendaBloqueiosTable.dataInicio, dataStr),
          condicaoBarbeiro
        )
      );
  }

  // Criar um novo bloqueio
  async create(data: {
    tipo: "horario" | "data";
    descricao: string;
    dataInicio: string;
    horaInicio?: string | null;
    horaFim?: string | null;
    barbeiroId?: number | null;
  }) {
    const [inserted] = await db
      .insert(agendaBloqueiosTable)
      .values({
        tipo: data.tipo,
        descricao: data.descricao,
        dataInicio: data.dataInicio,
        horaInicio: data.horaInicio ?? null,
        horaFim: data.horaFim ?? null,
        barbeiroId: data.barbeiroId ?? null,
      })
      .returning();

    return inserted;
  }

  // Atualizar um bloqueio existente
  async update(
    id: number,
    data: {
      tipo?: "horario" | "data";
      descricao?: string;
      dataInicio?: string;
      horaInicio?: string | null;
      horaFim?: string | null;
      barbeiroId?: number | null;
    }
  ) {
    const [updated] = await db
      .update(agendaBloqueiosTable)
      .set({
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.descricao && { descricao: data.descricao }),
        ...(data.dataInicio && { dataInicio: data.dataInicio }),
        horaInicio: data.horaInicio ?? null,
        horaFim: data.horaFim ?? null,
        barbeiroId: data.barbeiroId ?? null,
      })
      .where(eq(agendaBloqueiosTable.id, id))
      .returning();

    return updated;
  }

  // Remover um bloqueio
  async delete(id: number) {
    await db
      .delete(agendaBloqueiosTable)
      .where(eq(agendaBloqueiosTable.id, id));
  }
}