
-- Table to store order leads from both website and marketing flows
CREATE TABLE public.order_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  flow_type text NOT NULL DEFAULT 'website',
  domain text,
  template_id text,
  template_name text,
  package_id text,
  package_name text,
  subscription_years integer,
  add_ons jsonb DEFAULT '{}'::jsonb,
  subscription_add_ons jsonb DEFAULT '{}'::jsonb,
  first_name text,
  last_name text,
  email text,
  phone text,
  business_name text,
  province_code text,
  province_name text,
  city text,
  amount_idr numeric,
  promo_code text,
  status text NOT NULL DEFAULT 'pending',
  xendit_invoice_url text,
  user_id uuid
);

-- Enable RLS
ALTER TABLE public.order_leads ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "super_admin_manage_order_leads"
ON public.order_leads
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Anyone can insert (public order flow, no auth required)
CREATE POLICY "anon_can_insert_order_leads"
ON public.order_leads
FOR INSERT
WITH CHECK (true);

-- Users can view own leads
CREATE POLICY "users_can_view_own_order_leads"
ON public.order_leads
FOR SELECT
USING (auth.uid() = user_id);
