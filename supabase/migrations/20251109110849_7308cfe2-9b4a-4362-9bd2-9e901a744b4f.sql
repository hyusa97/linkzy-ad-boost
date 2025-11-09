-- Create function to resolve short code and return original URL
CREATE OR REPLACE FUNCTION public.resolve_short_code(p_code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  res text;
BEGIN
  SELECT original_url INTO res
  FROM public.links
  WHERE short_code = p_code
  LIMIT 1;
  
  RETURN res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_short_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_short_code(text) TO authenticated;

-- Create function to increment link clicks
CREATE OR REPLACE FUNCTION public.increment_link_clicks(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE short_code = p_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_link_clicks(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_link_clicks(text) TO authenticated;