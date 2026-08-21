import Link from "next/link";
import { TutorCard } from "@/components/tutor-card";
import { requireUser } from "@/lib/auth";

type Props = { searchParams: Promise<{ subject?: string; format?: string; city?: string; q?: string }> };
export default async function TutorsPage({ searchParams }: Props) {
  const filters = await searchParams; const { supabase } = await requireUser();
  const { data: subjects } = await supabase.from("subjects").select("id,name_uk").eq("is_active", true).order("name_uk");
  let query = supabase.from("tutor_profiles").select("slug,headline,city,teaching_format,experience_years,profiles(first_name,last_name),tutor_subjects!inner(subject_id,subjects(name_uk)),tutor_pricing(kind,amount_uah,duration_minutes,group_size),reviews(rating)").eq("status", "approved");
  if (filters.format && ["online", "offline", "hybrid"].includes(filters.format)) query = query.eq("teaching_format", filters.format);
  if (filters.city) query = query.ilike("city", `%${filters.city.slice(0, 120)}%`);
  if (filters.subject) query = query.eq("tutor_subjects.subject_id", filters.subject);
  const { data: tutors, error } = await query.order("published_at", { ascending: false }).range(0, 23);
  return <><div className="page-head"><div><p className="muted">Каталог</p><h1>Знайти репетитора</h1></div><Link className="button primary" href="/tutor/onboarding">Створити профіль</Link></div><form className="filters" action="/tutors"><select name="subject" defaultValue={filters.subject}><option value="">Усі предмети</option>{subjects?.map((subject) => <option key={subject.id} value={subject.id}>{subject.name_uk}</option>)}</select><select name="format" defaultValue={filters.format}><option value="">Онлайн і офлайн</option><option value="online">Онлайн</option><option value="offline">Офлайн</option><option value="hybrid">Гібридно</option></select><input name="city" defaultValue={filters.city} placeholder="Місто" /><button className="button" type="submit">Застосувати</button></form><label>Розкажи, який репетитор тобі потрібен<textarea name="q" placeholder="Наприклад: пояснює спокійно і просто…" defaultValue={filters.q} /></label><p className="muted">Пошук спершу застосовує предмет, формат і місто. Семантичне зіставлення буде доступне після підключення OpenAI.</p>{error ? <p className="error">Не вдалося завантажити результати.</p> : tutors?.length ? <div className="grid">{tutors.map((tutor) => <TutorCard key={tutor.slug} tutor={tutor} />)}</div> : <div className="empty card">За цими фільтрами поки нікого немає.</div>}</>;
}
