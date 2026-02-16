import { supabase } from "@/integrations/supabase/client";
import type { OrderState } from "@/contexts/OrderContext";

type FlowType = "website" | "marketing";

export async function saveOrderLead(
  state: OrderState,
  flowType: FlowType,
  amountIdr: number | null,
  opts?: { skipDomainTemplate?: boolean },
) {
  try {
    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes.data.session?.user?.id ?? null;

    const nameParts = (state.details.name ?? "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const skipDT = opts?.skipDomainTemplate === true;
    const { error } = await (supabase as any).from("order_leads").insert({
      flow_type: flowType,
      domain: skipDT ? null : (state.domain || null),
      template_id: skipDT ? null : (state.selectedTemplateId || null),
      template_name: skipDT ? null : (state.selectedTemplateName || null),
      package_id: state.selectedPackageId || null,
      package_name: state.selectedPackageName || null,
      subscription_years: state.subscriptionYears || null,
      add_ons: state.addOns ?? {},
      subscription_add_ons: state.subscriptionAddOns ?? {},
      first_name: firstName,
      last_name: lastName,
      email: state.details.email || null,
      phone: state.details.phone || null,
      business_name: state.details.businessName || null,
      province_code: state.details.provinceCode || null,
      province_name: state.details.provinceName || null,
      city: state.details.city || null,
      amount_idr: amountIdr,
      promo_code: state.promoCode || null,
      status: "pending",
      user_id: userId,
    });

    if (error) console.error("saveOrderLead error:", error);
  } catch (e) {
    console.error("saveOrderLead failed:", e);
  }
}
