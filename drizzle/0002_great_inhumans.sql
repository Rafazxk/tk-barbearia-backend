CREATE TABLE "produto_categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"ordem" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" varchar(500),
	"preco" numeric(10, 2) NOT NULL,
	"estoque" integer DEFAULT 0,
	"imagem_url" varchar(1000),
	"categoria_id" integer NOT NULL,
	"ordem" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "agenda_bloqueios" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"descricao" varchar(255) NOT NULL,
	"data_inicio" date NOT NULL,
	"hora_inicio" time,
	"hora_fim" time,
	"barbeiro_id" integer
);
--> statement-breakpoint
CREATE TABLE "expediente_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"barbeiro_id" integer,
	"dia_semana" integer NOT NULL,
	"dia_nome" varchar(20) NOT NULL,
	"trabalha" boolean DEFAULT true NOT NULL,
	"hora_abertura" time DEFAULT '09:00:00',
	"hora_fechamento" time DEFAULT '19:00:00',
	"intervalo_minutos" integer DEFAULT 30 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barbeiros" DROP CONSTRAINT "barbeiros_senha_unique";--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_produto_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."produto_categorias"("id") ON DELETE cascade ON UPDATE no action;