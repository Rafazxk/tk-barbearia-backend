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
    // Chama a query agregadora do Drizzle que criamos no passo anterior
    const frequentClients = await this.appointmentsRepository.findFrequentClients(barberId);

    return frequentClients;
  }

  
  private async enrich(baseAppointments: AppointmentBase[]) {
    return await Promise.all(
      baseAppointments.map(async (app) => {
        const services = await this.appointmentsRepository.findServicesByAppointmentId(app.id);
        const totalPreco = services.reduce((sum, s) => sum + Number(s.preco), 0);
        const totalDuracao = services.reduce((sum, s) => sum + s.duracaoMinutos, 0);
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
    // O service apenas delega a chamada para o repositório
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

    SocketService.sendNotificationToBarber(result.barbeiroId, "new-appointment", {
      id: result.id,
      clienteNome: result.clienteNome,
      dataHora: result.dataHora,
      totalPreco: result.totalPreco,
      totalDuracao: result.totalDuracao,
      servicos: result.servicos.map((s: any) => s.nome)
    });

    try {
      await this.whatsappService.notifyAppointmentCreated(barber, result);
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:");
    }
    const dataFormatada = DateTime.fromDate(appointment.dataHora).formatTime();

    console.log("data formatada", dataFormatada)

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

  if (barber) {
    try {
      await this.whatsappService.notifyAppointmentUpdated(barber, result);
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error);
    }
  }

  return result;
}

  async deleteAppointment(id: number) {
    return await this.appointmentsRepository.delete(id);
  }

  async listAvailableSlots(barberId: number, date: string): Promise<string[]> {
    const dataParsed = new Date(`${date}T00:00:00`);
    const diaSemana = dataParsed.getDay();

    const scheduleConfigs = await this.businessHoursRepository.getSchedule(barberId);

    const configDia = scheduleConfigs.find(
      (config: IBusinessHoursInput) => config.diaSemana === diaSemana
    );


    if (!configDia || !configDia.trabalha) {
      return [];
    }


    const abertura = new Time(configDia.horaAbertura);
    const fechamento = new Time(configDia.horaFechamento);

    const inicioAlmoco =
      configDia.horaInicioAlmoco
        ? new Time(configDia.horaInicioAlmoco)
        : null;

    const fimAlmoco =
      configDia.horaFimAlmoco
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

    // 4. Ir na tabela de agendamentos reais buscar o que já está ocupado

    const [horariosOcupados, bloqueios] = await Promise.all([
      this.appointmentsRepository.findBookedSlotsByDate(barberId, date),
      this.scheduleBlocksRepository.findBlocksByDate(barberId, date)
    ]);

    // 5. Filtrar a lista total tirando o que já está ocupado no banco
    const bloqueioTotal = bloqueios.some(b => b.horaInicio === null && b.horaFim === null);
    if (bloqueioTotal) return [];

    const slotsLivres = slotsPadronizados.filter(slot => {
      const horarioAtual = new Time(slot);

      const ocupado = horariosOcupados.some(agendamento => {
        const inicio = new Time(agendamento.inicio);
        const fim = inicio.addMinutes(agendamento.duracao);

        return horarioAtual.isBetween(inicio, fim);
      });

      const bloqueado = bloqueios.some(b =>
        slot >= (b.horaInicio ?? "") &&
        slot < (b.horaFim ?? "")
      );

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
}

