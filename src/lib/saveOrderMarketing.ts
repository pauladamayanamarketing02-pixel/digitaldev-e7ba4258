import { supabase } from "@/integrations/supabase/client";

/**
 * Upsert a row in order_marketing at each step of the Growth/Pro flow.
 * Returns the row id so it can be stored in context for subsequent updates.
 */

type StepSelectPlan = {
  step: "select-plan";
  packageId: string;
  packageName: string;
};

type StepCheckout = {
  step: "checkout";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  provinceCode: string;
  provinceName: string;
  city: string;
};

type StepSubscribe = {
  step: "subscribe";
  subscriptionYears: number;
  durationMonths: number;
  addOns: Record<string, number>;
  subscriptionAddOns: Record<string, boolean>;
};

type StepBilling = {
  step: "billing";
  amountIdr: number | null;
  promoCode: string;
};

type StepPayload = StepSelectPlan | StepCheckout | StepSubscribe | StepBilling;

export async function saveOrderMarketing(
  existingId: string | null,
  payload: StepPayload,
): Promise<string | null> {
  try {
    const sessionRes = await supabase.auth.getSession();
    const userId = sessionRes.data.session?.user?.id ?? null;

    if (existingId) {
      // Update existing row
      let updateData: Record<string, unknown> = {};

      switch (payload.step) {
        case "select-plan":
          updateData = {
            package_id: payload.packageId,
            package_name: payload.packageName,
          };
          break;
        case "checkout":
          updateData = {
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            business_name: payload.businessName || null,
            province_code: payload.provinceCode,
            province_name: payload.provinceName,
            city: payload.city,
          };
          break;
        case "subscribe":
          updateData = {
            subscription_years: payload.subscriptionYears,
            duration_months: payload.durationMonths,
            add_ons: payload.addOns ?? {},
            subscription_add_ons: payload.subscriptionAddOns ?? {},
          };
          break;
        case "billing":
          updateData = {
            amount_idr: payload.amountIdr,
            promo_code: payload.promoCode || null,
            ordered_at: new Date().toISOString(),
            status: "pending",
          };
          break;
      }

      if (userId) updateData.user_id = userId;

      const { error } = await (supabase as any)
        .from("order_marketing")
        .update(updateData)
        .eq("id", existingId);

      if (error) console.error("[saveOrderMarketing] update error:", error);
      return existingId;
    } else {
      // Insert new row (step 1)
      if (payload.step !== "select-plan") {
        console.warn("[saveOrderMarketing] expected select-plan for new row");
        return null;
      }

      const insertData: Record<string, unknown> = {
        package_id: payload.packageId,
        package_name: payload.packageName,
        status: "draft",
      };
      if (userId) insertData.user_id = userId;

      const { data, error } = await (supabase as any)
        .from("order_marketing")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error("[saveOrderMarketing] insert error:", error);
        return null;
      }
      return data?.id ?? null;
    }
  } catch (e) {
    console.error("[saveOrderMarketing] failed:", e);
    return null;
  }
}
