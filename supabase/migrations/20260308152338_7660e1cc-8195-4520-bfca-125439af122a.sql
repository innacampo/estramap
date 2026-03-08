-- 1. Create vote_report SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.vote_report(report_id uuid, vote_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF vote_type NOT IN ('up', 'down') THEN
    RAISE EXCEPTION 'vote_type must be "up" or "down"';
  END IF;

  IF vote_type = 'up' THEN
    UPDATE public.pharmacy_reports SET upvotes = upvotes + 1 WHERE id = report_id;
  ELSE
    UPDATE public.pharmacy_reports SET downvotes = downvotes + 1 WHERE id = report_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.vote_report(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.vote_report(uuid, text) TO authenticated;

-- 2. Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can update vote counts" ON public.pharmacy_reports;