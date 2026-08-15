import Register from './Register.jsx';

/**
 * A ruled panel of registers. The hairline gaps come from a steel ground
 * showing between rows, so the stack reads as one instrument rather than as
 * a scatter of separate cards.
 */
export function RegisterStackSkeleton({ count = 5 }) {
  return (
    <div className="space-y-px" aria-busy="true" aria-label="Loading lots">
      {Array.from({ length: count }, (_, k) => (
        <div key={k} className="register p-t4">
          <div className="flex gap-t4">
            <div className="h-20 w-20 shrink-0 animate-pulse bg-high sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-t3">
              <div className="scale-rule w-full opacity-40" />
              <div className="h-7 w-24 animate-pulse bg-high" />
              <div className="h-4 w-2/3 animate-pulse bg-high" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RegisterStack({ auctions, children }) {
  return (
    <div className="space-y-px bg-steel">
      {auctions.map((a, i) =>
        children ? children(a, i) : <Register key={a.id} auction={a} row={i} />
      )}
    </div>
  );
}
