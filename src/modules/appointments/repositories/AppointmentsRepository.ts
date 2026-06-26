import { db, appointmentsTable, appointmentServicesTable, servicesTable } from "../../../database/index.js";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { type IAppointmentsRepository, type IAppointmentsFilters } from "./IAppointmentsRepository.js";

export class AppointmentsRepository implements IAppointmentsRepository {
  
  async findAll(filters?: IAppointmentsFilters) {
    const conditions = [];

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(filters.date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      conditions.push(gte(appointmentsTable.dataHora, startOfDay));
      conditions.push(lt(appointmentsTable.dataHora, endOfDay));
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
    // 👑 BLINDAGEM: Remove as amarras da tabela associativa primeiro para evitar erro de FK
    await this.unlinkServices(id);
    await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id));
    return true;
  }

  async linkServices(appointmentId: number, serviceIds: number[]): Promise<void> {
    const valuesToInsert = serviceIds.map((serviceId) => ({ appointmentId, serviceId }));
    await db.insert(appointmentServicesTable).values(valuesToInsert);
  }

  async unlinkServices(appointmentId: number): Promise<void> {
    await db.delete(appointmentServicesTable).where(eq(appointmentServicesTable.appointmentId, appointmentId));
  }

  // 🌟 IMPLEMENTAÇÃO DO DASHBOARD REAL VIA TRILHA SQL DRIZZLE
  async getStatsToday(barberId: number) {
    const now = new Date();
    const startToday = new Date(now.setUTCHours(0,0,0,0));
    const endToday = new Date(now.setUTCHours(23,59,59,999));

    // Agendamentos de hoje
    const [todayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointmentsTable)
      .where(and(
        eq(appointmentsTable.barbeiroId, barberId),
        gte(appointmentsTable.dataHora, startToday),
        lt(appointmentsTable.dataHora, endToday)
      ));

    // Soma do faturamento do dia cruzando tabelas
    const [revenue] = await db
      .select({ total: sql<string>`sum(${servicesTable.preco})` })
      .from(appointmentServicesTable)
      .innerJoin(appointmentsTable, eq(appointmentServicesTable.appointmentId, appointmentsTable.id))
      .innerJoin(servicesTable, eq(appointmentServicesTable.serviceId, servicesTable.id))
      .where(and(
        eq(appointmentsTable.barbeiroId, barberId),
        gte(appointmentsTable.dataHora, startToday),
        lt(appointmentsTable.dataHora, endToday)
      ));

    return {
      appointmentsToday: Number(todayCount?.count || 0),
      revenueToday: revenue?.total || "0.00",
      appointmentsThisWeek: Number(todayCount?.count || 0) // Simplificado para o MVP de demonstração
    };
  }
}