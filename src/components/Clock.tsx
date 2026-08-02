import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getTimeParts, formatSecondTz } from '../lib/time';
import { FlipCard } from './FlipCard';
import { SecondsCounter } from './SecondsCounter';
import { AMPMIndicator } from './AMPMIndicator';
import { DateDisplay } from './DateDisplay';

function Colon({ blink }: { blink: boolean }) {
  return (
    <div className="colon" aria-hidden="true">
      <span className="colon__dot" data-on={blink || undefined} />
      <span className="colon__dot" data-on={blink || undefined} />
    </div>
  );
}

export function Clock({
  now,
  animate,
  secondTz,
}: {
  now: Date;
  animate: boolean;
  secondTz: string | null;
}) {
  const { settings } = useSettings();

  const parts = useMemo(
    () => getTimeParts(now, settings.timezone, settings.hour12, settings.leadingZero),
    [now, settings.timezone, settings.hour12, settings.leadingZero],
  );

  const blink = now.getSeconds() % 2 === 0;
  const minuteLabel = `${parts.hours.join('')}:${parts.minutes.join('')}${parts.ampm ? ` ${parts.ampm}` : ''}`;
  const secTzText = secondTz ? formatSecondTz(now, secondTz, settings.hour12) : '';

  return (
    <div
      className="clock"
      role="group"
      aria-label={`The time is ${minuteLabel}${parts.tzShort === 'Local' ? '' : `, ${parts.tzShort}`}`}
    >
      <div className="clock__cards">
        {parts.hours.map((d, i) => (
          <FlipCard key={`h-${i}`} value={d} animate={animate} />
        ))}
        <Colon blink={blink} />
        {parts.minutes.map((d, i) => (
          <FlipCard key={`m-${i}`} value={d} animate={animate} />
        ))}
      </div>

      <div className="clock__meta">
        <div className="clock__meta-slot clock__meta-slot--left">
          {settings.showAMPM && <AMPMIndicator value={parts.ampm} />}
          <span className="tz-label">{parts.tzShort}</span>
        </div>
        <div className="clock__meta-slot clock__meta-slot--center">
          {settings.showDate && <DateDisplay value={parts.date} />}
        </div>
        <div className="clock__meta-slot clock__meta-slot--right">
          {settings.showSeconds && <SecondsCounter value={parts.seconds} />}
        </div>
      </div>

      {secondTz && (
        <div className="secondtz">
          <span className="secondtz__label">{secondTz}</span>
          <span className="secondtz__time">{secTzText}</span>
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {minuteLabel}
      </div>
    </div>
  );
}
