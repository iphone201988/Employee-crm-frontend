export const formatCurrency = (amount: number | undefined | null, currency: string = '€') => {
  if (amount === null || amount === undefined) return 'N/A';
  if (amount === 0) return '€0.00';
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatAmount = (amount: number) => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};