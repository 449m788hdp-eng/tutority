import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260821221743_tutorly_initial.sql", import.meta.url), "utf8");
describe("database privacy controls", () => {
  it("enables RLS on private and marketplace tables", () => { expect(migration).toContain("alter table public.user_private_data enable row level security"); expect(migration).toContain("alter table public.favorites enable row level security"); expect(migration).toContain("alter table public.tutor_verifications enable row level security"); });
  it("enforces ownership and review integrity in the database", () => { expect(migration).toContain("create trigger tutor_subject_limit"); expect(migration).toContain("create trigger no_self_review"); expect(migration).toContain("reviews_one_active_per_author"); expect(migration).toContain("own favorites"); });
  it("protects admin access and document storage", () => { expect(migration).toContain("private.is_admin()"); expect(migration).toContain("admin audit only"); expect(migration).toContain("tutor-verifications', false"); });
});
