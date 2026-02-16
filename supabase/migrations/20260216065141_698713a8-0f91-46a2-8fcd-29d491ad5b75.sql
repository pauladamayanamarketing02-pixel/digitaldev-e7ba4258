
-- Table to track marketing (Growth/Pro) order progress step-by-step
CREATE TABLE public.order_marketing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Step 1: select-plan
  package_id text NULL,
  package_name text NULL,
  -- Step 2: checkout
  first_name text NULL,
  last_name text NULL,
  email text NULL,
  phone text NULL,
  business_name text NULL,
  province_code text NULL,
  province_name text NULL,
  city text NULL,
  -- Step 3: subscribe
  subscription_years numeric NULL,
  duration_months integer NULL,
  add_ons jsonb NULL DEFAULT '{}'::jsonb,
  subscription_add_ons jsonb NULL DEFAULT '{}'::jsonb,
  -- Step 4: billing / pay
  amount_idr numeric NULL,
  promo_code text NULL,
  ordered_at timestamptz NULL,
  -- meta
  user_id uuid NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_marketing ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (guest checkout)
CREATE POLICY "anon_can_insert_order_marketing"
  ON public.order_marketing FOR INSERT
  WITH CHECK (true);

-- Users can view their own rows
CREATE POLICY "users_can_view_own_order_marketing"
  ON public.order_marketing FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own rows
CREATE POLICY "users_can_update_own_order_marketing"
  ON public.order_marketing FOR UPDATE
  USING (auth.uid() = user_id);

-- Anon can update rows by id (for guest flow via session key)
CREATE POLICY "anon_can_update_order_marketing"
  ON public.order_marketing FOR UPDATE
  USING (true);

-- Super admin full access
CREATE POLICY "super_admin_manage_order_marketing"
  ON public.order_marketing FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_order_marketing_updated_at
  BEFORE UPDATE ON public.order_marketing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
