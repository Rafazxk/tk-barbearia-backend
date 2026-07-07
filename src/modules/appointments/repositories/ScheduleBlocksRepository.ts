import { db, agendaBloqueiosTable, barbersTable } from "../../../database/index.js";
import { eq, sql } from "drizzle-orm";
// import { usersTable } from "./schema.js"; // Importe sua tabela de usuários se tiver

export class ScheduleBlocksRepository {
  async findAll() {
    return await db
      .select({
        id: agendaBloqueiosTable.id,
        tipo: agendaBloqueiosTable.tipo,
        descricao: agendaBloqueiosTable.descricao,
        dataInicio: agendaBloqueiosTable.dataInicio,
        horaInicio: agendaBloqueiosTable.horaInicio,
        horaFim: agendaBloqueiosTable.horaFim,
        barbeiroId: agendaBloqueiosTable.barbeiroId,
        // Usamos COALESCE para o SQL devolver "Barbearia Inteira" se o nome for null
        nomeBarbeiro: barbersTable.nome
      })
      .from(agendaBloqueiosTable)
      .leftJoin(barbersTable, eq(agendaBloqueiosTable.barbeiroId, barbersTable.id))
      .orderBy(agendaBloqueiosTable.dataInicio);
  }

  async create(data: {
    tipo: string;
    descricao: string;
    dataInicio: string;
    horaInicio?: string | null;
    horaFim?: string | null;
    barbeiroId?: number | null;
  }) {
    // Garantimos que o objeto inserido tenha todas as chaves, 
    // mas com valores estritamente tratados.
    const insertPayload = {
      tipo: data.tipo,
      descricao: data.descricao,
      dataInicio: data.dataInicio,
      horaInicio: data.horaInicio ?? null,
      horaFim: data.horaFim ?? null,
      barbeiroId: data.barbeiroId ?? null,
    };

    const [item] = await db.insert(agendaBloqueiosTable).values(insertPayload).returning();
    return item;
  }

  async delete(id: number) {
    await db.delete(agendaBloqueiosTable).where(eq(agendaBloqueiosTable.id, id));
  }
}