export function exponentialBackOff(attempts: number): number {
  return Math.min(100 * Math.pow(attempts, 2), 60_000);
}
