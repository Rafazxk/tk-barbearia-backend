import { db } from "../../../database/index.js"; 
import { whatsappSettingsTable } from "../../../database/schema/whatsapp.schema.js";
import { eq } from "drizzle-orm";
import { type IWhatsappRepository } from "./IWhatsappRepository.js";
 
export class WhatsappRepository implements IWhatsappRepository {
  async findByBarberId(barberId: number) {
    const [result] = await db
      .select()
      .from(whatsappSettingsTable)
      .where(eq(whatsappSettingsTable.barberId, barberId));
    return result || null;
  }

  async upsertSettings(
    barberId: number, 
    data: { 
      receiveAdminNotifications: boolean; 
      sendClientNotifications: boolean; 
      welcomeMessageTemplate: string;
      sendReminderNotifications: boolean;
      reminderMessageTemplate: string;
    }
  ) {
    return await db
      .insert(whatsappSettingsTable)
      .values({
        barberId,
        ...data,
      })
      .onConflictDoUpdate({
        target: whatsappSettingsTable.barberId,
        set: {
          receiveAdminNotifications: data.receiveAdminNotifications,
          sendClientNotifications: data.sendClientNotifications,
          welcomeMessageTemplate: data.welcomeMessageTemplate,
          sendReminderNotifications: data.sendReminderNotifications,
          reminderMessageTemplate: data.reminderMessageTemplate,
          updatedAt: new Date()
        },
      })
      .returning();
  }
}