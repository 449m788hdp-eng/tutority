import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
function hasSafeSignature(file: File, bytes: Uint8Array) {
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  return file.type === "image/webp" && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
}
export async function POST(request: Request) {
  const form = await request.formData(); const file = form.get("file"); const tutorId = form.get("tutorId"); if (!(file instanceof File) || typeof tutorId !== "string") return NextResponse.json({ error: "Файл не отримано" }, { status: 400 });
  if (!allowed.has(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) return NextResponse.json({ error: "Дозволено JPEG, PNG або WebP до 5 МБ" }, { status: 400 }); const sample = new Uint8Array(await file.slice(0, 12).arrayBuffer()); if (!hasSafeSignature(file, sample)) return NextResponse.json({ error: "Формат файлу не відповідає його вмісту" }, { status: 400 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Потрібен вхід" }, { status: 401 }); const { count } = await supabase.from("tutor_media_uploads").select("*", { count: "exact", head: true }).eq("tutor_id", tutorId); if ((count ?? 0) >= 5) return NextResponse.json({ error: "Можна додати максимум 5 фотографій" }, { status: 400 });
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]; const path = `${user.id}/${crypto.randomUUID()}.${extension}`; const { error: storageError } = await supabase.storage.from("tutor-media-pending").upload(path, file, { contentType: file.type, upsert: false }); if (storageError) return NextResponse.json({ error: "Не вдалося завантажити фото" }, { status: 400 }); const { error } = await supabase.from("tutor_media_uploads").insert({ tutor_id: tutorId, owner_id: user.id, pending_path: path, mime_type: file.type, size_bytes: file.size }); if (error) { await supabase.storage.from("tutor-media-pending").remove([path]); return NextResponse.json({ error: "Не вдалося зареєструвати фото" }, { status: 400 }); } return NextResponse.json({ ok: true });
}
