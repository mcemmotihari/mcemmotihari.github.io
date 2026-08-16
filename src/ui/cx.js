/**
 * Joins truthy class names. Mirrors the common `clsx` pattern without a
 * dependency.
 * @param {...(string|false|null|undefined)} parts
 * @return {string}
 */
export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
