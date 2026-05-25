export function simulatedDelay(): Promise<void> {
  const ms = 200 + Math.random() * 400;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
