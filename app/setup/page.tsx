import Link from "next/link";

export default function SetupPage() {
  return <main className="shell" style={{ maxWidth: 720, paddingTop: "12vh" }}><section className="card stack"><span className="brand">tutor<i>ly</i></span><h1 style={{ fontSize: 42 }}>Сайт майже готовий</h1><p className="muted">Потрібно підключити Supabase, перш ніж відкривати захищений каталог репетиторів.</p><div className="notice">Додайте у Vercel: <code>NEXT_PUBLIC_SUPABASE_URL</code> та <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, після чого зробіть Redeploy.</div><Link className="button" href="/login">До сторінки входу</Link></section></main>;
}
