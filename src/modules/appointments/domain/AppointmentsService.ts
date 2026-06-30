import { type IAppointmentsRepository, type IAppointmentsFilters } from "../repositories/IAppointmentsRepository.js";
import { SocketService } from "../../../shared/SocketService.js";

export class AppointmentsService {
  constructor(private appointmentsRepository: IAppointmentsRepository) {}

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
}