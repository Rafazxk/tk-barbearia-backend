ALTER TABLE "expediente_config" ALTER COLUMN "hora_abertura" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "expediente_config" ALTER COLUMN "hora_abertura" SET DEFAULT '09:00';--> statement-breakpoint
ALTER TABLE "expediente_config" ALTER COLUMN "hora_abertura" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expediente_config" ALTER COLUMN "hora_fechamento" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "expediente_config" ALTER COLUMN "hora_fechamento" SET DEFAULT '19:00';--> statement-breakpoint
ALTER TABLE "expediente_config" ALTER COLUMN "hora_fechamento" SET NOT NULL;