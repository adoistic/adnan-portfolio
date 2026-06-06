/**
 * SSR-safe localStorage helpers for the BYOK panel.
 *
 * Holds the visitor's OpenRouter key and chosen model. Deliberately stored in
 * localStorage for reload persistence (tradeoff documented in the design spec's
 * Security section: it is the visitor's own key, and the CSP + text-only
 * rendering exist to keep an injected script from reading it).
 *
 * Every access is guarded two ways:
 *   - `typeof window === "undefined"` so it is inert during SSR.
 *   - try/catch so a disabled / quota-exhausted store (private mode) degrades
 *     to a no-op instead of throwing.
 *
 * SECURITY: this module reads and writes the key, but NEVER logs it. No
 * console.* anywhere on this path.
 */

const KEY_NAME = "or_key";
const MODEL_NAME = "or_model";

/** Default model when the visitor has not picked one. */
export const DEFAULT_MODEL = "openai/gpt-5-mini";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(name: string): string | null {
  const s = storage();
  if (!s) return null;
  try {
    return s.getItem(name);
  } catch {
    return null;
  }
}

function write(name: string, value: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(name, value);
  } catch {
    /* quota / disabled store: silently degrade */
  }
}

function remove(name: string): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(name);
  } catch {
    /* nothing we can do; degrade silently */
  }
}

/** The stored OpenRouter key, or "" if absent / unavailable. */
export function getKey(): string {
  return read(KEY_NAME) ?? "";
}

/** Persist the key. An empty / whitespace-only value clears it instead. */
export function setKey(key: string): void {
  if (key.trim().length === 0) {
    clearKey();
    return;
  }
  write(KEY_NAME, key);
}

/** Remove the stored key. */
export function clearKey(): void {
  remove(KEY_NAME);
}

/** The stored model id, or the default if none is set. */
export function getModel(): string {
  const m = read(MODEL_NAME);
  return m && m.length > 0 ? m : DEFAULT_MODEL;
}

/** Persist the chosen model id. */
export function setModel(model: string): void {
  if (model.trim().length === 0) return;
  write(MODEL_NAME, model);
}
