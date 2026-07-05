/**
 * Handle — a normalized X (Twitter) username.
 *
 * The normalization rules live here, in one module, so the API route and the
 * UI agree: trim surrounding whitespace, strip any leading `@`, and lowercase
 * (X handles are case-insensitive). The result is used both as the cache key
 * and as the value sent to the provider.
 */
export const normalizeHandle = (input: string): string =>
  input.trim().replace(/^@+/, "").toLowerCase();
