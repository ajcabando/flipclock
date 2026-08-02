import type { ReactNode } from 'react';

// ─── Section ─────────────────────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel-section" aria-label={title}>
      <h3 className="panel-section__title">{title}</h3>
      <div className="panel-section__body">{children}</div>
    </section>
  );
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="row">
      <div className="row__text">
        <span className="row__label">{label}</span>
        {hint && <span className="row__hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <span className="toggle-wrap" title={disabled ? 'Requires the desktop build' : undefined}>
      {badge && <span className="badge">{badge}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className="switch"
        data-on={checked || undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </span>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  label: string;
}) {
  return (
    <div className="slider">
      <input
        type="range"
        className="slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider__value">{format(value)}</span>
    </div>
  );
}

// ─── Segmented control ────────────────────────────────────────────────────────

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          className="seg__btn"
          data-on={value === o.id || undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Chip group (fonts / faces) ──────────────────────────────────────────────

export function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string; hint?: string; sample?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="chips" role="listbox" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="option"
          aria-selected={value === o.id}
          className="chip"
          data-on={value === o.id || undefined}
          title={o.hint}
          style={o.sample ? { fontFamily: o.sample } : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
          {o.hint && <span className="chip__hint">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Color dots (accents) ─────────────────────────────────────────────────────

export function DotGroup<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string; color: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="dots" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          aria-label={o.label}
          title={o.label}
          className="dot"
          data-on={value === o.id || undefined}
          style={{ background: o.color }}
          onClick={() => onChange(o.id)}
        />
      ))}
    </div>
  );
}

// ─── Native select ────────────────────────────────────────────────────────────

export function Select({
  value,
  onChange,
  children,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {children}
    </select>
  );
}
