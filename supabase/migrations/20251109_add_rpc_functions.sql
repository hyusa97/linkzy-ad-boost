-- Function to resolve short code to original URL
CREATE OR REPLACE FUNCTION public.resolve_short_code(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE
  original_url TEXT;
BEGIN
  SELECT l.original_url INTO original_url
  FROM public.links l
  WHERE l.short_code = p_code;

  IF original_url IS NULL THEN
    RAISE EXCEPTION 'Short code not found';
  END IF;

  RETURN original_url;
END;
$$; 

-- Function to increment link clicks
CREATE OR REPLACE FUNCTION public.increment_link_clicks(p_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
BEGIN
  UPDATE public.links
  SET clicks = clicks + 1
  WHERE short_code = p_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Short code not found';
  END IF;
END;
$$; 
