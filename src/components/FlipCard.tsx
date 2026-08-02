import { memo, useEffect, useState } from 'react';

interface FlipCardProps {
  value: string;
  animate: boolean; // effective animations enabled
}

/**
 * A split-flap card. The digit is only re-rendered (and flipped) when it
 * changes, keeping DOM churn minimal. Animation is pure CSS (rotateX); the
 * duration comes from the `--flip-duration` custom property.
 */
export const FlipCard = memo(function FlipCard({ value, animate }: FlipCardProps) {
  const [shown, setShown] = useState(value);
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (value === shown) return;
    setPrev(shown);
    setShown(value);
    setFlipKey((k) => k + 1);
    setFlipping(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const endFlip = () => setFlipping(false);

  return (
    <div className="flip" aria-hidden="true">
      {/* Static layers */}
      <div className="flip__half flip__half--top">
        <span className="flip__digit">{shown}</span>
      </div>
      <div className="flip__half flip__half--bottom">
        <span className="flip__digit">{shown}</span>
      </div>

      {/* Animated layers: old digit folds down, new digit folds in.
          Only the bottom half carries the end handler — it is the LAST
          animation to finish (it starts after the top half is done), so it
          keeps both layers mounted until the flip completes. */}
      {flipping && (
        <>
          <div
            key={`top-${flipKey}`}
            className="flip__half flip__half--top flip__half--top-anim"
          >
            <span className="flip__digit">{prev}</span>
          </div>
          <div
            key={`bot-${flipKey}`}
            className="flip__half flip__half--bottom flip__half--bottom-anim"
            onAnimationEnd={endFlip}
          >
            <span className="flip__digit">{shown}</span>
          </div>
        </>
      )}
    </div>
  );
});
