const TONES = {
  live: 'lamp-live',
  lead: 'lamp-lead',
  caution: 'lamp-caution',
  critical: 'lamp-critical',
  off: 'lamp-off',
};

/**
 * A panel lamp. Always legended: the word is the state and the colour only
 * reinforces it, so the interface still works in greyscale and for anyone who
 * cannot separate the radium and caution hues.
 */
export default function Lamp({ tone = 'off', children, pulse = false, className = '' }) {
  return (
    <span className={[TONES[tone] ?? TONES.off, pulse ? 'sweeping' : '', className].join(' ')}>
      {children}
    </span>
  );
}
