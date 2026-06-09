-- PostgREST cannot resolve overloaded functions (returns HTTP 400).
-- Keep the explicit-parameter version used by the client.
DROP FUNCTION IF EXISTS public.save_payment_with_missions(jsonb);
