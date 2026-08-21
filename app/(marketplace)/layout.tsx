import { Nav } from "@/components/nav";
import { requireUser } from "@/lib/auth";
export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) { const { supabase, user } = await requireUser(); const { data } = await supabase.from("tutor_profiles").select("id").eq("user_id", user.id).maybeSingle(); return <><Nav hasTutorProfile={Boolean(data)} /><main className="shell">{children}</main></>; }
