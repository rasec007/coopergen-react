ALTER TABLE "paystubs" ADD COLUMN "posto_trabalho_id" uuid;--> statement-breakpoint
ALTER TABLE "paystubs" ADD COLUMN "type" varchar(50) DEFAULT 'Contra Cheque';--> statement-breakpoint
ALTER TABLE "paystubs" ADD CONSTRAINT "paystubs_posto_trabalho_id_postos_trabalho_id_fk" FOREIGN KEY ("posto_trabalho_id") REFERENCES "public"."postos_trabalho"("id") ON DELETE no action ON UPDATE no action;