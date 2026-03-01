-- Fix: RLS policy "Anyone can update vote counts" allows anonymous users to
-- modify ANY column. Replace with a SECURITY DEFINER function that only
-- increments upvotes/downvotes, and revoke direct UPDATE access entirely.

-- 1. Drop the overly-permissive UPDATE policies
DROP POLICY IF EXISTS "Anyone can update vote counts" ON public.pharmacy_reports;
DROP POLICY IF EXISTS "Anyone can vote on reports"    ON public.pharmacy_reports;

-- 2. Create a secure RPC that only increments vote columns
CREATE OR REPLACE FUNCTION public.vote_report(report_id UUID, vote_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with table-owner privileges
SET search_path = public  -- prevent search_path hijacking
AS $$
BEGIN
  IF vote_type = 'up' THEN
    UPDATE public.pharmacy_reports
       SET upvotes = upvotes + 1
     WHERE id = report_id;
  ELSIF vote_type = 'down' THEN
    UPDATE public.pharmacy_reports
       SET downvotes = downvotes + 1
     WHERE id = report_id;
  ELSE
    RAISE EXCEPTION 'vote_type must be "up" or "down"';
  END IF;

  -- Verify the row existed
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report % not found', report_id;
  END IF;
END;
$$;

-- 3. Allow anonymous/authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.vote_report(UUID, TEXT) TO anon, authenticated;
