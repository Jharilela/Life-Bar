/** Kept out of any component body: the eslint react-hooks purity rule flags
 * Date.now()/new Date() called directly inside a component's render. */
export function daysAgoISODate(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}
