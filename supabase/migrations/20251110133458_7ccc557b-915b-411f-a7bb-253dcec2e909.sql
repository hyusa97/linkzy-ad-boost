-- Add page_number column to ads table for funnel page placement
ALTER TABLE public.ads 
ADD COLUMN page_number integer NOT NULL DEFAULT 1 
CHECK (page_number >= 1 AND page_number <= 4);

-- Add index for better query performance
CREATE INDEX idx_ads_page_number ON public.ads(page_number);

-- Add comment for clarity
COMMENT ON COLUMN public.ads.page_number IS 'The funnel page number (1-4) where this ad should appear';