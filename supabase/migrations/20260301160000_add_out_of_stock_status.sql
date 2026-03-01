-- Allow 'out-of-stock' as a valid status value
ALTER TABLE public.pharmacy_reports
  DROP CONSTRAINT pharmacy_reports_status_check;

ALTER TABLE public.pharmacy_reports
  ADD CONSTRAINT pharmacy_reports_status_check
  CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock'));
