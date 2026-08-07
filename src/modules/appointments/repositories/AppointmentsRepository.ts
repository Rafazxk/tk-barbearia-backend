import { db, appointmentsTable, appointmentServicesTable, servicesTable, barbersTable, agendaBloqueiosTable } from "../../../database/index.js";
import { eq, and, or, isNull, gte, lte, lt, sql, asc, desc, count, max, sum } from "drizzle-orm";
import { type IAppointmentsRepository, type IAppointmentsFilters, type IBookedSlot } from "./IAppointmentsRepository.js";
import { type IClientAppointment } from "./IClienteRepository.js";
import { DateTime } from "../../../shared/time/DateTime.js";

export class AppointmentsRepository implements IAppointmentsRepository {

 async findFrequentClients(barberId?: number) {
  const conditions = [];

  if (barberId) {
    conditions.push(eq(appointmentsTable.barbeiroId, barberId));
  }

  return await db
    .select({
      id: appointmentsTable.clienteTelefone, // Usando o telefone como ID único
      nome: appointmentsTable.clienteNome,
      telefone: appointmentsTable.clienteTelefone,
      totalCortes: count(appointmentsTable.id).as("totalCortes"),
      ultimoCorte: max(appointmentsTable.dataHora).as("ultimoCorte"),
      totalGasto: sum(servicesTable.preco).as("totalGasto"),
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentServicesTable,
      eq(appointmentServicesTable.appointmentId, appointmentsTable.id)
    )
    .leftJoin(
      servicesTable,
      eq(servicesTable.id, appointmentServicesTable.serviceId)
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(appointmentsTable.clienteTelefone, appointmentsTable.clienteNome)
    .orderBy(sql`"totalCortes" DESC`);
}

  async findAll(filters?: IAppointmentsFilters) {
    const conditions = [];

    if (filters?.date) {
      const selectedDate = DateTime.fromDateOnly(filters.date);

      const startOfDay = selectedDate
        .startOfDay()
        .toDate();

      const endOfDay = selectedDate
        .endOfDay()
        .toDate();

      conditions.push(gte(appointmentsTable.dataHora, startOfDay));
      conditions.push(lt(appointmentsTable.dataHora, endOfDay));
    }

    if (filters?.barberId) {
      conditions.push(eq(appointmentsTable.barbeiroId, filters.barberId));
    }

    if (filters?.onlyPending) {
      conditions.push(
        gte(
          appointmentsTable.dataHora,
          new Date()
        )
      );
    }
    const order =
      filters?.order === "asc"
        ? asc(appointmentsTable.dataHora)
        : desc(appointmentsTable.dataHora);

    const query = db
      .select()
      .from(appointmentsTable)
      .orderBy(order);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  }

  async findById(id: number) {
    const [appointment] = await db
      .select({
        id: appointmentsTable.id,
        clienteNome: appointmentsTable.clienteNome,
        clienteTelefone: appointmentsTable.clienteTelefone,
        dataHora: appointmentsTable.dataHora,
        barbeiroId: appointmentsTable.barbeiroId,
        duracaoMinutos: appointmentsTable.duracaoMinutos, 

        barbeiroNome: barbersTable.nome,
        barbeiroTelefone: barbersTable.telefone,
      })
      .from(appointmentsTable)
      .leftJoin(
        barbersTable,
        eq(barbersTable.id, appointmentsTable.barbeiroId)
      )
      .where(eq(appointmentsTable.id, id));

    return appointment ?? null;
  }

 async findByDate(barberId: number, dateStr: string) {
  const selectedDate = DateTime.fromDateOnly(dateStr);

  const startOfDay = selectedDate.startOfDay().toDate();
  const endOfDay = selectedDate.endOfDay().toDate();

  return db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.barbeiroId, barberId),
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

  async listByClientPhone(clientPhone: string): Promise<IClientAppointment[]> {
   try{
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
   } catch(error){
    console.error(`Erro ao listar agendamentos para o telefone ${clientPhone}:`, error);
    throw new Error("Não foi possível buscar os agendamentos no momento.");
   }
  }

  async create(data: { clienteNome: string; clienteTelefone: string; dataHora: Date; barbeiroId: number, duracaoMinutos: number }) {
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

  async getStatsToday(barberId: number) {
   const now = DateTime.now();

  const startToday = now.startOfDay().toDate();
  const endToday = now.endOfDay().toDate();

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
    const bookedTimes = bookedAppointments.map((app) =>
  DateTime.fromDate(app.dataHora).formatTime()
);

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
   const horaSlot = `${hour.toString().padStart(2, "0")}:00`;
   
   const estaOcupado = bookedTimes.includes(horaSlot);

  const estaBloqueado = bloqueios.some((b) => {
    if (b.tipo === "data") return true;

    if (b.tipo === "horario" && b.horaInicio && b.horaFim) {
      return horaSlot >= b.horaInicio && horaSlot <= b.horaFim;
    }

    return false;
  });

  if (!estaOcupado && !estaBloqueado) {
    allSlots.push(`${date}T${horaSlot}:00`);
  }
}

    return allSlots;
  }

  async findBookedSlotsByDate(barberId: number, date: string): Promise<IBookedSlot[]> {


  const inicioDia = DateTime.fromDateOnly(date)
  .startOfDay()
  .toDate();

const fimDia = DateTime.fromDateOnly(date)
  .endOfDay()
  .toDate();

  const result = await db
    .select({
      dataHora: appointmentsTable.dataHora,
      duracaoMinutos: appointmentsTable.duracaoMinutos,
    })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.barbeiroId, barberId),
        gte(appointmentsTable.dataHora, inicioDia),
        lte(appointmentsTable.dataHora, fimDia)
      )
    );

  return result.map(app => ({
    inicio: DateTime.fromDate(app.dataHora).formatTime(),
    duracao: app.duracaoMinutos
  }));
  } 

  async findRecebimentosByPeriod(startDate: string, endDate: string, barberId?: number) {
  const inicio = DateTime.fromDateOnly(startDate).startOfDay().toDate();
  const fim = DateTime.fromDateOnly(endDate).endOfDay().toDate();

  const conditions = [
    gte(appointmentsTable.dataHora, inicio),
    lte(appointmentsTable.dataHora, fim)
  ];

  if (barberId) {
    conditions.push(eq(appointmentsTable.barbeiroId, barberId));
  }

  // Busca os agendamentos, junta com os serviços e agrupa calculando o valor total de cada atendimento
  
  const results = await db
    .select({
      id: appointmentsTable.id,
      dataHora: appointmentsTable.dataHora,
      cliente: appointmentsTable.clienteNome,
      valorTotal: sum(servicesTable.preco).as("valorTotal"),
      // Se quiser agrupar os nomes dos serviços em uma string ou array, 
      // dependendo do banco você pode usar agregações, ou tratar no service.
    })
    .from(appointmentsTable)
    .leftJoin(
      appointmentServicesTable,
      eq(appointmentServicesTable.appointmentId, appointmentsTable.id)
    )
    .leftJoin(
      servicesTable,
      eq(servicesTable.id, appointmentServicesTable.serviceId)
    )
    .where(and(...conditions))
    .groupBy(appointmentsTable.id, appointmentsTable.clienteNome, appointmentsTable.dataHora)
    .orderBy(desc(appointmentsTable.dataHora));

  return results;
}
}