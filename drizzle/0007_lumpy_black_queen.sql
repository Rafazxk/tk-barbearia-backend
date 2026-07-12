CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"barber_id" integer NOT NULL,
	"subscription_data" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
