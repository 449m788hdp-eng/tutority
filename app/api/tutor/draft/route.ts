import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify, tutorDraftSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = tutorDraftSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Перевірте поля" }, { status: 400 });
  const { supabase, user } = await (async () => { const client = await createClient(); const { data: { user: currentUser } } = await client.auth.getUser(); return { supabase: client, user: currentUser }; })();
  if (!user) return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 }); const input = parsed.data;
  if (new Date(`${input.dateOfBirth}T00:00:00`).getTime() > Date.now() - 14 * 365.2425 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "Створити профіль можна з 14 років" }, { status: 400 });
  const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, first_name: input.firstName, last_name: input.lastName }); if (profileError) return NextResponse.json({ error: "Не вдалося зберегти особисті дані" }, { status: 400 });
  const { error: privateError } = await supabase.from("user_private_data").upsert({ user_id: user.id, date_of_birth: input.dateOfBirth }); if (privateError) return NextResponse.json({ error: "Не вдалося безпечно зберегти дату народження" }, { status: 400 });
  const { data: existing } = await supabase.from("tutor_profiles").select("id,slug").eq("user_id", user.id).maybeSingle(); const slug = existing?.slug ?? `${slugify(`${input.firstName}-${input.lastName}`)}-${user.id.slice(0, 6)}`;
  const { data: tutor, error: tutorError } = await supabase.from("tutor_profiles").upsert({ id: existing?.id, user_id: user.id, slug, status: "draft", headline: input.headline, biography: input.biography, city: input.city || null, teaching_format: input.teachingFormat, experience_years: input.experienceYears, nmt_preparation: input.nmtPreparation }, { onConflict: "user_id" }).select("id").single();
  if (tutorError || !tutor) return NextResponse.json({ error: tutorError?.message ?? "Не вдалося зберегти профіль" }, { status: 400 });
  const { error: deleteError } = await supabase.from("tutor_subjects").delete().eq("tutor_id", tutor.id); if (deleteError) return NextResponse.json({ error: "Не вдалося оновити предмети" }, { status: 400 });
  const { error: subjectsError } = await supabase.from("tutor_subjects").insert(input.subjectIds.map((subjectId, index) => ({ tutor_id: tutor.id, subject_id: subjectId, is_primary: index === 0 }))); if (subjectsError) return NextResponse.json({ error: subjectsError.message }, { status: 400 });
  if (input.phone) { await supabase.from("tutor_contacts").delete().eq("tutor_id", tutor.id).eq("kind", "phone"); const { error } = await supabase.from("tutor_contacts").insert({ tutor_id: tutor.id, kind: "phone", value: input.phone.replace(/[\s()\-]/g, ""), is_published: true }); if (error) return NextResponse.json({ error: "Не вдалося зберегти телефон" }, { status: 400 }); }
  if (input.priceUah) { await supabase.from("tutor_pricing").delete().eq("tutor_id", tutor.id); const { error } = await supabase.from("tutor_pricing").insert({ tutor_id: tutor.id, kind: "lesson", amount_uah: input.priceUah, duration_minutes: input.priceMinutes ?? 60, is_primary: true }); if (error) return NextResponse.json({ error: "Не вдалося зберегти ціну" }, { status: 400 }); }
  return NextResponse.json({ tutorId: tutor.id, slug });
}
