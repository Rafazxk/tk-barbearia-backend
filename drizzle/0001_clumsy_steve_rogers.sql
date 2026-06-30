CREATE TABLE "whatsapp_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"barber_id" integer NOT NULL,
	"receive_admin_notifications" boolean DEFAULT false NOT NULL,
	"send_client_notifications" boolean DEFAULT false NOT NULL,
	"welcome_message_template" text DEFAULT 'Olá {cliente}, seu agendamento para {servico} foi confirmado para o dia {data} às {hora}!' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_settings_barber_id_unique" UNIQUE("barber_id")
);
--> statement-breakpoint
ALTER TABLE "whatsapp_settings" ADD CONSTRAINT "whatsapp_settings_barber_id_barbeiros_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbeiros"("id") ON DELETE cascade ON UPDATE no action;