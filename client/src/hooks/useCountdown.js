import { useEffect, useState } from 'react';

export default function useCountdown(endIso) {
  const end = endIso ? new Date(endIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [end]);

  if (!end) {
    return { ended: false, label: '—', parts: null };
  }

  const diff = end - now;
  if (diff <= 0) {
    return { ended: true, label: 'Ended', parts: { d: 0, h: 0, m: 0, s: 0 } };
  }

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { ended: false, label: null, parts: { d, h, m, s } };
}
