-- Allow public to update only upvotes/downvotes columns
CREATE POLICY "Anyone can vote on reports"
  ON public.pharmacy_reports FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- NOTE: This allows updating any column. For tighter security, consider
-- moving vote logic to a Supabase Edge Function or database function
-- that only increments upvotes/downvotes and nothing else.
-- Example:
--
-- CREATE OR REPLACE FUNCTION public.vote_report(report_id UUID, vote_type TEXT)
-- RETURNS void AS $$
-- BEGIN
--   IF vote_type = 'up' THEN
--     UPDATE public.pharmacy_reports SET upvotes = upvotes + 1 WHERE id = report_id;
--   ELSIF vote_type = 'down' THEN
--     UPDATE public.pharmacy_reports SET downvotes = downvotes + 1 WHERE id = report_id;
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
