CREATE TABLE "expediente_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbeiro_id" integer,
	"dia_semana" integer NOT NULL,
	"dia_nome" varchar(20) NOT NULL,
	"trabalha" boolean DEFAULT true NOT NULL,
	"hora_abertura" varchar(5) DEFAULT '09:00' NOT NULL,
	"hora_fechamento" varchar(5) DEFAULT '19:00' NOT NULL,
	"intervalo_minutos" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
DROP TABLE "expediente_config" CASCADE;