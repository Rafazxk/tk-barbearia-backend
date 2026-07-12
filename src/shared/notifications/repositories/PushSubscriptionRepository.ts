import { db } from "../../../database/index.js";
import { pushSubscriptions } from "../../../database/schema/notification.js";
import { eq } from "drizzle-orm";

export class PushSubscriptionRepository {
  async save(barberId: number, subscriptionData: any) {
    return await db.insert(pushSubscriptions).values({
      barberId,
      subscriptionData: JSON.stringify(subscriptionData),
    });
  }

  async findByBarberId(barberId: number) {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.barberId, barberId));
  }

  async delete(id: number) {
    return await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }
}