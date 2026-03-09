CREATE TABLE "postos_trabalho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cooperativa_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "postos_trabalho_name_cooperativa_id_unique" UNIQUE("name","cooperativa_id")
);
--> statement-breakpoint
CREATE TABLE "cooperados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"cpf" varchar(14),
	"apelido" varchar(100),
	"matricula" varchar(20),
	"cooperativa_id" uuid,
	"posto_trabalho_id" uuid,
	"user_id" uuid,
	"perfil" varchar(50) DEFAULT 'Cooperado',
	"status" varchar(20) DEFAULT 'Ativo' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cooperados_email_unique" UNIQUE("email"),
	CONSTRAINT "cooperados_cpf_unique" UNIQUE("cpf"),
	CONSTRAINT "cooperados_matricula_unique" UNIQUE("matricula")
);
--> statement-breakpoint
CREATE TABLE "paystubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cooperado_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"valor_bruto" numeric(12, 2),
	"valor_liquido" numeric(12, 2),
	"file_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "postos_trabalho" ADD CONSTRAINT "postos_trabalho_cooperativa_id_cooperativas_id_fk" FOREIGN KEY ("cooperativa_id") REFERENCES "public"."cooperativas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperados" ADD CONSTRAINT "cooperados_cooperativa_id_cooperativas_id_fk" FOREIGN KEY ("cooperativa_id") REFERENCES "public"."cooperativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperados" ADD CONSTRAINT "cooperados_posto_trabalho_id_postos_trabalho_id_fk" FOREIGN KEY ("posto_trabalho_id") REFERENCES "public"."postos_trabalho"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cooperados" ADD CONSTRAINT "cooperados_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paystubs" ADD CONSTRAINT "paystubs_cooperado_id_cooperados_id_fk" FOREIGN KEY ("cooperado_id") REFERENCES "public"."cooperados"("id") ON DELETE cascade ON UPDATE no action;