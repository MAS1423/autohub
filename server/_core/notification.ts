/**
 * Notification stub — logs to console. Replace with email/webhook in production.
 * Logs to console only. To add real email/push notifications, implement here.
 */

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Stub: logs the notification to console.
 * Returns `true` always so callers behave as if notification was sent.
 * Replace this with a real email/webhook integration if needed.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}
