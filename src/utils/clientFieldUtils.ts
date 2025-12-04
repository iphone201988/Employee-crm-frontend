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
  
  // If it's already a date string in YYYY-MM-DD format, parse it directly
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parts = value.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return fallback;
  
  // Use UTC methods to avoid timezone issues
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

export const parseDateValue = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  const trimmed = value.trim();
  if (!trimmed || isPlaceholderValue(trimmed)) return undefined;
  
  // If it's a YYYY-MM-DD format, parse it directly to avoid timezone issues
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month = parseInt(yyyymmddMatch[2], 10) - 1; // Month is 0-indexed
    const day = parseInt(yyyymmddMatch[3], 10);
    const parsed = new Date(year, month, day);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }
  
  // Fallback to standard Date parsing
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};


