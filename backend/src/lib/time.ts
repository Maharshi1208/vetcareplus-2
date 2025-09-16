export function hhmmToMinutes(hhmm: string): number {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) throw new Error('Invalid HH:MM time');
  const h = parseInt(m[1], 10), s = parseInt(m[2], 10);
  return h * 60 + s;
}
