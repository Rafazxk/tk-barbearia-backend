import { db } from "../../../database/index.js";
import { barbersTable } from "../../../database/schema.js";
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
async listBarbers(): Promise<IBarberDTO[]> {
  const result = await db
    .select({
      id: barbersTable.id,
      nome: barbersTable.nome,
      email: barbersTable.email,
      foto: barbersTable.foto,
      role: barbersTable.role,
    })
    .from(barbersTable);

  // Garante o mapeamento correto e o fallback do role para string válida
  return result.map((b) => ({
    id: b.id,
    nome: b.nome,
    email: b.email,
    foto: b.foto,
    role: b.role ?? "barber",
  }));
}


  async create(dados: RegisterInput & { passwordHash: string }): Promise<IBarberDTO | null> {
    const [novoBarbeiro] = await db
      .insert(barbersTable)
      .values({
        nome: dados.nome,
        email: dados.email,
        password: dados.passwordHash,
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
}