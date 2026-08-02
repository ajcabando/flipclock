import { useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  ACCENTS,
  ANIM_MODES,
  DEFAULTS,
  FACES,
  FONT_COLORS,
  FONTS,
  GRADIENTS,
  MAX_EXTRA_CLOCKS,
  THEMES,
  TIMEZONE_PRESETS,
  type BgType,
} from '../lib/settings';
import { isDesktop } from '../lib/desktop';
import { chime } from '../lib/chime';
import { Row, Section, Toggle, Slider, Segmented, ChipGroup, DotGroup } from './ui';
import { TimezoneSelector } from './TimezoneSelector';
import { CheckIcon, ChevronDownIcon, ExpandIcon, ImageIcon, PlusIcon, ResetIcon, VolumeIcon, XIcon } from './icons';

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onFullscreen: () => void;
}

export default function SettingsPanel({ open, onClose, onToast, onFullscreen }: Props) {
  const { settings, update, reset } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  const desktopAction = (fn: () => void, label: string) => {
    if (isDesktop) fn();
    else onToast(`${label} requires the desktop build (see README)`);
  };

  const setBackgroundType = (type: BgType) => {
    update({ background: { ...settings.background, type } });
  };

  // Restore just the world-clock sizing settings (Settings → World Clocks).
  const resetWorldClocks = () =>
    update({
      wcScale: DEFAULTS.wcScale,
      wcTimeSize: DEFAULTS.wcTimeSize,
      wcSecondsSize: DEFAULTS.wcSecondsSize,
      wcLabelSize: DEFAULTS.wcLabelSize,
      wcCitySize: DEFAULTS.wcCitySize,
    });

  // Pick a preset timezone not already in use for the next added clock.
  const addClock = () => {
    const used = new Set(settings.extraClocks);
    const next =
      TIMEZONE_PRESETS.find((p) => p.id !== 'local' && !used.has(p.id))?.id ?? 'Asia/Tokyo';
    update({ extraClocks: [...settings.extraClocks, next] });
  };

  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      onToast('Image too large — max 3 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update({ background: { ...settings.background, type: 'image', image: String(reader.result) } });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`settings-overlay ${open ? 'is-open' : ''}`} onClick={onClose} role="presentation">
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Clock settings"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-header">
          <div>
            <h2 className="panel-title">Settings</h2>
            <p className="panel-subtitle">Flip Clock — personalize every window independently</p>
          </div>
          <button type="button" className="icon-btn icon-btn--sm" onClick={onClose} aria-label="Close settings">
            <XIcon />
          </button>
        </header>

        {/* ── Appearance ─────────────────────────────────────────────── */}
        <Section title="Appearance">
          <div className="row row--stack">
            <span className="row__label">Theme</span>
            <div className="swatches" role="radiogroup" aria-label="Theme">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === t.id}
                  className="swatch"
                  data-on={settings.theme === t.id || undefined}
                  onClick={() => update({ theme: t.id })}
                >
                  <span className="swatch__dot" style={{ background: t.dot, boxShadow: `inset 0 0 0 1px ${t.ring}33` }} />
                  <span className="swatch__label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Row label="Auto theme" hint="Follow macOS light/dark appearance">
            <Toggle label="Auto theme" checked={settings.autoTheme} onChange={(v) => update({ autoTheme: v })} />
          </Row>

          <Row label="Accent color" hint="Glow, shadows and active controls">
            <DotGroup
              label="Accent color"
              value={settings.accent}
              options={ACCENTS.map((a) => ({ id: a.id, label: a.label, color: a.hex }))}
              onChange={(v) => update({ accent: v })}
            />
          </Row>

          <div className="row row--stack">
            <span className="row__label">Digit color</span>
            <div className="fontcolor">
              <div className="dots" role="radiogroup" aria-label="Digit color">
                {FONT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.fontColor === (c.hex || 'auto')}
                    aria-label={c.label}
                    title={c.label}
                    className={`dot ${c.hex ? '' : 'dot--auto'}`}
                    data-on={settings.fontColor === (c.hex || 'auto') || undefined}
                    style={c.hex ? { background: c.hex } : undefined}
                    onClick={() => update({ fontColor: c.hex || 'auto' })}
                  />
                ))}
              </div>
              <label className="fontcolor__custom" title="Pick a custom color">
                <input
                  type="color"
                  value={settings.fontColor && settings.fontColor !== 'auto' ? settings.fontColor : '#ffffff'}
                  onChange={(e) => update({ fontColor: e.target.value })}
                  aria-label="Custom digit color"
                />
                Custom
              </label>
            </div>
          </div>

          <div className="row row--stack">
            <span className="row__label">Font</span>
            <ChipGroup
              label="Font"
              value={settings.font}
              options={FONTS.map((f) => ({ id: f.id, label: f.label, sample: f.sample }))}
              onChange={(v) => update({ font: v })}
            />
          </div>

          <Row label="Digit size" hint="Auto follows each font's default">
            <span className="row__actions">
              <button
                type="button"
                className={`chip ${settings.digitRatio === 0 ? 'chip--on' : ''}`}
                aria-pressed={settings.digitRatio === 0}
                onClick={() => update({ digitRatio: 0 })}
              >
                Auto
              </button>
              <Slider
                label="Digit size"
                value={settings.digitRatio > 0 ? settings.digitRatio : 0.68}
                min={0.4}
                max={1}
                step={0.02}
                onChange={(v) => update({ digitRatio: v })}
                format={(v) => (settings.digitRatio === 0 ? 'Auto' : `${Math.round(v * 100)}%`)}
              />
            </span>
          </Row>

          <div className="row row--stack">
            <span className="row__label">Clock face</span>
            <div className="chips" role="listbox" aria-label="Clock face">
              {FACES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="option"
                  aria-selected={settings.face === f.id}
                  className="chip chip--face"
                  data-on={settings.face === f.id || undefined}
                  data-face-preview={f.id}
                  title={f.hint}
                  onClick={() => update({ face: f.id })}
                >
                  <span className="face-preview" aria-hidden="true">
                    <span className="face-preview__top" />
                    <span className="face-preview__bottom" />
                    <span className="face-preview__digit">88</span>
                    <span className="face-preview__seam" />
                  </span>
                  <span className="chip__label">{f.label}</span>
                  <span className="chip__hint">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="row row--stack">
            <span className="row__label">Background</span>
            <Segmented
              label="Background type"
              value={settings.background.type}
              options={[
                { id: 'theme', label: 'Theme' },
                { id: 'gradient', label: 'Gradient' },
                { id: 'image', label: 'Image' },
              ]}
              onChange={(v) => setBackgroundType(v as BgType)}
            />
            {settings.background.type === 'gradient' && (
              <div className="grads" role="radiogroup" aria-label="Gradient">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={settings.background.gradient === g.id}
                    aria-label={g.label}
                    title={g.label}
                    className="grad"
                    data-on={settings.background.gradient === g.id || undefined}
                    style={{ background: g.css }}
                    onClick={() => update({ background: { ...settings.background, gradient: g.id } })}
                  />
                ))}
              </div>
            )}
            {settings.background.type === 'image' && (
              <div className="bg-image-row">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                />
                <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
                  <ImageIcon />
                  {settings.background.image ? 'Replace image' : 'Choose image…'}
                </button>
                {settings.background.image && (
                  <>
                    <span className="bg-image-preview" style={{ backgroundImage: `url("${settings.background.image}")` }} />
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => update({ background: { ...settings.background, image: null, type: 'theme' } })}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <Row label="Transparency">
            <Slider
              label="Transparency"
              value={settings.transparency}
              min={40}
              max={100}
              onChange={(v) => update({ transparency: v })}
              format={(v) => `${v}%`}
            />
          </Row>

          <Row label="Rounded corners">
            <Slider
              label="Rounded corners"
              value={settings.cornerRadius}
              min={0}
              max={100}
              onChange={(v) => update({ cornerRadius: v })}
              format={(v) => `${v}%`}
            />
          </Row>

          <Row label="Animation speed">
            <Slider
              label="Animation speed"
              value={settings.animSpeed}
              min={100}
              max={800}
              step={10}
              onChange={(v) => update({ animSpeed: v })}
              format={(v) => `${v}ms`}
            />
          </Row>

          <Row label="Animations">
            <Segmented
              label="Animations"
              value={settings.animations}
              options={ANIM_MODES}
              onChange={(v) => update({ animations: v })}
            />
          </Row>

          <Row label="Shadows & glow">
            <Toggle label="Shadows and glow" checked={settings.showShadows} onChange={(v) => update({ showShadows: v })} />
          </Row>

          <Row label="High contrast">
            <Toggle label="High contrast" checked={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
          </Row>
        </Section>

        {/* ── Time ───────────────────────────────────────────────────── */}
        <Section title="Time">
          <div className="row row--stack">
            <span className="row__label">Timezone</span>
            <TimezoneSelector value={settings.timezone} onChange={(v) => update({ timezone: v })} />
          </div>

          <Row label="Format">
            <Segmented
              label="Hour format"
              value={settings.hour12 ? '12' : '24'}
              options={[
                { id: '12', label: '12-hour' },
                { id: '24', label: '24-hour' },
              ]}
              onChange={(v) => update({ hour12: v === '12' })}
            />
          </Row>

          <Row label="Show seconds">
            <Toggle label="Show seconds" checked={settings.showSeconds} onChange={(v) => update({ showSeconds: v })} />
          </Row>
          <Row label="Show AM / PM">
            <Toggle label="Show AM/PM" checked={settings.showAMPM} onChange={(v) => update({ showAMPM: v })} />
          </Row>
          <Row label="Leading zero" hint="04 vs 4 in 12-hour mode">
            <Toggle label="Leading zero" checked={settings.leadingZero} onChange={(v) => update({ leadingZero: v })} />
          </Row>
          <Row label="Show date">
            <Toggle label="Show date" checked={settings.showDate} onChange={(v) => update({ showDate: v })} />
          </Row>

          <Row
            label="Additional clocks"
            hint={`Add up to ${MAX_EXTRA_CLOCKS} more timezones — ${MAX_EXTRA_CLOCKS + 1} clocks total`}
          >
            <span className="row__actions">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={settings.extraClocks.length >= MAX_EXTRA_CLOCKS}
                onClick={addClock}
              >
                <PlusIcon width={14} height={14} />
                Add clock
              </button>
            </span>
          </Row>
          {settings.extraClocks.map((tz, i) => (
            <div key={i} className="row row--stack row--indent">
              <div className="row row--flush">
                <span className="row__label">Clock {i + 2}</span>
                <button
                  type="button"
                  className="icon-btn icon-btn--sm"
                  aria-label={`Remove clock ${i + 2}`}
                  title="Remove this clock"
                  onClick={() => update({ extraClocks: settings.extraClocks.filter((_, j) => j !== i) })}
                >
                  <XIcon width={14} height={14} />
                </button>
              </div>
              <TimezoneSelector
                value={tz}
                onChange={(v) =>
                  update({ extraClocks: settings.extraClocks.map((t, j) => (j === i ? v : t)) })
                }
                label={`Clock ${i + 2}`}
              />
            </div>
          ))}

          <Row label="Hourly chime" hint="Plays the hour count on the :00">
            <span className="row__actions">
              <Toggle label="Hourly chime" checked={settings.chime} onChange={(v) => update({ chime: v })} />
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                title="Test chime"
                aria-label="Test chime"
                onClick={() => {
                  chime.ensure();
                  chime.preview();
                }}
              >
                <VolumeIcon />
              </button>
            </span>
          </Row>
        </Section>

        {/* ── World Clocks ───────────────────────────────────────────── */}
        <Section title="World Clocks">
          <Row label="Size" hint="Scales every world clock card, independent of the main clock">
            <Slider
              label="World clock size"
              value={settings.wcScale}
              min={0.6}
              max={2}
              step={0.05}
              onChange={(v) => update({ wcScale: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Row>
          <Row label="Time font" hint="Hours & minutes flip digits">
            <Slider
              label="Time font size"
              value={settings.wcTimeSize}
              min={28}
              max={80}
              onChange={(v) => update({ wcTimeSize: v })}
              format={(v) => `${v}px`}
            />
          </Row>
          <Row label="Seconds">
            <Slider
              label="Seconds font size"
              value={settings.wcSecondsSize}
              min={16}
              max={30}
              onChange={(v) => update({ wcSecondsSize: v })}
              format={(v) => `${v}px`}
            />
          </Row>
          <Row label="Timezone label">
            <Slider
              label="Timezone label size"
              value={settings.wcLabelSize}
              min={12}
              max={24}
              onChange={(v) => update({ wcLabelSize: v })}
              format={(v) => `${v}px`}
            />
          </Row>
          <Row label="City label">
            <Slider
              label="City label size"
              value={settings.wcCitySize}
              min={10}
              max={20}
              onChange={(v) => update({ wcCitySize: v })}
              format={(v) => `${v}px`}
            />
          </Row>
          <div className="row row--actions">
            <button type="button" className="btn btn--ghost" onClick={resetWorldClocks}>
              <ResetIcon />
              Reset world clock sizes
            </button>
          </div>
        </Section>

        {/* ── Window ─────────────────────────────────────────────────── */}
        <Section title="Window">
          <Row label="Always on top">
            <Toggle
              label="Always on top"
              badge={!isDesktop ? 'desktop' : undefined}
              disabled={!isDesktop}
              checked={settings.alwaysOnTop}
              onChange={(v) => desktopAction(() => update({ alwaysOnTop: v }), 'Always on top')}
            />
          </Row>

          <Row label="Fullscreen" hint="Shortcut: F">
            <button type="button" className="btn" onClick={onFullscreen}>
              <ExpandIcon width={14} height={14} />
              Enter
            </button>
          </Row>

          <Row label="Click through" hint="Mouse clicks pass to the desktop">
            <Toggle
              label="Click through"
              badge={!isDesktop ? 'desktop' : undefined}
              disabled={!isDesktop}
              checked={settings.clickThrough}
              onChange={(v) => desktopAction(() => update({ clickThrough: v }), 'Click-through mode')}
            />
          </Row>

          <Row label="Remember position">
            <Toggle
              label="Remember position"
              badge={!isDesktop ? 'desktop' : undefined}
              disabled={!isDesktop}
              checked={settings.rememberPosition}
              onChange={(v) => update({ rememberPosition: v })}
            />
          </Row>

          <Row label="Remember size">
            <Toggle label="Remember size" checked={settings.rememberSize} onChange={(v) => update({ rememberSize: v })} />
          </Row>
        </Section>

        {/* ── Behavior ────────────────────────────────────────────────── */}
        <Section title="Behavior">
          <Row label="Launch at startup">
            <Toggle
              label="Launch at startup"
              badge={!isDesktop ? 'desktop' : undefined}
              disabled={!isDesktop}
              checked={settings.launchAtStartup}
              onChange={(v) => update({ launchAtStartup: v })}
            />
          </Row>

          <Row label="Remember settings" hint="Persist everything to local storage">
            <Toggle
              label="Remember settings"
              checked={settings.rememberSettings}
              onChange={(v) => update({ rememberSettings: v })}
            />
          </Row>

          <Row label="Share across windows" hint="All windows sync live">
            <Toggle
              label="Share across windows"
              checked={settings.shareAcrossWindows}
              onChange={(v) => update({ shareAcrossWindows: v })}
            />
          </Row>

          <Row label="Auto-hide UI" hint="Chrome fades after 3 s idle">
            <Toggle label="Auto-hide UI" checked={settings.autoHideUI} onChange={(v) => update({ autoHideUI: v })} />
          </Row>

          <Row label="Auto-scale to window" hint="Clock always fits the window">
            <Toggle label="Auto-scale to window" checked={settings.autoScale} onChange={(v) => update({ autoScale: v })} />
          </Row>

          <Row label="Clock size" hint="Shortcuts: + / −">
            <Slider
              label="Clock size"
              value={settings.scale}
              min={0.5}
              max={2.5}
              step={0.1}
              onChange={(v) => update({ scale: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Row>

          <div className="row row--actions">
            <button type="button" className="btn btn--danger" onClick={reset}>
              <ResetIcon />
              Reset all settings
            </button>
          </div>
        </Section>

        {/* ── Shortcuts ───────────────────────────────────────────────── */}
        <Section title="Keyboard shortcuts">
          <div className="keys">
            {(
              [
                ['F', 'Toggle fullscreen'],
                ['T', 'Toggle dark / light theme'],
                ['S', 'Toggle seconds'],
                ['D', 'Toggle date'],
                ['M', 'Toggle 12 / 24 hour'],
                ['H', 'Toggle auto-hide UI'],
                ['A', 'Always on top (desktop)'],
                ['+', 'Increase size'],
                ['-', 'Decrease size'],
                ['R', 'Reset window'],
                ['Esc', 'Exit fullscreen / close settings'],
              ] as const
            ).map(([k, desc]) => (
              <div key={k} className="keys__item">
                <span>{desc}</span>
                <kbd className="kbd">{k}</kbd>
              </div>
            ))}
          </div>
          <p className="panel-note">
            Each window keeps its own settings. Open the same URL in a new tab for another independent instance.
          </p>
        </Section>

        <div className="panel-footer">
          <span className="panel-footer__hint">
            Defaults restored: <CheckIcon width={12} height={12} /> {DEFAULTS.animSpeed}ms flips · dark · Inter
          </span>
          <ChevronDownIcon className="panel-footer__chevron" width={14} height={14} />
        </div>
      </div>
    </div>
  );
}
