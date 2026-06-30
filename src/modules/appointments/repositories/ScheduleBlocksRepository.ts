import { db, agendaBloqueiosTable } from "../../../database/index.js";
import { eq } from "drizzle-orm";
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
        // barbeiroNome: usersTable.nome // Descomente quando vincular a tabela de usuários
      })
      .from(agendaBloqueiosTable)
      // .leftJoin(usersTable, eq(agendaBloqueiosTable.barbeiroId, usersTable.id))
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
    const [item] = await db.insert(agendaBloqueiosTable).values(data).returning();
    return item;
  }

  async delete(id: number) {
    await db.delete(agendaBloqueiosTable).where(eq(agendaBloqueiosTable.id, id));
  }
}