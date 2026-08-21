"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState<string | null>(null);
  async function signIn(provider: "google" | "apple") { setError(null); setLoading(provider); const { error: authError } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/marketplace` } }); if (authError) { setError(authError.message); setLoading(null); } }
  return <main className="shell" style={{ maxWidth: 540, paddingTop: "12vh" }}><div className="card stack"><div><span className="brand">tutor<i>ly</i></span><h1 style={{ fontSize: 42, marginTop: 20 }}>Знайди свого репетитора</h1><p className="muted">Вхід потрібен, щоб захистити контакти та приватність викладачів.</p></div>{error && <p className="error" role="alert">{error}</p>}<button className="button primary" disabled={Boolean(loading)} onClick={() => signIn("google")}>{loading === "google" ? "Переадресація…" : "Продовжити з Google"}</button><button className="button" disabled={Boolean(loading)} onClick={() => signIn("apple")}>{loading === "apple" ? "Переадресація…" : "Продовжити з Apple"}</button><p className="muted">Продовжуючи, ви погоджуєтеся користуватися Tutorly відповідально.</p></div></main>;
}
