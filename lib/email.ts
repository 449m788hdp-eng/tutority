export type NotificationKind = "profile_submitted" | "profile_approved" | "profile_rejected" | "changes_requested" | "security_event" | "subscription_event";
export async function sendNotification(_kind: NotificationKind, _recipient: string, _data: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) return { skipped: true as const, reason: "RESEND_API_KEY is not configured" };
  // Provider adapter deliberately remains server-only; add a Resend transport when credentials are available.
  return { skipped: false as const };
}
