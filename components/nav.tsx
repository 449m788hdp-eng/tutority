import Link from "next/link";
import { supportTelegram } from "@/lib/env";

export function Nav({ hasTutorProfile = false }: { hasTutorProfile?: boolean }) {
  return <header className="shell"><nav className="nav" aria-label="Основна навігація"><Link className="brand" href="/marketplace">tutor<i>ly</i></Link><div className="nav-links"><Link href="/marketplace">Головна</Link><Link className="keep" href="/tutors">Знайти репетитора</Link><Link href="/favorites">Обране</Link>{hasTutorProfile && <Link href="/tutor/onboarding">Мій профіль</Link>}<Link href="/settings">Профіль</Link><a href={supportTelegram} target="_blank" rel="noreferrer">Підтримка</a></div></nav></header>;
}
