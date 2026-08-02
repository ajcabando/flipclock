import { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getTimeParts, tzCityName, tzShortName } from '../lib/time';
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
  extraClocks,
}: {
  now: Date;
  animate: boolean;
  extraClocks: string[];
}) {
  const { settings } = useSettings();

  const parts = useMemo(
    () => getTimeParts(now, settings.timezone, settings.hour12, settings.leadingZero),
    [now, settings.timezone, settings.hour12, settings.leadingZero],
  );

  const blink = now.getSeconds() % 2 === 0;
  const minuteLabel = `${parts.hours.join('')}:${parts.minutes.join('')}${parts.ampm ? ` ${parts.ampm}` : ''}`;
  const clockLabel = (tz: string) => tzShortName(now, tz);

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

      {extraClocks.length > 0 && (
        <div
          className={`worldclocks${extraClocks.length === 1 ? ' worldclocks--single' : ''}`}
          role="group"
          aria-label="Additional timezone clocks"
        >
          {extraClocks.map((tz, i) => {
            const wp = getTimeParts(now, tz, settings.hour12, settings.leadingZero);
            const wpLabel = `${wp.hours.join('')}:${wp.minutes.join('')}`;
            const city = tzCityName(tz);
            const tzShort = clockLabel(tz);
            return (
              <div
                key={`${tz}-${i}`}
                className="worldclock"
                role="group"
                aria-label={`${city} — ${wpLabel}`}
              >
                <div className="worldclock__cards">
                  {wp.hours.map((d, j) => (
                    <FlipCard key={`wh-${i}-${j}`} value={d} animate={animate} />
                  ))}
                  <Colon blink={blink} />
                  {wp.minutes.map((d, j) => (
                    <FlipCard key={`wm-${i}-${j}`} value={d} animate={animate} />
                  ))}
                </div>
                <div className="worldclock__meta">
                  <span className="worldclock__meta-left">
                    <span className="worldclock__city">{city}</span>
                    {tzShort !== city && <span className="worldclock__label">{tzShort}</span>}
                  </span>
                  {settings.showSeconds && <span className="worldclock__seconds">{wp.seconds}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {minuteLabel}
      </div>
    </div>
  );
}
