"use client";
import { useState } from "react";

export function FavoriteButton({ tutorId, initial = false }: { tutorId: string; initial?: boolean }) {
  const [saved, setSaved] = useState(initial); const [busy, setBusy] = useState(false);
  async function toggle() { setBusy(true); const response = await fetch("/api/favorites", { method: saved ? "DELETE" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tutorId }) }); if (response.ok) setSaved(!saved); setBusy(false); }
  return <button className="button" onClick={toggle} disabled={busy} aria-pressed={saved}>{saved ? "♥ В обраному" : "♡ Зберегти"}</button>;
}
