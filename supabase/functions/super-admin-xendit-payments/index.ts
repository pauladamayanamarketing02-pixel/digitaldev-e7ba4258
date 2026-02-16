import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Payload = { limit?: number };

type OrderRow = {
  id: string;
  created_at: string;
  domain: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_usd: number | null;
  amount_idr: number | null;
  midtrans_redirect_url: string | null;
};

function normalizeLimit(input: unknown): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return 20;
  return Math.min(50, Math.max(1, n));
}

async function getPlainXenditKey(admin: any): Promise<string> {
  const { data, error } = await admin
    .from("integration_secrets")
    .select("ciphertext,iv")
    .eq("provider", "xendit")
    .eq("name", "api_key")
    .maybeSingle();
  if (error) throw error;
  const iv = String((data as any)?.iv ?? "");
  const key = iv === "plain" ? String((data as any)?.ciphertext ?? "") : "";
  if (!key.trim()) throw new Error("Xendit API key not configured");
  return key.trim();
}

async function requireSuperAdmin(admin: any, userId: string) {
  const { data: roleRow, error: roleErr } = await admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (roleErr) return { ok: false as const, status: 500, error: roleErr.message };
  if ((roleRow as any)?.role !== "super_admin") return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const, userId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authed = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await authed.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const authz = await requireSuperAdmin(admin, String(claimsData.claims.sub));
    if (!authz.ok) {
      return new Response(JSON.stringify({ error: authz.error }), {
        status: authz.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<Payload>;
    const limit = normalizeLimit(body.limit);

    let apiKey = "";
    try {
      apiKey = await getPlainXenditKey(admin);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("not configured")) {
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // Fetch orders with xendit provider
    const { data: orders, error: ordersErr } = await admin
      .from("orders")
      .select("id,created_at,domain,customer_name,customer_email,amount_usd,amount_idr,midtrans_redirect_url")
      .eq("payment_provider", "xendit")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (ordersErr) throw ordersErr;

    const xenditAuth = `Basic ${btoa(`${apiKey}:`)}`;
    const results: any[] = [];

    for (const o of (orders ?? []) as OrderRow[]) {
      // midtrans_redirect_url is reused to store xendit invoice_url
      const invoiceUrl = o.midtrans_redirect_url;
      // Try to extract invoice ID from the URL or use order id
      const orderId = o.id;

      // List invoices by external_id pattern
      try {
        const listRes = await fetch(
          `https://api.xendit.co/v2/invoices?external_id=ema-xendit-${orderId}&limit=1`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: xenditAuth,
            },
          },
        );

        if (listRes.ok) {
          const invoices = await listRes.json();
          if (Array.isArray(invoices) && invoices.length > 0) {
            results.push({
              ...o,
              xendit_invoice_url: invoiceUrl,
              xendit: invoices[0],
              xendit_error: null,
            });
            continue;
          }
        }
      } catch { /* ignore */ }

      results.push({
        ...o,
        xendit_invoice_url: invoiceUrl,
        xendit: null,
        xendit_error: "Could not fetch Xendit invoice status",
      });
    }

    return new Response(JSON.stringify({ ok: true, items: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
