export const isPlaceholderValue = (value?: string | null): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = trimmed.toUpperCase();
  return normalized === 'N/A' || normalized === 'NO EMAIL' || normalized === 'NO PHONE';
};

export const normalizeOptionalText = (value?: string | null): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderValue(trimmed)) {
    return '';
  }
  return trimmed;
};

export const formatDateToDMY = (value?: string | Date | null, fallback = '-'): string => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const parseDateValue = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return undefined;
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};


