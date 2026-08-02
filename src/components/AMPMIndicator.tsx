/** AM / PM shown bottom-left, matching the reference layout. */
export function AMPMIndicator({ value }: { value: string }) {
  if (!value) return null;
  return (
    <span className="ampm" aria-label={value}>
      {value}
    </span>
  );
}
