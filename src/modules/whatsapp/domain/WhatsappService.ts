import { type MessageProvider } from "./interfaces/MessageProvider.js";

interface ServiceItem {
  nome: string;
  preco?: number;
}

interface AppointmentData {
  id?: number | string;
  clienteNome: string;
  clienteTelefone: string;
  dataHora: Date | string;
  servicos: ServiceItem[];
  totalPreco?: number;
}

interface BarberData {
  nome: string;
  telefone: string;
}

interface NotifyClientAppointmentDTO {
  clienteNome: string;
  clienteTelefone: string | null;
  dataHora: Date | string;
  barbeiroNome: string;
  servicos: (string | { nome: string })[];
  totalPreco?: number;
}

export class WhatsappService {
  constructor(private readonly messageProvider: MessageProvider) {}

  // 🛠️ Sanitiza o telefone removendo caracteres especiais e garantindo o DDI 55
  private sanitizePhone(telefone: string): string {
    let digits = telefone.replace(/\D/g, "");
    if (digits.length <= 11 && !digits.startsWith("55")) {
      digits = `55${digits}`;
    }
    return digits;
  }

  // 🛠️ Formata datas ISO para o padrão brasileiro (DD/MM/YYYY às HH:mm)
  private formatDate(dataHora: Date | string): string {
    const data = new Date(dataHora);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 🛠️ Formata valores monetários
  private formatCurrency(value?: number): string {
    if (value === undefined) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  async sendText(telefone: string, text: string) {
    const formattedPhone = this.sanitizePhone(telefone);
    await this.messageProvider.sendText(formattedPhone, text);
  }

  /* ========================================================================
     NOTIFICAÇÕES PARA O CLIENTE
     ======================================================================== */

  async notifyClientAppointmentCreated(data: NotifyClientAppointmentDTO) {
    if (!data.clienteTelefone) {
      console.warn("Cliente sem telefone cadastrado, mensagem não enviada.");
      return;
    }

    const servicosTexto = data.servicos
      .map((s) => (typeof s === "string" ? s : s.nome))
      .map((nome) => `• ${nome}`)
      .join("\n");

    const valor = data.totalPreco
      ? `\n💰 *Total:* ${this.formatCurrency(data.totalPreco)}`
      : "";

    const mensagem =
      `Olá, *${data.clienteNome}*! 👋\n\n` +
      `Seu agendamento foi realizado com sucesso!\n\n` +
      `📅 *Data/Hora:* ${this.formatDate(data.dataHora)}\n` +
      `💈 *Barbeiro:* ${data.barbeiroNome}\n` +
      `✂️ *Serviço(s):*\n${servicosTexto}${valor}\n\n` +
      `Te esperamos lá! Se precisar desmarcar, avise com antecedência.`;

    await this.sendText(data.clienteTelefone, mensagem);
  }

  async notifyClientAppointmentUpdated(
    clientTelefone: string,
    clientNome: string,
    appointment: AppointmentData
  ) {
    const mensagem =
      `Olá, *${clientNome}*! ✏️\n\n` +
      `Seu agendamento foi alterado para o novo horário:\n\n` +
      `📅 *Nova Data/Hora:* ${this.formatDate(appointment.dataHora)}\n\n` +
      `Qualquer dúvida, entre em contato conosco.`;

    await this.sendText(clientTelefone, mensagem);
  }

  async notifyClientAppointmentDeleted(
    clientTelefone: string,
    clientNome: string,
    appointment: AppointmentData
  ) {
    const mensagem =
      `Olá, *${clientNome}*! ❌\n\n` +
      `Infelizmente seu agendamento para *${this.formatDate(appointment.dataHora)}* foi cancelado.\n\n` +
      `Acesse nosso sistema para agendar um novo horário quando desejar.`;

    await this.sendText(clientTelefone, mensagem);
  }

  /* ========================================================================
     NOTIFICAÇÕES PARA O BARBEIRO
     ======================================================================== */

  async notifyAppointmentCreated(
    barber: BarberData,
    appointment: AppointmentData
  ) {
    const servicosTexto = appointment.servicos
      .map((s) => `• ${s.nome}`)
      .join("\n");

    const mensagem =
      `📅 *Novo agendamento*\n\n` +
      `👤 *Cliente:* ${appointment.clienteNome}\n` +
      `📞 *Telefone:* ${appointment.clienteTelefone}\n` +
      `🕒 *Data/Hora:* ${this.formatDate(appointment.dataHora)}\n\n` +
      `✂️ *Serviços:*\n${servicosTexto}`;

    await this.sendText(barber.telefone, mensagem);
  }

  async notifyAppointmentUpdated(
    barber: BarberData,
    appointment: AppointmentData
  ) {
    const servicosTexto = appointment.servicos
      .map((s) => `• ${s.nome}`)
      .join("\n");

    const mensagem =
      `✏️ *Agendamento alterado*\n\n` +
      `👤 *Cliente:* ${appointment.clienteNome}\n` +
      `📞 *Telefone:* ${appointment.clienteTelefone}\n\n` +
      `✂️ *Serviços:*\n${servicosTexto}\n\n` +
      `📅 *Nova Data/Hora:* ${this.formatDate(appointment.dataHora)}`;

    await this.sendText(barber.telefone, mensagem);
  }

  async notifyAppointmentDeleted(
    barber: BarberData,
    appointment: AppointmentData
  ) {
    const servicosTexto = appointment.servicos
      .map((s) => `• ${s.nome}`)
      .join("\n");

    const mensagem =
      `❌ *Agendamento cancelado*\n\n` +
      `👤 *Cliente:* ${appointment.clienteNome}\n` +
      `📞 *Telefone:* ${appointment.clienteTelefone}\n\n` +
      `✂️ *Serviços:*\n${servicosTexto}\n\n` +
      `📅 *Data/Hora:* ${this.formatDate(appointment.dataHora)}`;

    await this.sendText(barber.telefone, mensagem);
  }
}