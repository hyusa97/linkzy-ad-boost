-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ad-images', 'ad-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Allow public to view ads (needed for ad funnel pages)
CREATE POLICY "Anyone can view ads" 
ON public.ads 
FOR SELECT 
USING (true);

-- Allow admins to manage ads
CREATE POLICY "Admins can insert ads" 
ON public.ads 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ads" 
ON public.ads 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ads" 
ON public.ads 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage policies for ad images
CREATE POLICY "Anyone can view ad images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'ad-images');

CREATE POLICY "Admins can upload ad images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'ad-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'ad-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'ad-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();