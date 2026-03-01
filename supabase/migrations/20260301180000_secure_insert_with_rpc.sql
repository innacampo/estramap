-- Fix: Drop open INSERT policy and funnel all inserts through a
-- SECURITY DEFINER function with a DB-level rate-limit safety net.

-- 1. Drop the wide-open INSERT policy
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.pharmacy_reports;

-- 2. Create a secure insert function with built-in rate limiting
CREATE OR REPLACE FUNCTION public.create_report(
  p_type           TEXT,
  p_pharmacy_name  TEXT,
  p_medication     TEXT,
  p_dose           TEXT,
  p_status         TEXT,
  p_address        TEXT     DEFAULT NULL,
  p_website_url    TEXT     DEFAULT NULL,
  p_notes          TEXT     DEFAULT NULL,
  p_lat            DOUBLE PRECISION DEFAULT NULL,
  p_lng            DOUBLE PRECISION DEFAULT NULL
)
RETURNS SETOF public.pharmacy_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- DB-level safety net: reject if > 60 reports created globally in the last hour.
  -- The primary per-IP rate limit lives in the Express layer; this is a last resort
  -- to protect the database if the server layer is somehow bypassed.
  IF (
    SELECT count(*)
      FROM public.pharmacy_reports
     WHERE created_at > now() - interval '1 hour'
  ) >= 60 THEN
    RAISE EXCEPTION 'Too many reports submitted recently. Please try again later.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
    INSERT INTO public.pharmacy_reports
      (type, pharmacy_name, medication, dose, status,
       address, website_url, notes, lat, lng)
    VALUES
      (p_type, p_pharmacy_name, p_medication, p_dose, p_status,
       p_address, p_website_url, p_notes, p_lat, p_lng)
    RETURNING *;
END;
$$;

-- 3. Allow anon and authenticated roles to call the function
GRANT EXECUTE ON FUNCTION public.create_report(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION
) TO anon, authenticated;
