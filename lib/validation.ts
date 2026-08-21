import { z } from "zod";

const safeUrl = z.string().trim().url().refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "Посилання має починатися з https:// або http://");
export const phoneSchema = z.string().trim().regex(/^\+?[0-9][0-9\s()\-]{6,24}$/, "Вкажіть коректний номер телефону");
export const tutorDraftSchema = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().date(), headline: z.string().trim().min(10).max(180), biography: z.string().trim().min(80).max(5000),
  city: z.string().trim().max(120), teachingFormat: z.enum(["online", "offline", "hybrid"]), experienceYears: z.coerce.number().int().min(0).max(70),
  nmtPreparation: z.boolean().default(false), subjectIds: z.array(z.string().uuid()).min(1).max(3),
  phone: phoneSchema.optional(), priceUah: z.coerce.number().int().min(1).max(100000).optional(), priceMinutes: z.coerce.number().int().min(15).max(480).optional(),
});
export const contactSchema = z.object({
  phone: phoneSchema.optional(), telegram: z.string().trim().regex(/^(?:@[a-zA-Z0-9_]{5,32}|https:\/\/(?:t\.me|telegram\.me)\/[a-zA-Z0-9_]{5,32})$/, "Некоректний Telegram").optional(),
  instagram: z.string().trim().regex(/^(?:@[a-zA-Z0-9._]{1,30}|https:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?$)/, "Некоректний Instagram").optional(),
  links: z.array(safeUrl).max(5).default([]),
});
export const reviewSchema = z.object({ tutorId: z.string().uuid(), rating: z.coerce.number().int().min(1).max(5), body: z.string().trim().min(10).max(2000) });
export function normalizeTelegram(value: string) { return value.startsWith("@") ? `https://t.me/${value.slice(1)}` : value.replace("telegram.me", "t.me"); }
export function normalizeInstagram(value: string) { return value.startsWith("@") ? `https://instagram.com/${value.slice(1)}` : value.replace(/\/$/, ""); }
export function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80); }
