/** Optional date line (e.g. "Sunday, Aug 2") shown under the clock. */
export function DateDisplay({ value }: { value: string }) {
  return <span className="date">{value}</span>;
}
