const SIZE_CLASS = {
  sm: 'h-8 w-8 text-[0.6875rem]',
  md: 'h-10 w-10 text-body',
  lg: 'h-14 w-14 text-title',
  xl: 'h-20 w-20 text-register',
  profile: 'h-20 w-20 text-register',
};

function initialsFor(user) {
  const source = user?.displayName?.trim() || user?.username?.trim() || '';
  if (!source) return '?';
  return source.charAt(0).toUpperCase();
}

/**
 * Square with a machined edge, not a soft circle: this world has no rounded
 * chrome, and an engraved plate is what an instrument puts a name on.
 */
export default function UserAvatar({ user, size = 'md', className = '' }) {
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={['shrink-0 rounded-sm border border-steel bg-sunken object-cover', sizeClass, className].join(' ')}
      />
    );
  }

  return (
    <span
      className={[
        'legend inline-flex shrink-0 items-center justify-center rounded-sm border border-steel bg-high text-lume-dim',
        sizeClass,
        className,
      ].join(' ')}
      aria-hidden
    >
      {initialsFor(user)}
    </span>
  );
}
