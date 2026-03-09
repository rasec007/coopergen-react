CREATE TABLE "cooperativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nickname" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	"name" varchar(255) NOT NULL,
	"responsible" varchar(255),
	"status" varchar(20) DEFAULT 'Ativo' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cooperativas_email_unique" UNIQUE("email")
);
