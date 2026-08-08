import { type IAppointmentsRepository, type IAppointmentsFilters, type IAppointmentEnriched } from "../repositories/IAppointmentsRepository.js";
import { type IBusinessHoursRepository, type IBusinessHoursInput } from "../repositories/IBusinessHoursRepository.js";
import { SocketService } from "../../../shared/SocketService.js";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";
import { WhatsappService } from "../../whatsapp/domain/WhatsappService.js";
import { type IBarbersRepository } from "../../auth/repositories/IBarbersRepository.js";
import { Time } from "../../../shared/time/Time.js";
import { PushNotificationService } from "../../../shared/notifications/PushNotificationService.js";
import { DateTime } from "../../../shared/time/DateTime.js";

interface AppointmentBase {
  id: number;
  clienteNome: string;
  clienteTelefone: string;
  dataHora: Date;
  barbeiroId: number;
  duracaoMinutos: number;
  status: string;
}

export interface UpdateAppointmentDTO {
  clienteNome?: string;
  clienteTelefone?: string;
  dataHora?: string;
  barbeiroId?: number;
  duracao?: number;
  servicoIds?: number[];
}

export class AppointmentsService {
  private appointmentsRepository: IAppointmentsRepository;
  private businessHoursRepository: IBusinessHoursRepository;
  private scheduleBlocksRepository: ScheduleBlocksRepository;
  private whatsappService: WhatsappService;
  private barbersRepository: IBarbersRepository;
  private pushService: PushNotificationService;

  constructor(
    appointmentsRepository: IAppointmentsRepository,
    businessHoursRepository: IBusinessHoursRepository,
    scheduleBlocksRepository: ScheduleBlocksRepository,
    whatsappService: WhatsappService,
    barbersRepository: IBarbersRepository,
    pushService: PushNotificationService
  ) {
    this.appointmentsRepository = appointmentsRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.scheduleBlocksRepository = scheduleBlocksRepository;
    this.whatsappService = whatsappService;
    this.barbersRepository = barbersRepository;
    this.pushService = pushService;
  }

  async getFrequentClients(barberId?: number) {
    
    const frequentClients = await this.appointmentsRepository.findFrequentClients(barberId);

    return frequentClients;
  }

  
  private async enrich(baseAppointments: AppointmentBase[]) {
  return await Promise.all(
    baseAppointments.map(async (app) => {
      const services = await this.appointmentsRepository.findServicesByAppointmentId(app.id);
      const totalPreco = services.reduce((sum, s) => sum + Number(s.preco), 0);
      
      // Prioriza a duração salva no agendamento (app.duracaoMinutos). Se não houver, soma os serviços.
      const totalDuracao = app.duracaoMinutos ?? services.reduce((sum, s) => sum + s.duracaoMinutos, 0);

      return {
        id: app.id,
        clienteNome: app.clienteNome,
        clienteTelefone: app.clienteTelefone,

        dataHora: DateTime
          .fromDate(app.dataHora)
          .toLocalISOString(),

        barbeiroId: app.barbeiroId,
        servicos: services,
        totalPreco,
        totalDuracao,
        statusVisual: this.getStatusVisual({
          dataHora: app.dataHora,
          totalDuracao,
        }),
      };
    })
  );
}

  async getDashboardSummary(barberId: number) {
    const stats = await this.appointmentsRepository.getStatsToday(barberId);

    return {
      appointmentsToday: stats.appointmentsToday,
      pendingCount: 0,
      revenueToday: stats.revenueToday,
      appointmentsThisWeek: stats.appointmentsThisWeek,
      topService: "Corte degradê"
    };
  }

 async list(filters?: IAppointmentsFilters) {
  // Garante que se houver um filtro de barbeiro, ele seja repassado corretamente
  const base = await this.appointmentsRepository.findAll(filters);
  return this.enrich(base);
}

