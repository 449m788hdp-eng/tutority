export function publicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  return { url, key };
}

/** Prevent an unset deployment environment from turning every request into a 500. */
export function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(url && key && !url.includes("your-project.supabase.co") && key !== "sb_publishable_xxx");
}

export const appUrl = process.env.APP_URL ?? "http://localhost:3000";
export const supportTelegram = process.env.TUTORLY_SUPPORT_TELEGRAM_URL ?? "https://t.me/tutorly_support";
