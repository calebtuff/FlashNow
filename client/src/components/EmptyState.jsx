import Icon from './Icon.jsx';

/**
 * An unlit panel.
 *
 * Reads as an instrument with nothing to display rather than a dashed box:
 * a ruled scale with no needle on it, the legend beneath, and the action that
 * would put a reading on the dial.
 */
export default function EmptyState({ icon, title, body, titleAs: Title = 'p', children }) {
  return (
    <div className="register flex flex-col items-center px-t4 py-t12 text-center">
      {icon && <Icon name={icon} className="text-[32px] text-steel-bright" />}

      {/* The empty scale: ruled, with nothing registered against it. */}
      <div className="scale-rule my-t4 w-40 max-w-full opacity-50" aria-hidden />

      <Title className="legend text-legend text-lume-dim">{title}</Title>
      {body && <p className="mx-auto mt-t2 max-w-[46ch] text-body text-lume-faint">{body}</p>}
      {children && <div className="mt-t4 flex flex-wrap justify-center gap-t2">{children}</div>}
    </div>
  );
}
