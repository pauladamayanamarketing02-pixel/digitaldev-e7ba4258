import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

type XenditPaymentsItem = {
  id: string;
  created_at: string;
  domain: string;
  customer_name: string | null;
  customer_email: string | null;
  amount_usd: number | null;
  amount_idr: number | null;
  xendit_invoice_url: string | null;
  xendit?: Record<string, any> | null;
  xendit_error?: string | null;
};

type Response = {
  ok: boolean;
  items?: XenditPaymentsItem[];
  error?: string;
};

const FN = "super-admin-xendit-payments";

export function useXenditPayments() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<XenditPaymentsItem[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<Response>(FN, { limit: 20 });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Xendit API key not configured");
      setItems(data.items ?? []);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Gagal memuat transaksi Xendit.");
    } finally {
      setLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ loading, items, refresh }),
    [loading, items, refresh],
  );
}
