import webpush, { type PushSubscription } from 'web-push';
import { PushSubscriptionRepository } from './repositories/PushSubscriptionRepository.js';

webpush.setVapidDetails(
  'mailto:contato@suabarbearia.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class PushNotificationService {
  constructor(private repository: PushSubscriptionRepository) {}

  async subscribe(barberId: number, subscription: any) {
    return await this.repository.save(barberId, subscription);
  }

  async sendToBarber(barberId: number, title: string, body: string) {
    const subscriptions = await this.repository.findByBarberId(barberId);
    const payload = JSON.stringify({ title, body });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const data = JSON.parse(sub.subscriptionData) as PushSubscription;
        await webpush.sendNotification(data, payload);
      } catch (err: any) {
        if (err.statusCode === 410) { // Assinatura expirada/inválida
          await this.repository.delete(sub.id);
        }
      }
    });

    await Promise.all(sendPromises);
  }
}