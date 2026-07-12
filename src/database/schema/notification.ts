import { pgTable, serial, varchar, timestamp, integer} from "drizzle-orm/pg-core";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull(), 
  subscriptionData: varchar("subscription_data").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});