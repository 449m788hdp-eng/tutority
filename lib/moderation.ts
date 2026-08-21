/** Builds a strictly public moderation payload. Actual model calls occur only in a server worker. */
export function publicModerationPayload(input: { headline: string | null; biography: string | null; teachingStyle: string | null; achievements: Array<{ title: string; description: string | null }> }) {
  return { headline: input.headline ?? "", biography: input.biography ?? "", teachingStyle: input.teachingStyle ?? "", achievements: input.achievements.map(({ title, description }) => ({ title, description: description ?? "" })) };
}

export function moderationOutcome(confidence: number, unsafe: boolean) { if (confidence < 0.8) return "manual_review" as const; return unsafe ? "rejected" as const : "approved" as const; }

/** Server-worker integration; private account, payment, verification, and contact fields are intentionally absent. */
export async function moderatePublicProfile(payload: ReturnType<typeof publicModerationPayload>) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { available: false as const, decision: "manual_review" as const, reason: "OPENAI_API_KEY is not configured" };
  const response = await fetch("https://api.openai.com/v1/moderations", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model: "omni-moderation-latest", input: JSON.stringify(payload) }) });
  if (!response.ok) throw new Error("OpenAI moderation request failed");
  const result = await response.json() as { results?: Array<{ flagged?: boolean; category_scores?: Record<string, number> }> }; const item = result.results?.[0]; const confidence = Math.max(...Object.values(item?.category_scores ?? { unknown: 0 }));
  return { available: true as const, decision: moderationOutcome(confidence, Boolean(item?.flagged)), confidence };
}

export async function createEmbedding(publicTutorText: string) {
  const key = process.env.OPENAI_API_KEY; if (!key) return null;
  const response = await fetch("https://api.openai.com/v1/embeddings", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model: "text-embedding-3-small", input: publicTutorText }) });
  if (!response.ok) throw new Error("OpenAI embedding request failed"); const result = await response.json() as { data?: Array<{ embedding?: number[] }> }; return result.data?.[0]?.embedding ?? null;
}
