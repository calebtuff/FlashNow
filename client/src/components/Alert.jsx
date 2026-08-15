import Icon from './Icon.jsx';

const TONES = {
  critical: { bar: 'bg-hand', text: 'text-hand', icon: 'error' },
  caution: { bar: 'bg-caution', text: 'text-caution', icon: 'warning' },
  live: { bar: 'bg-radium', text: 'text-radium', icon: 'check_circle' },
  info: { bar: 'bg-lume-faint', text: 'text-lume-dim', icon: 'info' },
};

/**
 * A panel annunciator: a lit edge, a legend, and the message in lume.
 *
 * The message itself stays lume rather than taking the lamp colour, so long
 * text keeps its 15:1 contrast and the colour stays concentrated in the edge
 * and the icon, where it reads as a lamp rather than as tinted paragraph.
 */
export default function Alert({ tone = 'critical', icon, title, children, className = '' }) {
  const config = TONES[tone] ?? TONES.critical;

  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      className={['well flex gap-t3 rounded-sm p-t3', className].join(' ')}
    >
      <span className={`w-[3px] shrink-0 self-stretch ${config.bar}`} aria-hidden />
      <Icon name={icon ?? config.icon} className={`mt-px shrink-0 text-[18px] ${config.text}`} />
      <div className="min-w-0 text-body text-lume-dim">
        {title && <p className={`legend mb-1 text-tick ${config.text}`}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
