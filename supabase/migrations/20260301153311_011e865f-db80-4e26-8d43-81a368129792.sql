
CREATE POLICY "Anyone can update vote counts"
ON public.pharmacy_reports
FOR UPDATE
USING (true)
WITH CHECK (true);
