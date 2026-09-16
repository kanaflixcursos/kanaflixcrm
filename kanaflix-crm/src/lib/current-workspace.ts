import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getOptionalWorkspace = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_organization_id")
    .eq("id", userId)
    .maybeSingle();

  const { data: organization } = profile?.current_organization_id
    ? await supabase
        .from("organizations")
        .select("id, name, brand_color")
        .eq("id", profile.current_organization_id)
        .maybeSingle()
    : { data: null };

  if (!organization) return null;

  return { supabase, userId, organization };
});

export async function getCurrentWorkspace() {
  const workspace = await getOptionalWorkspace();
  if (!workspace) redirect("/entrar");
  return workspace;
}
