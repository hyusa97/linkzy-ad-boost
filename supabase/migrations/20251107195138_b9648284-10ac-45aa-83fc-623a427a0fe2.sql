-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0 NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create links table
CREATE TABLE public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_url TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  impressions INTEGER DEFAULT 0 NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  unique_visitors INTEGER DEFAULT 0 NOT NULL,
  earnings DECIMAL(10, 2) DEFAULT 0 NOT NULL
);

-- Enable RLS on links
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Create analytics table for daily tracking
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0 NOT NULL,
  clicks INTEGER DEFAULT 0 NOT NULL,
  earnings DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  UNIQUE(link_id, date)
);

-- Enable RLS on analytics
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create config table for global settings
CREATE TABLE public.config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on config
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Insert default CPM and CPC rates
INSERT INTO public.config (key, value) VALUES 
  ('cpm_rate', '2.0'::jsonb),
  ('cpc_rate', '0.5'::jsonb);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for links
CREATE POLICY "Users can view their own links"
  ON public.links FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own links"
  ON public.links FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own links"
  ON public.links FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own links"
  ON public.links FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all links"
  ON public.links FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for analytics
CREATE POLICY "Users can view analytics for their links"
  ON public.analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = analytics.link_id
      AND links.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON public.analytics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for config
CREATE POLICY "Admins can manage config"
  ON public.config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view config"
  ON public.config FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  -- If no admin exists, make this user an admin
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Otherwise, assign user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Trigger for config table
CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON public.config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();