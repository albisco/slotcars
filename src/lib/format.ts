/**
 * Format milliseconds to a human-readable time string.
 * e.g. 1234 → "1.234s", 65432 → "1:05.432"
 */
export function formatTime(ms: number): string {
  if (ms < 0) return "—";
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(3)}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
}
