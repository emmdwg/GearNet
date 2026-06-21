type EmailPayload = {
  to: string;
  subject: string;
  title: string;
  body: string;
  url?: string;
};

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function sendNotificationEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "GearNet <notifications@gearnet.app>";

  if (!apiKey) return;

  const link = payload.url ? `${appBaseUrl()}${payload.url}` : `${appBaseUrl()}/activity`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#fafafa;background:#09090b;padding:32px;border-radius:16px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#f59e0b;">GearNet</p>
      <h1 style="margin:0 0 12px;font-size:20px;">${escapeHtml(payload.title)}</h1>
      <p style="margin:0 0 20px;line-height:1.5;color:#d4d4d8;">${escapeHtml(payload.body)}</p>
      <a href="${link}" style="display:inline-block;background:#f59e0b;color:#09090b;text-decoration:none;font-weight:600;padding:10px 16px;border-radius:999px;">Open GearNet</a>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html,
      text: `${payload.title}\n\n${payload.body}\n\n${link}`,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send email:", await res.text().catch(() => ""));
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
