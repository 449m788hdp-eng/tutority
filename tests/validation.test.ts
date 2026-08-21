import { describe, expect, it } from "vitest";
import { contactSchema, tutorDraftSchema } from "../lib/validation";

const baseDraft = { firstName: "Анна", lastName: "Коваль", dateOfBirth: "2000-05-12", headline: "Пояснюю математику доступно", biography: "Я допомагаю учням системно закрити прогалини та спокійно готуватися до контрольних робіт і НМТ.", city: "Київ", teachingFormat: "online", experienceYears: 3, nmtPreparation: true };
describe("tutor validation", () => {
  it("rejects a fourth subject", () => expect(tutorDraftSchema.safeParse({ ...baseDraft, subjectIds: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002", "00000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000004"] }).success).toBe(false));
  it("rejects dangerous external URL schemes", () => expect(contactSchema.safeParse({ links: ["javascript:alert(1)"] }).success).toBe(false));
  it("normalizes only accepted contact formats", () => expect(contactSchema.safeParse({ phone: "+380 67 123 45 67", telegram: "@tutorly_ua", instagram: "@tutorly.ua" }).success).toBe(true));
});
