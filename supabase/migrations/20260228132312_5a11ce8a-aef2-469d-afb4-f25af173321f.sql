
-- Create pharmacy_reports table
CREATE TABLE public.pharmacy_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('local', 'online')),
  pharmacy_name TEXT NOT NULL,
  address TEXT,
  website_url TEXT,
  medication TEXT NOT NULL,
  dose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in-stock', 'low-stock')),
  notes TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pharmacy_reports ENABLE ROW LEVEL SECURITY;

-- Public read access (community tracker, no auth required to view)
CREATE POLICY "Anyone can view reports"
  ON public.pharmacy_reports FOR SELECT
  USING (true);

-- Public insert access (anonymous reporting)
CREATE POLICY "Anyone can insert reports"
  ON public.pharmacy_reports FOR INSERT
  WITH CHECK (true);
