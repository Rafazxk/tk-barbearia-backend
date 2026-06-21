CREATE TABLE "agendamento_servicos" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer NOT NULL,
	"service_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agendamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_nome" varchar(255) NOT NULL,
	"cliente_telefone" varchar(20) NOT NULL,
	"data_hora" timestamp NOT NULL,
	"barbeiro_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "barbeiros" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"senha" varchar(255) NOT NULL,
	"foto" varchar(255),
	"role" varchar(50) DEFAULT 'barber',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "barbeiros_email_unique" UNIQUE("email"),
	CONSTRAINT "barbeiros_senha_unique" UNIQUE("senha")
);
--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"ordem" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "servicos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"duracao_minutos" integer NOT NULL,
	"categoria_id" integer,
	"ordem" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "agendamento_servicos_appointment_id_agendamentos_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."agendamentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamento_servicos" ADD CONSTRAINT "agendamento_servicos_service_id_servicos_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."servicos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_barbeiro_id_barbeiros_id_fk" FOREIGN KEY ("barbeiro_id") REFERENCES "public"."barbeiros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;