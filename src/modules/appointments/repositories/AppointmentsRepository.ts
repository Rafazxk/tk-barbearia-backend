import { db, appointmentsTable, appointmentServicesTable, servicesTable } from "../../../database/index.js";
import { eq, and, gte, lt } from "drizzle-orm";
import { type IAppointmentsRepository, type IAppointmentsFilters } from "../domain/IAppointmentsRepository.js";

export class AppointmentsRepository implements IAppointmentsRepository {
  
  async findAll(filters?: IAppointmentsFilters) {
    const conditions = [];

    if (filters?.date) {
      const date = new Date(filters.date);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      conditions.push(gte(appointmentsTable.dataHora, date));
      conditions.push(lt(appointmentsTable.dataHora, nextDay));
    }

    if (filters?.barberId) {
      conditions.push(eq(appointmentsTable.barbeiroId, filters.barberId));
    }

    if (conditions.length > 0) {
      return await db.select().from(appointmentsTable).where(and(...conditions));
    }

    return await db.select().from(appointmentsTable);
  }

  async findById(id: number) {
    const [appointment] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    return appointment || null;
  }

  async findServicesByAppointmentId(appointmentId: number) {
    return await db
      .select({
        id: servicesTable.id,
        nome: servicesTable.nome, 
        preco: servicesTable.preco,
        duracaoMinutos: servicesTable.duracaoMinutos,
      })
      .from(appointmentServicesTable)
      .innerJoin(servicesTable, eq(appointmentServicesTable.serviceId, servicesTable.id))
      .where(eq(appointmentServicesTable.appointmentId, appointmentId));
  }

  async create(data: { clienteNome: string; clienteTelefone: string; dataHora: Date; barbeiroId: number }) {
    const [newAppointment] = await db.insert(appointmentsTable).values(data).returning();
    return newAppointment;
  }

  async update(id: number, data: any) {
    const [updated] = await db.update(appointmentsTable).set(data).where(eq(appointmentsTable.id, id)).returning();
    return updated || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    return true; // Se o banco não estourar erro, deu certo
  }

  async linkServices(appointmentId: number, serviceIds: number[]): Promise<void> {
    const valuesToInsert = serviceIds.map((serviceId) => ({ appointmentId, serviceId }));
    await db.insert(appointmentServicesTable).values(valuesToInsert);
  }

  async unlinkServices(appointmentId: number): Promise<void> {
    await db.delete(appointmentServicesTable).where(eq(appointmentServicesTable.appointmentId, appointmentId));
  }
}