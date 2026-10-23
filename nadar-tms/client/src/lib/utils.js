/**
 * Utility helper to join CSS classes
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}
