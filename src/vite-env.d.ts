/// <reference types="vite/client" />

/*
 * Declaration of the environment variables used by Vite. Without
 * explicitly extending ImportMetaEnv and ImportMeta, TypeScript
 * complains that `import.meta.env` does not exist. Adding this file
 * resolves errors like: Property 'env' does not exist on type
 * 'ImportMeta'.
 */

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /**
   * Hex-encoded SHA-256 hash of the bot token. Used for verifying
   * the hash signature returned by the Telegram login widget. See
   * https://core.telegram.org/widgets/login for details.
   */
  readonly VITE_TELEGRAM_BOT_TOKEN_HASH?: string;
  // add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}