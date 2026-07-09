import { type IAppointmentsRepository, type IAppointmentsFilters } from "../repositories/IAppointmentsRepository.js";
import { type IBusinessHoursRepository, type IBusinessHoursInput } from "../repositories/IBusinessHoursRepository.js";
import { SocketService } from "../../../shared/SocketService.js";
import { ScheduleBlocksRepository } from "../repositories/ScheduleBlocksRepository.js";

export class AppointmentsService {
  private appointmentsRepository: IAppointmentsRepository;
  private businessHoursRepository: IBusinessHoursRepository;
  private scheduleBlocksRepository: ScheduleBlocksRepository;

  constructor(
    appointmentsRepository: IAppointmentsRepository,
    businessHoursRepository: IBusinessHoursRepository,
    scheduleBlocksRepository: ScheduleBlocksRepository
  ) {
    this.appointmentsRepository = appointmentsRepository;
    this.businessHoursRepository = businessHoursRepository;
    this.scheduleBlocksRepository = scheduleBlocksRepository;
  }
 private timeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== "string") {
    throw new Error(`Formato de hora inválido. Recebido: ${typeof timeStr}`);
  }

  // 1. Limpa espaços, aspas simples ou duplas que possam vir grudadas na string
  const sanitized = timeStr.replace(/['"]/g, "").trim();

  // 2. Divide a string por ":" (trata "10:00:00" ou "10:00")
  const parts = sanitized.split(":");
  
  if (parts.length < 2) {
    throw new Error(`Erro ao converter hora para minutos. O delimitador ':' não foi encontrado. Recebido: '${timeStr}'`);
  }

  // 3. Extrai estritamente Hora e Minuto como números
  const hours = parseInt(parts[0] ?? "", 10);
  const minutes = parseInt(parts[1] ?? "", 10);

  // 4. Valida se a conversão gerou números válidos dentro do escopo de um relógio
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Erro ao converter hora para minutos. Valores numéricos inválidos. Recebido: '${timeStr}'`);
  }

  // 5. Retorna o cálculo matemático
  return hours * 60 + minutes;
}

  private minutesToTime(minutes: number): string {
    const totalMinutes = minutes % 1440; // Se passar de 24h, reinicia o relógio
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  async getFrequentClients(barberId?: number) {
    // Chama a query agregadora do Drizzle que criamos no passo anterior
    const frequentClients = await this.appointmentsRepository.findFrequentClients(barberId);
    
    return frequentClients;
  }
  
  // Helper privado para enriquecer agendamentos (reaproveitando o código antigo de soma)
  private async enrich(baseAppointments: any[]) {
    return await Promise.all(
      baseAppointments.map(async (app) => {
        const services = await this.appointmentsRepository.findServicesByAppointmentId(app.id);
        const totalPreco = services.reduce((sum, s) => sum + Number(s.preco), 0);
        const totalDuracao = services.reduce((sum, s) => sum + s.duracaoMinutos, 0);

        return {
          id: app.id,
          clienteNome: app.clienteNome,
          clienteTelefone: app.clienteTelefone,
          dataHora: app.dataHora,
          barbeiroId: app.barbeiroId,
          servicos: services,
          totalPreco,
          totalDuracao,
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
    servicoIds?: number[] | undefined; 
  }) {
    // 1. Cria o agendamento base no banco de dados
    const appointment = await this.appointmentsRepository.create({
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      dataHora: new Date(data.dataHora),
      barbeiroId: data.barbeiroId,
    });

    // 2. Vincula os serviços se eles existirem
    if (data.servicoIds?.length) {
      await this.appointmentsRepository.linkServices(appointment.id, data.servicoIds);
    }

    // 3. Enriquece o agendamento (calcula totais e busca nomes dos serviços)
    const [result] = await this.enrich([appointment]);

    if(!result) throw new Error("Erro ao enriquecer o agendamento.");

    // 4. DISPARO EM TEMPO REAL: Notifica o barbeiro específico com os dados completos
    SocketService.sendNotificationToBarber(
      result.barbeiroId,
      "new-appointment",
      {
        id: result.id,
        clienteNome: result.clienteNome,
        dataHora: result.dataHora,
        totalPreco: result.totalPreco,
        totalDuracao: result.totalDuracao,
        servicos: result.servicos.map((s: any) => s.nome) // Envia uma lista legível de nomes (ex: ["Corte", "Barba"])
      }
    );

    return result;
  }

  async updateAppointment(id: number, body: any) {
    const updateData: any = {};
    if (body.clienteNome !== undefined) updateData.clienteNome = body.clienteNome;
    if (body.clienteTelefone !== undefined) updateData.clienteTelefone = body.clienteTelefone;
    if (body.dataHora !== undefined) updateData.dataHora = new Date(body.dataHora);
    if (body.barbeiroId !== undefined) updateData.barbeiroId = body.barbeiroId;

    const updated = await this.appointmentsRepository.update(id, updateData);
    if (!updated) return null;

    if (body.servicoIds !== undefined) {
      await this.appointmentsRepository.unlinkServices(id);
      if (body.servicoIds.length) {
        await this.appointmentsRepository.linkServices(id, body.servicoIds);
      }
    }

    const [result] = await this.enrich([updated]);
    return result;
  }

  async deleteAppointment(id: number) {
    return await this.appointmentsRepository.delete(id);
  }

  async listAvailableSlots(barberId: number, date: string): Promise<string[]> {
    // 1. Descobrir o dia da semana da data que o usuário quer agendar (ex: "2026-07-06")
    const dataParsed = new Date(`${date}T00:00:00`);
    const diaSemana = dataParsed.getDay(); // Retorna 0 para Domingo, 1 para Segunda...

    // 2. Ir no banco buscar a configuração de turnos salva por esse barbeiro
    const scheduleConfigs = await this.businessHoursRepository.getSchedule(barberId);
    
    // Encontra a linha específica daquele dia da semana
    const configDia = scheduleConfigs.find((config: IBusinessHoursInput) => config.diaSemana === diaSemana);

    // Se o barbeiro configurou que não trabalha nesse dia, retorna nenhum slot disponível
    if (!configDia || !configDia.trabalha) {
      return [];
    }

    // 3. AQUI ENTRA A MATEMÁTICA QUE CONVERSAMOS:
    let minutosAbertura = this.timeToMinutes(configDia.horaAbertura);
    let minutosFechamento = this.timeToMinutes(configDia.horaFechamento);
    const intervalo = configDia.intervaloMinutos;

    // Se fechar na madrugada (ex: abre 22h e fecha 02h), somamos 24h em minutos ao fechamento
    if (minutosFechamento < minutosAbertura) {
      minutosFechamento += 1440;
    }

    const slotsPadronizados: string[] = [];

    // O loop gera todos os horários possíveis que o barbeiro pode trabalhar
    while (minutosAbertura + intervalo <= minutosFechamento) {
      slotsPadronizados.push(this.minutesToTime(minutosAbertura));
      minutosAbertura += intervalo; // Anda o relógio para o próximo slot (ex: +30 min)
    }

    // 4. Ir na tabela de agendamentos reais buscar o que já está ocupado

    const [horariosOcupados, bloqueios] = await Promise.all([
      this.appointmentsRepository.findBookedSlotsByDate(barberId, date),
      this.scheduleBlocksRepository.findBlocksByDate(barberId, date)
    ]);

    // 5. Filtrar a lista total tirando o que já está ocupado no banco
    const bloqueioTotal = bloqueios.some(b => b.horaInicio === null && b.horaFim === null);
    if (bloqueioTotal) return [];

  const slotsLivres = slotsPadronizados.filter(slot => 
      !horariosOcupados.includes(slot) && 
      !bloqueios.some(b => slot >= (b.horaInicio ?? "") && slot < (b.horaFim ?? ""))
    );
    console.log(`LOG DE PRODUÇÃO: Data ${date}, Barbeiro ${barberId}, Bloqueios encontrados: ${JSON.stringify(bloqueios)}`);
    // Retorna o array limpo de strings exatas: ["08:00", "08:30", "09:30"]
    return slotsLivres; 
  }
}

