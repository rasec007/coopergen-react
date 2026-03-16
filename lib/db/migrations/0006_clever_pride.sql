CREATE TABLE "whatsapp_sessions" (
	"phone_number" varchar(20) PRIMARY KEY NOT NULL,
	"step" varchar(50) DEFAULT 'START' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
