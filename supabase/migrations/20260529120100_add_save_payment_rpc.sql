CREATE OR REPLACE FUNCTION save_payment_with_missions(
  p_payment_id  UUID,
  p_user_id     UUID,
  p_date        DATE,
  p_amount      NUMERIC,
  p_client      TEXT,
  p_description TEXT,
  p_reference   TEXT,
  p_mission_ids UUID[],
  p_method      TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Vérifier que l'appelant est bien le propriétaire (double sécurité RLS)
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Upsert atomique du paiement
  INSERT INTO payments (id, user_id, date, amount, client, description, reference, mission_ids, method)
  VALUES (p_payment_id, p_user_id, p_date, p_amount, p_client, p_description, p_reference, p_mission_ids, p_method)
  ON CONFLICT (id) DO UPDATE SET
    amount      = EXCLUDED.amount,
    description = EXCLUDED.description,
    reference   = EXCLUDED.reference,
    mission_ids = EXCLUDED.mission_ids,
    updated_at  = now();

  -- Mise à jour atomique des missions liées
  UPDATE missions
  SET
    payment_id = p_payment_id,
    is_paid    = true,
    updated_at = now()
  WHERE
    user_id = p_user_id
    AND id = ANY(p_mission_ids);
END;
$$;
