/**
 * Utilities for verifying data returned from the Telegram login widget.
 * See https://core.telegram.org/widgets/login for the specification.
 */

/**
 * Convert a hex string to a Uint8Array. Expects an even-length string.
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Compute the data-check-string from the Telegram auth user object. Keys must
 * be sorted alphabetically and concatenated with newlines. The `hash`
 * property is excluded. Only defined, non-null values are included.
 */
function buildDataCheckString(user: Record<string, any>): string {
  const entries = Object.entries(user)
    .filter(([key, value]) => key !== "hash" && value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)] as [string, string]);
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return entries.map(([key, value]) => `${key}=${value}`).join("\n");
}

/**
 * Verify the signature on the Telegram user object. Returns true if the
 * computed HMAC-SHA256 of the data-check-string matches the provided
 * `user.hash`. The secret key is the SHA-256 hash of the bot token in
 * hexadecimal form, provided via an environment variable.
 *
 * Because computing HMAC requires asynchronous operations, this function
 * returns a Promise.
 */
export async function verifyTelegramUser(user: any): Promise<boolean> {
  try {
    const expectedHash: string | undefined = user.hash;
    if (!expectedHash) return false;
    const secretHex = import.meta.env.VITE_TELEGRAM_BOT_TOKEN_HASH;
    if (!secretHex) {
      console.warn(
        "VITE_TELEGRAM_BOT_TOKEN_HASH is not defined. Cannot verify Telegram auth."
      );
      return false;
    }
    const secretBytes = hexToBytes(secretHex);
    // Node/TypeScript sometimes struggles to infer the correct BufferSource type
    // for Uint8Array. Using `.buffer` ensures we pass an ArrayBuffer to
    // importKey. See https://github.com/microsoft/TypeScript/issues/48986
    // Cast crypto.subtle to any to work around TypeScript overload resolution issues
    // with the Web Crypto API in some environments. Without this cast the
    // compiler may produce "No overload matches this call" errors due to
    // mismatched BufferSource and format types.
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
  } catch (err) {
    console.error("Error verifying Telegram auth", err);
    return false;
  }
}