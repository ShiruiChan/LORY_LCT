/**
 * Преобразует hex‑строку в Uint8Array.
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string length");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Строит data‑check‑string из объекта Telegram user, исключая hash.
 */
function buildDataCheckString(user: Record<string, any>): string {
  const entries = Object.entries(user)
    .filter(([k, v]) => k !== "hash" && v !== undefined && v !== null)
    .map(([k, v]) => [k, String(v)] as [string, string]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([k, v]) => `${k}=${v}`).join("\n");
}

/**
 * Проверяет подпись Telegram‑виджета. Для секрета используется SHA‑256 хэш токена бота,
 * который хранится в VITE_TELEGRAM_BOT_TOKEN_HASH.
 */
export async function verifyTelegramUser(user: any): Promise<boolean> {
  const expectedHash = user.hash;
  if (!expectedHash) return false;

  const secretHex = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_HASH;
  if (!secretHex) return false;

  const secretBytes = hexToBytes(secretHex);
  // Исправляем типизацию crypto.subtle.importKey, передавая ArrayBuffer и приводя subtile к any.
  const key = await (crypto.subtle as any).importKey(
    "raw",
    secretBytes.buffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const dataCheckString = buildDataCheckString(user);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataCheckString)
  );
  const hashArray = Array.from(new Uint8Array(signature));
  const computedHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedHex === expectedHash;
}
