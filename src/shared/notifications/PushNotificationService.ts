import webpush, { type PushSubscription } from 'web-push';
import { PushSubscriptionRepository } from './repositories/PushSubscriptionRepository.js';

webpush.setVapidDetails(
  'mailto:contato@suabarbearia.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class PushNotificationService {
  constructor(private repository: PushSubscriptionRepository) {}

  async subscribe(barberId: number, subscription: PushSubscription) {

    const existing =
        await this.repository.findByEndpoint(subscription.endpoint);

    if (existing) {
        return;
    }

    await this.repository.save(barberId, subscription);
}

  async sendToBarber(barberId: number, title: string, body: string) {
  console.log("========== PUSH ==========");
  console.log("Barber:", barberId);

  const subscriptions = await this.repository.findByBarberId(barberId);

  console.log("Subscriptions encontradas:", subscriptions.length);

  const payload = JSON.stringify({ title, body });

  for (const sub of subscriptions) {
    try {
      const data = JSON.parse(sub.subscriptionData) as PushSubscription;

      console.log("Enviando para endpoint:");
      console.log(data.endpoint);

      const response = await webpush.sendNotification(data, payload);

      console.log("Resposta:", response.statusCode);

    } catch (err: any) {
      console.error("ERRO AO ENVIAR PUSH");
      console.error(err);

      if (err.statusCode === 410) {
        console.log("Subscription expirada. Removendo...");
        await this.repository.delete(sub.id);
      }
    }
  }
}
}