  async getById(id: number) {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) return null;
    const [enriched] = await this.enrich([appointment]);
    return enriched;
  }

  async listByClientPhone(phone: string) {
    return await this.appointmentsRepository.listByClientPhone(phone);
  }

 async createAppointment(data: {
  clienteNome: string;
  clienteTelefone: string;
  dataHora: string;
  barbeiroId: number;
  duracao: number;
  servicoIds?: number[] | undefined;
}) {


  if (!data.dataHora) {
    throw new Error("A data e hora do agendamento são obrigatórias.");
  }

  // Tratamento seguro para evitar erros de undefined
  const parts = data.dataHora.split("T");
  const datePart = parts[0] ?? "";
  const timePart = parts[1] ?? "00:00:00";

  const datePieces = datePart.split("-").map(Number);
  const year = datePieces[0] ?? new Date().getFullYear();
  const month = datePieces[1] ?? 1;
  const day = datePieces[2] ?? 1;

  const timePieces = timePart.split(".")[0]?.split(":").map(Number) ?? [0, 0, 0];
  const hour = timePieces[0] ?? 0;
  const minute = timePieces[1] ?? 0;
  const second = timePieces[2] ?? 0;

  // Cria o objeto Date preservando exatamente o horário local
  const dataAgendamento = DateTime.fromLocalString(data.dataHora);

  const appointment = await this.appointmentsRepository.create({
    clienteNome: data.clienteNome,
    clienteTelefone: data.clienteTelefone,
    dataHora: dataAgendamento.toDate(),
    barbeiroId: data.barbeiroId,
    duracaoMinutos: data.duracao,
  });

  if (data.servicoIds?.length) {
    await this.appointmentsRepository.linkServices(appointment.id, data.servicoIds);
  }

  const [result] = await this.enrich([appointment]);
  if (!result) throw new Error("Erro ao enriquecer o agendamento.");

  const barber = await this.barbersRepository.findById(result.barbeiroId);
  if (!barber) throw new Error("Barbeiro não encontrado.");

  SocketService.sendNotificationToBarber(result.barbeiroId, "Novo Agendamento", {
    id: result.id,
    clienteNome: result.clienteNome,
    dataHora: result.dataHora,
    totalPreco: result.totalPreco,
    totalDuracao: result.totalDuracao,
    servicos: result.servicos.map((s: any) => s.nome)
  });

  try {
    await this.whatsappService.notifyClientAppointmentCreated({
      clienteNome: result.clienteNome,
      clienteTelefone: result.clienteTelefone,
      dataHora: result.dataHora,
      barbeiroNome: barber.nome,
      servicos: result.servicos.map((s: any) => s.nome),
      totalPreco: result.totalPreco
    });
  } catch (error) {
    console.error("Erro ao enviar WhatsApp para o cliente:", error);
  }

  const dataFormatada = DateTime.fromDate(appointment.dataHora).formatTime();

  try {
    await this.pushService.sendToBarber(
      result.barbeiroId,
      "Novo Agendamento! ✂️",
      `Cliente ${result.clienteNome} agendou para ${dataFormatada}`
    );
  } catch (err) {
    console.error("Falha ao enviar push:", err);
  }


  return result;
}

  async updateAppointment(
  id: number,
  body: UpdateAppointmentDTO
) {
  const updateData: any = {};

  if (body.clienteNome !== undefined) {
    updateData.clienteNome = body.clienteNome;
  }

  if (body.clienteTelefone !== undefined) {
    updateData.clienteTelefone = body.clienteTelefone;
  }

  if (body.dataHora) {
    updateData.dataHora = DateTime
      .fromLocalString(body.dataHora)
      .toDate();
  }

  if (body.barbeiroId !== undefined) {
    updateData.barbeiroId = body.barbeiroId;
  }

  if (body.duracao !== undefined) {
    updateData.duracaoMinutos = body.duracao;
  }

  const updated = await this.appointmentsRepository.update(id, updateData);

  if (!updated) {
    return null;
  }

  if (body.servicoIds) {
    await this.appointmentsRepository.unlinkServices(id);

    if (body.servicoIds.length > 0) {
      await this.appointmentsRepository.linkServices(
        id,
        body.servicoIds
      );
    }
  }

  const [result] = await this.enrich([updated]);

  if (!result) {
    throw new Error("Erro ao enriquecer o agendamento.");
  }

  const barber = await this.barbersRepository.findById(result.barbeiroId);

  // Socket (tempo real)
  SocketService.sendNotificationToBarber(
    result.barbeiroId,
    "Agendamento Atualizado",
    {
      id: result.id,
      clienteNome: result.clienteNome,
      dataHora: result.dataHora,
      totalPreco: result.totalPreco,
      totalDuracao: result.totalDuracao,
      servicos: result.servicos.map((s: any) => s.nome),
    }
  );


  // Push Notification
  try {
    const dataFormatada = DateTime
      .fromLocalString(result.dataHora)
      .formatTime();

    await this.pushService.sendToBarber(
      result.barbeiroId,
      "Agendamento alterado ✏️",
      `Cliente ${result.clienteNome} alterou o agendamento para ${dataFormatada}`
    );
  } catch (err) {
    console.error("Falha ao enviar push:", err);
  }

  return result;
}

  async deleteAppointment(id: number) {
  const appointment = await this.getById(id);

  if (!appointment) {
    return null;
  }

  await this.appointmentsRepository.delete(id);

  SocketService.sendNotificationToBarber(
    appointment.barbeiroId,
    "Agendamento Excluído",
    {
      id: appointment.id,
      clienteNome: appointment.clienteNome,
      dataHora: appointment.dataHora,
    }
  );

  await this.pushService.sendToBarber(
    appointment.barbeiroId,
    "Agendamento cancelado ❌",
    `${appointment.clienteNome} cancelou o agendamento.`
  );

  return true;
}

  async listAvailableSlots(barberId: number, date: string): Promise<string[]> {
  const numericBarberId = Number(barberId);

  const dataParsed = DateTime.fromDateOnly(date);
  const diaSemana = dataParsed.toDate().getDay();

  const scheduleConfigs = await this.businessHoursRepository.getSchedule(numericBarberId);

  const configDia = scheduleConfigs.find(
    (config: IBusinessHoursInput) => config.diaSemana === diaSemana
  );

  if (!configDia || !configDia.trabalha) {
    return [];
  }

  const abertura = new Time(configDia.horaAbertura);
  const fechamento = new Time(configDia.horaFechamento);

  const inicioAlmoco = configDia.horaInicioAlmoco
    ? new Time(configDia.horaInicioAlmoco)
    : null;

  const fimAlmoco = configDia.horaFimAlmoco
    ? new Time(configDia.horaFimAlmoco)
    : null;

  let minutosAbertura = abertura.toMinutes();
  let minutosFechamento = fechamento.toMinutes();

  const intervalo = configDia.intervaloMinutos;

  if (minutosFechamento < minutosAbertura) {
    minutosFechamento += 1440;
  }

  const slotsPadronizados: string[] = [];

  while (minutosAbertura + intervalo <= minutosFechamento) {
    const slot = Time.fromMinutes(minutosAbertura);

    const estaNoAlmoco =
      inicioAlmoco &&
      fimAlmoco &&
      slot.isBetween(inicioAlmoco, fimAlmoco);

    if (!estaNoAlmoco) {
      slotsPadronizados.push(slot.toString());
    }

    minutosAbertura += intervalo;
  }

  // 4. Buscar agendamentos e bloqueios reais no banco
  const [horariosOcupados, rawBloqueios] = await Promise.all([
    this.appointmentsRepository.findBookedSlotsByDate(numericBarberId, date),
    this.scheduleBlocksRepository.findBlocksByDate(numericBarberId, date)
  ]);

console.log(`🚨 [DEBUG DATA ${date}] Barbeiro ${numericBarberId} - Bloqueios vindos do banco:`, rawBloqueios);
console.log(`🚨 [DEBUG DATA ${date}] Barbeiro ${numericBarberId} - Slots de expediente gerados:`, slotsPadronizados.length);

  // BLINDAGEM EM MEMÓRIA: Filtra apenas bloqueios GLOBAIS (null) ou DO BARBEIRO ATUAL
  const bloqueios = rawBloqueios.filter((b) => {
    if (b.barbeiroId === null || b.barbeiroId === undefined) return true; // Bloqueio global
    return Number(b.barbeiroId) === numericBarberId;                      // Bloqueio do barbeiro
  });

  // 5. Verificar bloqueio de dia inteiro (tipo "data" OU sem horaInicio/fim)
  const bloqueioTotal = bloqueios.some(
    (b) => b.tipo === "data" || (!b.horaInicio && !b.horaFim)
  );

  if (bloqueioTotal) return [];

  // 6. Filtrar slots livres ignorando os horários ocupados/bloqueados
  const slotsLivres = slotsPadronizados.filter((slot) => {
    const horarioAtual = new Time(slot);

    // Verifica se já existe agendamento neste horário
    const ocupado = horariosOcupados.some((agendamento) => {
      const inicio = new Time(agendamento.inicio);
      const fim = inicio.addMinutes(agendamento.duracao);

      return horarioAtual.isBetween(inicio, fim) || horarioAtual.equals(inicio);
    });

    // Verifica se há bloqueio de horário parcial
    const bloqueado = bloqueios.some((b) => {
      if (!b.horaInicio || !b.horaFim) return false;

      const inicioBloqueio = new Time(b.horaInicio);
      const fimBloqueio = new Time(b.horaFim);

      return (
        horarioAtual.isBetween(inicioBloqueio, fimBloqueio) ||
        horarioAtual.equals(inicioBloqueio)
      );
    });

    return !ocupado && !bloqueado;
  });

  return slotsLivres;
}

  private getStatusVisual(appointment: {
    dataHora: Date;
    totalDuracao: number;
  }) {
    const agora = DateTime.now();

    const inicio = new DateTime(appointment.dataHora);

    const fim = inicio.addMinutes(appointment.totalDuracao);

    if (agora.isBefore(inicio)) {
      return "pendente";
    }

    if (agora.isBetween(inicio, fim)) {
      return "em_andamento";
    }

    return "concluido";
  }

  async getRecebimentos({ startDate, endDate, barberId }: { startDate: string; endDate: string; barberId?: number }) {
    const rawRecebimentos = await this.appointmentsRepository.findRecebimentosByPeriod(
      startDate,
      endDate,
      barberId
    );

    let totalPeriodo = 0;

    const items = rawRecebimentos.map((item) => {
      const valor = Number(item.valorTotal || 0);
      totalPeriodo += valor;

      return {
        data: DateTime.fromDate(item.dataHora),
        cliente: item.cliente,
        servico: "Serviço Realizado",
        valor: valor,
      };
    });

    return {
      items,
      totalPeriodo,
    };
  }
}

