/**
 * Simple class name merger
 * Filters out falsy values and joins class names
 */
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
