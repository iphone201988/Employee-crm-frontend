export type TimeFormat = '0:00' | '00h00m' | '00:00:00';

export const formatTime = (hours: number, format: TimeFormat = '0:00'): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  const s = Math.round(((hours % 1) * 60 - m) * 60);

  switch (format) {
    case '0:00':
      return `${h}:${String(m).padStart(2, '0')}`;
    case '00h00m':
      return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}m`;
    case '00:00:00':
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    default:
      return `${h}:${String(m).padStart(2, '0')}`;
  }
};