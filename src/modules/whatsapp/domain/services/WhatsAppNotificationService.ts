import  type { MessageProvider } from "../interfaces/MessageProvider.js";
import { appointmentCreatedTemplate } from "../templates/AppointmentCreatedTemplate.js";

export class WhatsAppNotificationService {

  constructor(
    private readonly provider: MessageProvider
  ) {}

  async notifyAppointmentCreated(
    phone: string,
    client: string,
    service: string,
    barber: string,
    date: string
  ) {

    const message =
      appointmentCreatedTemplate(
        client,
        service,
        barber,
        date
      );

    await this.provider.sendText(
      phone,
      message
    );

  }

}