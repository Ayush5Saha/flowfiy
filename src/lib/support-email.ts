import { Resend } from "resend";

/**
 * Shared helpers for transactional support email (contact form + bug reports).
 *
 * Sender must be on a Resend-verified domain. flowfiy.com is verified (the
 * affiliate magic-link already sends from affiliates@flowfiy.com), so support@
 * works too. Both inbox and sender are overridable via env.
 */
export const SUPPORT_INBOX = process.env.SUPPORT_INBOX_EMAIL || "support@flowfiy.com";
export const SUPPORT_FROM = process.env.SUPPORT_FROM_EMAIL || "Flowfiy Support <support@flowfiy.com>";

/** Escape user-supplied text before interpolating into HTML email bodies. */
export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let _resend: Resend | null = null;
/** Returns a memoised Resend client, or null when email isn't configured. */
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/** Wraps body HTML in the dark Flowfiy email shell. */
export function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:28px 24px;background:#09090f;color:#e4e4e7;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:22px;">
        <div style="width:32px;height:32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;color:#fff;">F</div>
        <span style="font-size:16px;font-weight:700;color:#fff;">Flowfiy</span>
      </div>
      <h2 style="color:#a855f7;margin:0 0 16px;font-size:18px;">${escapeHtml(title)}</h2>
      ${bodyHtml}
    </div>
  `;
}

/** Renders a label/value detail table row pair. */
export function detailRows(rows: Array<[string, string]>): string {
  return `<table style="width:100%;border-collapse:collapse;">${rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:6px 0;color:#a1a1aa;width:130px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:#ffffff;font-weight:500;">${value}</td>
      </tr>`
    )
    .join("")}</table>`;
}
