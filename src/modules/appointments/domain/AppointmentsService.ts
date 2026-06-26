import { type IAppointmentsRepository, type IAppointmentsFilters } from "../repositories/IAppointmentsRepository.js";

export class AppointmentsService {
  constructor(private appointmentsRepository: IAppointmentsRepository) {}

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

  // Ajustado aqui: adicionado "| undefined" para casar perfeitamente com o Zod e o tsconfig
  async createAppointment(data: { 
    clienteNome: string; 
    clienteTelefone: string; 
    dataHora: string; 
    barbeiroId: number; 
    servicoIds?: number[] | undefined; 
  }) {
    const appointment = await this.appointmentsRepository.create({
      clienteNome: data.clienteNome,
      clienteTelefone: data.clienteTelefone,
      dataHora: new Date(data.dataHora),
      barbeiroId: data.barbeiroId,
    });

    if (data.servicoIds?.length) {
      await this.appointmentsRepository.linkServices(appointment.id, data.servicoIds);
    }

    const [result] = await this.enrich([appointment]);
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