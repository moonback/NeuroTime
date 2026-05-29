


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."save_payment_with_missions"("payment_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  mission_ids uuid[];
  payment_uuid uuid;
BEGIN
  payment_uuid := (payment_payload->>'id')::uuid;

  SELECT COALESCE(array_agg(value::uuid), '{}')
  INTO mission_ids
  FROM jsonb_array_elements_text(COALESCE(payment_payload->'missionIds', '[]'::jsonb));

  INSERT INTO payments (
    id,
    user_id,
    date,
    amount,
    client,
    description,
    reference,
    mission_ids,
    method,
    created_at,
    updated_at
  ) VALUES (
    payment_uuid,
    auth.uid(),
    (payment_payload->>'date')::date,
    (payment_payload->>'amount')::numeric,
    payment_payload->>'client',
    payment_payload->>'description',
    payment_payload->>'reference',
    mission_ids,
    COALESCE(payment_payload->>'method', 'virement'),
    COALESCE((payment_payload->>'createdAt')::timestamptz, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    date = EXCLUDED.date,
    amount = EXCLUDED.amount,
    client = EXCLUDED.client,
    description = EXCLUDED.description,
    reference = EXCLUDED.reference,
    mission_ids = EXCLUDED.mission_ids,
    method = EXCLUDED.method,
    updated_at = NOW();

  UPDATE missions
  SET payment_id = payment_uuid,
      is_paid = true,
      updated_at = NOW()
  WHERE user_id = auth.uid()
    AND id = ANY(mission_ids);
END;
$$;


ALTER FUNCTION "public"."save_payment_with_missions"("payment_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_payment_with_missions"("p_payment_id" "uuid", "p_user_id" "uuid", "p_date" "date", "p_amount" numeric, "p_client" "text", "p_description" "text", "p_reference" "text", "p_mission_ids" "uuid"[], "p_method" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Vérification propriétaire
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé : user_id ne correspond pas à auth.uid()';
  END IF;

  -- Upsert du paiement
  INSERT INTO payments (id, user_id, date, amount, client, description, reference, mission_ids, method)
  VALUES (
    COALESCE(p_payment_id, gen_random_uuid()),
    p_user_id,
    p_date,
    p_amount,
    p_client,
    p_description,
    p_reference,
    p_mission_ids,
    p_method
  )
  ON CONFLICT (id) DO UPDATE SET
    amount      = EXCLUDED.amount,
    description = EXCLUDED.description,
    reference   = EXCLUDED.reference,
    mission_ids = EXCLUDED.mission_ids,
    updated_at  = now();

  -- Mise à jour atomique des missions associées
  UPDATE missions
  SET
    payment_id = COALESCE(p_payment_id, gen_random_uuid()),
    is_paid    = true,
    updated_at = now()
  WHERE
    user_id = p_user_id
    AND id  = ANY(p_mission_ids);
END;
$$;


ALTER FUNCTION "public"."save_payment_with_missions"("p_payment_id" "uuid", "p_user_id" "uuid", "p_date" "date", "p_amount" numeric, "p_client" "text", "p_description" "text", "p_reference" "text", "p_mission_ids" "uuid"[], "p_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "target" numeric(10,2) NOT NULL,
    "period" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "goals_period_check" CHECK (("period" = ANY (ARRAY['month'::"text", 'year'::"text"]))),
    CONSTRAINT "goals_type_check" CHECK (("type" = ANY (ARRAY['revenue'::"text", 'missions'::"text", 'hours'::"text"])))
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "client" "text",
    "location" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "text" NOT NULL,
    "rate_type" "text" NOT NULL,
    "hourly_rate" numeric(10,2) DEFAULT 0,
    "total_earnings" numeric(10,2) DEFAULT 0,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "time_slots" "jsonb",
    "is_paid" boolean DEFAULT false,
    "payment_id" "uuid",
    CONSTRAINT "chk_missions_time_order" CHECK (("end_time" > "start_time")),
    CONSTRAINT "missions_rate_type_check" CHECK (("rate_type" = ANY (ARRAY['day'::"text", 'night'::"text", 'mixed'::"text", 'custom'::"text"]))),
    CONSTRAINT "missions_status_check" CHECK (("status" = ANY (ARRAY['planned'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."missions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."missions"."time_slots" IS 'Tableau de créneaux horaires pour une même journée. Format: [{"startTime": "HH:mm", "endTime": "HH:mm"}]';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "client" "text" NOT NULL,
    "description" "text",
    "reference" "text",
    "mission_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "method" "text" DEFAULT 'virement'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_type_period_key" UNIQUE ("user_id", "type", "period");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_type_period_unique" UNIQUE ("user_id", "type", "period");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_clients_name" ON "public"."clients" USING "btree" ("name");



CREATE INDEX "idx_clients_user_id" ON "public"."clients" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_clients_user_name_unique" ON "public"."clients" USING "btree" ("user_id", "lower"("name"));



CREATE INDEX "idx_goals_user_id" ON "public"."goals" USING "btree" ("user_id");



CREATE INDEX "idx_goals_user_type_period" ON "public"."goals" USING "btree" ("user_id", "type", "period");



CREATE INDEX "idx_missions_is_paid" ON "public"."missions" USING "btree" ("is_paid");



CREATE INDEX "idx_missions_payment_id" ON "public"."missions" USING "btree" ("payment_id");



CREATE INDEX "idx_missions_start_time" ON "public"."missions" USING "btree" ("start_time" DESC);



CREATE INDEX "idx_missions_status" ON "public"."missions" USING "btree" ("status");



CREATE INDEX "idx_missions_user_id" ON "public"."missions" USING "btree" ("user_id");



CREATE INDEX "idx_missions_user_payment" ON "public"."missions" USING "btree" ("user_id", "payment_id");



CREATE INDEX "idx_missions_user_start_time" ON "public"."missions" USING "btree" ("user_id", "start_time" DESC);



CREATE INDEX "idx_missions_user_status_paid" ON "public"."missions" USING "btree" ("user_id", "status", "is_paid");



CREATE INDEX "idx_payments_user_client" ON "public"."payments" USING "btree" ("user_id", "client");



CREATE INDEX "idx_payments_user_date" ON "public"."payments" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_missions_updated_at" BEFORE UPDATE ON "public"."missions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_goals_updated_at" BEFORE UPDATE ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_missions_updated_at" BEFORE UPDATE ON "public"."missions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "fk_missions_payment_id" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete own clients" ON "public"."clients" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own goals" ON "public"."goals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own missions" ON "public"."missions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own payments" ON "public"."payments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own clients" ON "public"."clients" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own goals" ON "public"."goals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own missions" ON "public"."missions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own payments" ON "public"."payments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own payments" ON "public"."payments" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own payments" ON "public"."payments" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own clients" ON "public"."clients" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own goals" ON "public"."goals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own missions" ON "public"."missions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own payments" ON "public"."payments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own clients" ON "public"."clients" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own goals" ON "public"."goals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own missions" ON "public"."missions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."missions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("payment_payload" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("payment_payload" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("payment_payload" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("p_payment_id" "uuid", "p_user_id" "uuid", "p_date" "date", "p_amount" numeric, "p_client" "text", "p_description" "text", "p_reference" "text", "p_mission_ids" "uuid"[], "p_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("p_payment_id" "uuid", "p_user_id" "uuid", "p_date" "date", "p_amount" numeric, "p_client" "text", "p_description" "text", "p_reference" "text", "p_mission_ids" "uuid"[], "p_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_payment_with_missions"("p_payment_id" "uuid", "p_user_id" "uuid", "p_date" "date", "p_amount" numeric, "p_client" "text", "p_description" "text", "p_reference" "text", "p_mission_ids" "uuid"[], "p_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON TABLE "public"."missions" TO "anon";
GRANT ALL ON TABLE "public"."missions" TO "authenticated";
GRANT ALL ON TABLE "public"."missions" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


