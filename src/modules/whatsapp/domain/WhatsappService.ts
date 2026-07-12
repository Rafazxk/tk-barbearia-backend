import { type MessageProvider } from "./interfaces/MessageProvider.js"

export class WhatsappService {
    constructor(
        private readonly messageProvider: MessageProvider
    ) { }

    async sendText(
        telefone: string,
        text: string
    ) {
        await this.messageProvider.sendText(
            "5581983084006",
            text
        );
    }

    async notifyAppointmentCreated(
        barber: any,
        appointment: any
    ) {

        const mensagem = `
📅 Novo agendamento

Cliente: ${appointment.clienteNome}
Telefone: ${appointment.clienteTelefone}

Serviços:
${appointment.servicos
                .map((s: any) => `• ${s.nome}`)
                .join("\n")}
`;

        await this.sendText(
            barber.telefone,
            mensagem
        );
    }

    async notifyAppointmentUpdated(barber: any, appointment: any){
        const mensagem = `
✏️ Agendamento alterado

Cliente: ${appointment.clienteNome}
Telefone: ${appointment.clienteTelefone}

Serviços:
${appointment.servicos.map((s: any) => `• ${s.nome}`).join("\n")}

Nova data:
${appointment.dataHora}
`;
        await this.sendText(
            barber.telefone,
            mensagem
        )
    }

    async notifyAppointmentDeleted(
    barber: any,
    appointment: any
) {

    const mensagem = `
❌ Agendamento cancelado

Cliente: ${appointment.clienteNome}
Telefone: ${appointment.clienteTelefone}

Serviços:
${appointment.servicos.map((s: any) => `• ${s.nome}`).join("\n")}

Data:
${appointment.dataHora}
`;

    await this.sendText(
        barber.telefone,
        mensagem
    );
}
}