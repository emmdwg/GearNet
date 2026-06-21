export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("email confirmation")) {
    return "Please verify your email before signing in. Check your inbox for a confirmation link.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  return message;
}

export function isEmailNotConfirmedError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("email not confirmed") || lower.includes("email confirmation");
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error("Enter a valid 10-digit US phone number.");
}
