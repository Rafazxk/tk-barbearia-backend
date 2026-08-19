import webpush, { type PushSubscription } from 'web-push';
import { PushSubscriptionRepository } from './repositories/PushSubscriptionRepository.js';
import { BarbersRepository } from '../../modules/auth/repositories/BarbersRepository.js';

webpush.setVapidDetails(
  'mailto:contato@suabarbearia.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class PushNotificationService {
  constructor(
      private repository: PushSubscriptionRepository,
      private barbersRepository: BarbersRepository
    ) {}

  async subscribe(barberId: number, subscription: PushSubscription) {

    const existing =
        await this.repository.findByEndpoint(subscription.endpoint);

    if (existing) {
        return;
    }

    await this.repository.save(barberId, subscription);
}

  async sendToBarber(barberId: number, title: string, body: string) {
  console.log("🔔 INICIANDO ENVIO DE PUSH");
  console.log("👤 Barber ID:", barberId);

  const notificacoesAtivas =
    await this.barbersRepository.getNotificacoesNovoAgendamento(barberId);

  console.log(
    "🔔 Notificações de novo agendamento:",
    notificacoesAtivas
  );

  if (!notificacoesAtivas) {
    console.log("🔕 Push não enviado: preferência desativada.");
    return;
  }

  const subscriptions =
    await this.repository.findByBarberId(barberId);

  console.log("📱 Subscriptions encontradas:", subscriptions.length);

  const payload = JSON.stringify({ title, body });

  for (const sub of subscriptions) {
    try {
      const data = JSON.parse(sub.subscriptionData) as PushSubscription;

      const response = await webpush.sendNotification(data, payload);

      console.log("✅ PUSH ENVIADO COM SUCESSO");
      console.log("📡 Status:", response.statusCode);

    } catch (err: any) {
      console.error("ERRO AO ENVIAR PUSH");
      console.error(err);

      if (err.statusCode === 410) {
        await this.repository.delete(sub.id);
      }
    }
  }
}
}