import { db, appointmentsTable, appointmentServicesTable, servicesTable, barbersTable, agendaBloqueiosTable} from "../../../database/index.js";
import { eq, and,or, isNull, gte, lte, lt, sql } from "drizzle-orm";
import { type IAppointmentsRepository, type IAppointmentsFilters } from "./IAppointmentsRepository.js";
import { type IClientAppointment } from "./IClienteRepository.js";

export class AppointmentsRepository implements IAppointmentsRepository {

  async findFrequentClients(barberId?: number) {
    const conditions = [];

    if (barberId) {
      conditions.push(eq(appointmentsTable.barbeiroId, barberId));
    }

    return await db
      .select({
        id: sql<string>`md5(${appointmentsTable.clienteTelefone})`,
        nome: appointmentsTable.clienteNome,
        telefone: appointmentsTable.clienteTelefone,
        totalCortes: sql<number>`count(distinct ${appointmentsTable.id})::int`,
        ultimoCorte: sql<string>`max(${appointmentsTable.dataHora})::text`,
        totalGasto: sql<number>`coalesce(sum(${servicesTable.preco}), 0)::float`
      })
      .from(appointmentsTable)
      .leftJoin(appointmentServicesTable, eq(appointmentServicesTable.appointmentId, appointmentsTable.id))
      .leftJoin(servicesTable, eq(appointmentServicesTable.serviceId, servicesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(appointmentsTable.clienteNome, appointmentsTable.clienteTelefone)
      .having(sql`count(distinct ${appointmentsTable.id}) >= 2`)
      // 🔝 CORREÇÃO AQUI: Ordena diretamente pelo COUNT em vez do alias de texto
      .orderBy(sql`count(distinct ${appointmentsTable.id}) DESC`);
  }

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

  async findByDate(barberId: number, dateStr: string) {
    // dateStr vem do front como "2026-06-26"

    // Criamos o início do dia às 00:00:00 e o fim às 23:59:59 na data recebida
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    return db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.barbeiroId, barberId),
          // Garante que pega qualquer hora dentro daquele dia específico
          gte(appointmentsTable.dataHora, startOfDay),
          lte(appointmentsTable.dataHora, endOfDay)
        )
      );
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
  // telefone

  async listByClientPhone(clientPhone: string): Promise<IClientAppointment[]> {
    const appointments = await db.query.appointmentsTable.findMany({

      where: eq(appointmentsTable.clienteTelefone, clientPhone),

      with: {
        barber: true,

        services: {
          with: {
            service: true,
          },
        },
      },
    });

    return appointments.map((appointment) => {
      const servicos = appointment.services.map(({ service }) => ({
        id: service.id,
        nome: service.nome,
        preco: Number(service.preco),
        duracaoMinutos: service.duracaoMinutos,
      }));

      const totalPreco = servicos.reduce(
        (total, servico) => total + servico.preco,
        0
      );

      return {
        id: appointment.id,
        clienteNome: appointment.clienteNome,
        clienteTelefone: appointment.clienteTelefone,
        dataHora: appointment.dataHora,

        barbeiro: {
          id: appointment.barber.id,
          nome: appointment.barber.nome,
        },

        servicos,

        totalPreco,
      };
    });
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
    const startToday = new Date(now.setUTCHours(0, 0, 0, 0));
    const endToday = new Date(now.setUTCHours(23, 59, 59, 999));

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

  async findAvailableSlots(barberId: number, date: string) {
  if (!barberId) {
    throw new Error("barberId is required to find available slots.");
  }

  // 1. Pega os agendamentos já marcados
  const bookedAppointments = await this.findByDate(barberId, date);
  const bookedTimes = bookedAppointments.map(app => app.dataHora.toISOString());

  // 2. Busca bloqueios para este barbeiro OU bloqueios gerais (NULL) na data
  const bloqueios = await db.select()
    .from(agendaBloqueiosTable)
    .where(
      and(
        eq(agendaBloqueiosTable.dataInicio, date),
        or(
          eq(agendaBloqueiosTable.barbeiroId, barberId), // Bloqueio do barbeiro
          isNull(agendaBloqueiosTable.barbeiroId)        // Bloqueio geral
        )
      )
    );

  const allSlots = [];
  for (let hour = 9; hour <= 17; hour++) {
    const slotTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00Z`);
    const isoString = slotTime.toISOString();

    // 3. Verifica se o horário está ocupado por cliente OU por bloqueio
    const estaOcupado = bookedTimes.includes(isoString);
    
    const estaBloqueado = bloqueios.some(b => {
      // Se for bloqueio de data inteira
      if (b.tipo === 'data') return true; 
      
      // Se for bloqueio de horário, verifica se o horário do loop está no intervalo
      if (b.tipo === 'horario' && b.horaInicio && b.horaFim) {
        const horaSlot = `${hour.toString().padStart(2, '0')}:00`;
        return horaSlot >= b.horaInicio && horaSlot <= b.horaFim;
      }
      return false;
    });

    if (!estaOcupado && !estaBloqueado) {
      allSlots.push(isoString);
    }
  }
  
  return allSlots;
}

  async findBookedSlotsByDate(barberId: number, date: string): Promise<string[]> {
    // 1. Criamos o intervalo de início e fim daquele dia completo em UTC/Local
    // Se 'date' vier como "2026-07-06"
    const inicioDia = new Date(`${date}T00:00:00`);
    const fimDia = new Date(`${date}T23:59:59`);

    // 2. Buscamos todos os agendamentos que caem dentro desse dia para o barbeiro
    const result = await db
      .select({ 
        dataHora: appointmentsTable.dataHora 
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.barbeiroId, barberId),
          gte(appointmentsTable.dataHora, inicioDia), // Maior ou igual ao início do dia
          lte(appointmentsTable.dataHora, fimDia)    // Menor ou igual ao fim do dia
        )
      );

    // 3. Mapeamos os objetos Date retornados pelo banco para extrair apenas a string "HH:MM"
    const horariosOcupados = result.map(app => {
      const horas = String(app.dataHora.getHours()).padStart(2, "0");
      const minutos = String(app.dataHora.getMinutes()).padStart(2, "0");
      return `${horas}:${minutos}`; // Retorna algo como "14:30"
    });

    return horariosOcupados;
  }
}