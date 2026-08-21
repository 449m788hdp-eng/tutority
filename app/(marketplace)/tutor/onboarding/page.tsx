import { TutorOnboarding } from "@/components/tutor-onboarding";
import { requireUser } from "@/lib/auth";
export default async function OnboardingPage() { const { supabase } = await requireUser(); const { data: subjects } = await supabase.from("subjects").select("id,name_uk").eq("is_active", true).order("name_uk"); return <><p className="muted">Профіль репетитора</p><h1>Поділіться тим, як ви навчаєте.</h1><p className="muted">Ваші контакти і дата народження не публікуються автоматично.</p><TutorOnboarding subjects={subjects ?? []} /></>; }
