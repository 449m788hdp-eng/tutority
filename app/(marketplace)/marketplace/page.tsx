import Link from "next/link";
import { TutorCard } from "@/components/tutor-card";
import { requireUser } from "@/lib/auth";

export default async function MarketplacePage() {
  const { supabase } = await requireUser();
  const { data: tutors, error } = await supabase.from("tutor_profiles").select("slug,headline,city,teaching_format,experience_years,profiles(first_name,last_name),tutor_subjects(subjects(name_uk)),tutor_pricing(kind,amount_uah,duration_minutes,group_size),reviews(rating)").eq("status", "approved").order("published_at", { ascending: false }).limit(6);
  return <><section className="page-head"><div><p className="muted">Український маркетплейс репетиторів</p><h1>Навчання, яке<br />підходить саме тобі.</h1><p className="muted">Шукай, порівнюй і зв’язуйся напряму. Без комісій за урок.</p></div><Link className="button primary" href="/tutors">Знайти репетитора</Link></section><div className="notice">Перші 3 місяці для репетиторів безкоштовні. Жодних платних підняттів у каталозі.</div><h2>Нові репетитори</h2>{error ? <p className="error">Не вдалося завантажити каталог.</p> : tutors?.length ? <div className="grid">{tutors.map((tutor) => <TutorCard key={tutor.slug} tutor={tutor} />)}</div> : <div className="empty card"><p>Нові профілі скоро з’являться тут.</p><Link className="button" href="/tutor/onboarding">Стати одним із перших репетиторів</Link></div>}</>;
}
