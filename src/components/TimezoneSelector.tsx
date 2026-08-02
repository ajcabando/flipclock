import { useMemo, useState } from 'react';
import { TIMEZONE_PRESETS } from '../lib/settings';
import { buildZoneGroups } from '../lib/time';

export function TimezoneSelector({
  value,
  onChange,
  label = 'Timezone',
}: {
  value: string;
  onChange: (tz: string) => void;
  label?: string;
}) {
  const groups = useMemo(() => buildZoneGroups(), []);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = groups;
    if (q) {
      list = groups
        .map((g) => ({ region: g.region, zones: g.zones.filter((z) => z.toLowerCase().includes(q)) }))
        .filter((g) => g.zones.length > 0);
    }
    // Always make sure UTC/GMT and the current selection are reachable.
    const extra = new Set<string>(['UTC', 'GMT', value]);
    for (const g of list) for (const z of g.zones) extra.delete(z);
    if (extra.size > 0) {
      list = [...list, { region: 'Other', zones: [...extra].sort() }];
    }
    return list;
  }, [groups, query, value]);

  const selectValue = value === 'local' ? 'local' : value;

  return (
    <div className="tz-selector">
      <div className="tz-selector__chips">
        {TIMEZONE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${value === p.id ? 'chip--on' : ''}`}
            aria-pressed={value === p.id}
            onClick={() => onChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="tz-selector__row">
        <input
          type="text"
          className="input"
          placeholder="Search timezone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${label.toLowerCase()}`}
        />
        <select className="select" value={selectValue} onChange={(e) => onChange(e.target.value)} aria-label={label}>
          <option value="local">Local</option>
          {filtered.map((g) => (
            <optgroup key={g.region} label={g.region}>
              {g.zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
