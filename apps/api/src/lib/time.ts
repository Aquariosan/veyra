export function futureISO(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}
