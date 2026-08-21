import Link from "next/link";
import { priceLabel } from "@/lib/format";

type TutorCardProps = { tutor: { slug: string; headline: string | null; city: string | null; teaching_format: string; experience_years: number | null; profiles: Array<{ first_name: string | null; last_name: string | null }>; tutor_subjects: Array<{ subjects: Array<{ name_uk: string }> }>; tutor_pricing: Array<{ kind: string; amount_uah: number | null; duration_minutes: number | null; group_size: number | null }>; reviews: Array<{ rating: number }> } };
export function TutorCard({ tutor }: TutorCardProps) {
  const name = [tutor.profiles[0]?.first_name, tutor.profiles[0]?.last_name].filter(Boolean).join(" ") || "Репетитор";
  const ratings = tutor.reviews.map((item) => item.rating); const rating = ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1) : "Новий";
  return <Link href={`/tutor/${tutor.slug}`} className="card photo"><div className="portrait" aria-hidden>◉</div><div className="card-body"><strong>{name}</strong><div className="pills">{tutor.tutor_subjects.slice(0, 3).map(({ subjects }) => <span className="pill" key={subjects[0]?.name_uk}>{subjects[0]?.name_uk}</span>)}</div><p className="muted">{tutor.headline}</p><p>★ {rating}{ratings.length ? ` (${ratings.length})` : ""}</p><p className="muted">{tutor.teaching_format === "online" ? "Онлайн" : `${tutor.city ?? "Офлайн"}`} · {tutor.experience_years ?? 0} р. досвіду</p><strong>{priceLabel(tutor.tutor_pricing[0])}</strong></div></Link>;
}
