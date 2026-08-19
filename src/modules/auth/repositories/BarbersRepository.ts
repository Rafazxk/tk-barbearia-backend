import { db } from "../../../database/index.js";
import { barbersTable } from "../../../database/schema/barber.schema.js";
import { eq } from "drizzle-orm";
import { type RegisterInput } from "../domain/AuthService.js";
import { type IBarbersRepository, type IBarberDTO } from "./IBarbersRepository.js";

export class BarbersRepository implements IBarbersRepository {

async findByEmail(email: string): Promise<IBarberDTO | null> {
    const [barber] = await db
      .select()
      .from(barbersTable)
      .where(eq(barbersTable.email, email))
      .limit(1);
    if(!barber) return null;
    
    return {
      ...barber,
      role: barber.role ?? "barber" // garante que seja string
    }
  }

async findById(id: number): Promise<IBarberDTO | null> {
  const [barber] = await db
    .select()
    .from(barbersTable)
    .where(eq(barbersTable.id, id))
    .limit(1);

  if (!barber) return null;

  return {
    ...barber,
    role: barber.role ?? "barber",
  };
}

async listBarbers(): Promise<IBarberDTO[]> {
  const result = await db
    .select({
      id: barbersTable.id,
      nome: barbersTable.nome,
      email: barbersTable.email,
      telefone: barbersTable.telefone,
      foto: barbersTable.foto,
      role: barbersTable.role,
      notificacoesNovoAgendamento: barbersTable.notificacoesNovoAgendamento
    })
    .from(barbersTable);

  // Garante o mapeamento correto e o fallback do role para string válida
  return result.map((b) => ({
    id: b.id,
    nome: b.nome,
    email: b.email,
    telefone: b.telefone,
    foto: b.foto,
    role: b.role ?? "barber",
    notificacoesNovoAgendamento: b.notificacoesNovoAgendamento,
  }));
}

async create(dados: RegisterInput & { passwordHash: string }): Promise<IBarberDTO | null> {
    const [novoBarbeiro] = await db
      .insert(barbersTable)
      .values({
        nome: dados.nome,
        email: dados.email,
        password: dados.passwordHash,
        telefone: dados.telefone,
        foto: dados.foto,
        role: dados.role,
      })
      .returning();
      if(!novoBarbeiro) return null;

    return {
      ...novoBarbeiro,
      role: novoBarbeiro.role ?? "barber"
    }
  }

async updateFoto(id: number, fotoUrl: string): Promise<IBarberDTO> {
  const [barberAtualizado] = await db
    .update(barbersTable)
    .set({
      foto: fotoUrl, // Atualiza o campo 'foto' com o caminho do arquivo
    })
    .where(eq(barbersTable.id, Number(id))) // Filtra pelo ID do barbeiro
    .returning();

  if (!barberAtualizado) {
    throw new Error("Barbeiro não encontrado para atualizar a foto.");
  }

  return {
    ...barberAtualizado,
    role: barberAtualizado.role ?? "barber"
  };
}

async updateNome(id: number, nome: string): Promise<IBarberDTO> {
  const [barberAtualizado] = await db
    .update(barbersTable)
    .set({ nome })
    .where(eq(barbersTable.id, Number(id)))
    .returning();

  if (!barberAtualizado) {
    throw new Error("Barbeiro não encontrado para atualizar o nome.");
  }

  return {
    ...barberAtualizado,
    role: barberAtualizado.role ?? "barber"
  };
}

async updateNotificacoesNovoAgendamento(
  id: number,
  ativo: boolean
): Promise<IBarberDTO> {
  const [barberAtualizado] = await db
    .update(barbersTable)
    .set({
      notificacoesNovoAgendamento: ativo,
    })
    .where(eq(barbersTable.id, Number(id)))
    .returning();

  if (!barberAtualizado) {
    throw new Error("Barbeiro não encontrado.");
  }

  return {
    ...barberAtualizado,
    role: barberAtualizado.role ?? "barber",
  };
}

async getNotificacoesNovoAgendamento(
  id: number
): Promise<boolean> {
  const [barber] = await db
    .select({
      notificacoesNovoAgendamento:
        barbersTable.notificacoesNovoAgendamento,
    })
    .from(barbersTable)
    .where(eq(barbersTable.id, Number(id)))
    .limit(1);

  if (!barber) {
    throw new Error("Barbeiro não encontrado.");
  }

  return barber.notificacoesNovoAgendamento;
}

}