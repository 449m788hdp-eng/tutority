export function priceLabel(price?: { kind: string; amount_uah: number | null; duration_minutes: number | null; group_size: number | null } | null) {
  if (!price || price.kind === "contact_for_price") return "Уточнюйте ціну";
  if (price.kind === "negotiable") return "Ціна за домовленістю";
  if (!price.amount_uah) return "Уточнюйте ціну";
  if (price.kind === "hour") return `${price.amount_uah} грн / год`;
  if (price.kind === "per_student") return `${price.amount_uah} грн з людини`;
  return `${price.amount_uah} грн${price.duration_minutes ? ` / ${price.duration_minutes} хв` : " / заняття"}`;
}
