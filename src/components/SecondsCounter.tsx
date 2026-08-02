/**
 * The seconds are deliberately NOT flip cards — they render as a small
 * light-gray counter bottom-right, animated on every tick.
 */
export function SecondsCounter({ value }: { value: string }) {
  return (
    <span className="seconds" role="timer" aria-label={`${value} seconds`}>
      <span key={value} className="seconds__value">
        {value}
      </span>
    </span>
  );
}
