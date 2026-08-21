"use client";
import { useState } from "react";

export function ReviewForm({ tutorId }: { tutorId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const result = await fetch("/api/reviews", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tutorId, rating: Number(form.get("rating")), body: form.get("body") }) }); setMessage(result.ok ? "Відгук збережено. Дякуємо!" : (await result.json()).error ?? "Не вдалося зберегти відгук."); }
  return <form className="card stack" onSubmit={submit}><h2>Залишити відгук</h2><label>Оцінка<select name="rating" defaultValue="5"><option value="5">5 — чудово</option><option value="4">4 — добре</option><option value="3">3 — нормально</option><option value="2">2 — слабко</option><option value="1">1 — погано</option></select></label><label>Ваш досвід<textarea name="body" minLength={10} required placeholder="Що вам сподобалося у підході репетитора?" /></label><button className="button primary">Опублікувати</button>{message && <p className={message.startsWith("Відгук") ? "notice" : "error"}>{message}</p>}</form>;
}
