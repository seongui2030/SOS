CREATE TABLE public.emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relation text NOT NULL,
  phone text,
  kakao_uuid text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own contacts" ON public.emergency_contacts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX emergency_contacts_user_idx ON public.emergency_contacts (user_id, created_at DESC);

CREATE TABLE public.emergency_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  map_url text,
  message text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.emergency_alerts TO authenticated;
GRANT ALL ON public.emergency_alerts TO service_role;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own alerts" ON public.emergency_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alerts" ON public.emergency_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX emergency_alerts_user_idx ON public.emergency_alerts (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_emergency_contacts()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER emergency_contacts_touch BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW EXECUTE FUNCTION public.touch_emergency_contacts();