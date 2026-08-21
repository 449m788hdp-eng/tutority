export type MonobankWebhookEvent = { invoiceId: string; status: string; amount: number; signature: string };
/** Billing is server-only: verify MONOBANK_WEBHOOK_SECRET before updating subscriptions. */
export function isBillingEnabled() { return Boolean(process.env.MONOBANK_WEBHOOK_SECRET); }
