// Expense validation utilities
export interface ExpenseFormData {
  date: string;
  clientId: string;
  teamId: string;
  description: string;
  expreseCategory: string;
  netAmount: string;
  vatPercentage: string;
  status: string;
  file: File | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof ExpenseFormData, string>>;
}

// Individual field validators
export const validateDate = (date: string): string | null => {
  if (!date || date.trim() === '') {
    return 'Date is required';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }
  
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (dateObj > today) {
    return 'Date cannot be in the future';
  }
  
  return null;
};

export const validateClientId = (clientId: string): string | null => {
  if (!clientId || clientId.trim() === '') {
    return 'Client is required';
  }
  return null;
};

export const validateTeamId = (teamId: string): string | null => {
  if (!teamId || teamId.trim() === '') {
    return 'Team member is required';
  }
  return null;
};

export const validateDescription = (description: string): string | null => {
  // Description is optional; allow empty
  if (!description || description.trim() === '') {
    return null;
  }
  if (description.trim().length < 3) {
    return 'Description must be at least 3 characters long';
  }
  
  if (description.trim().length > 500) {
    return 'Description must be less than 500 characters';
  }
  
  return null;
};

export const validateExpenseCategory = (category: string): string | null => {
  if (!category || category.trim() === '') {
    return 'Category is required';
  }
  
  const validCategories = [
    'cro-filing-fee',
    'subsistence', 
    'accommodation',
    'mileage',
    'software',
    'stationary'
  ];
  
  if (!validCategories.includes(category)) {
    return 'Please select a valid category';
  }
  
  return null;
};

export const validateNetAmount = (amount: string): string | null => {
  if (!amount || amount.trim() === '') {
    return 'Amount is required';
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return 'Please enter a valid number';
  }
  
  if (numAmount <= 0) {
    return 'Amount must be greater than 0';
  }
  
  if (numAmount > 999999.99) {
    return 'Amount cannot exceed €999,999.99';
  }
  
  // Check for more than 2 decimal places
  if (amount.includes('.') && amount.split('.')[1] && amount.split('.')[1].length > 2) {
    return 'Amount cannot have more than 2 decimal places';
  }
  
  return null;
};

export const validateVatPercentage = (vat: string): string | null => {
  if (!vat || vat.trim() === '') {
    return 'VAT percentage is required';
  }
  
  const numVat = parseFloat(vat);
  
  if (isNaN(numVat)) {
    return 'Please enter a valid VAT percentage';
  }
  
  if (numVat < 0) {
    return 'VAT percentage cannot be negative';
  }
  
  if (numVat > 100) {
    return 'VAT percentage cannot exceed 100%';
  }
  
  return null;
};

export const validateStatus = (status: string): string | null => {
  if (!status || status.trim() === '') {
    return 'Status is required';
  }
  
  const validStatuses = ['yes', 'no'];
  if (!validStatuses.includes(status)) {
    return 'Please select a valid status';
  }
  
  return null;
};

// Main validation function
export const validateExpenseForm = (formData: ExpenseFormData, type: 'client' | 'team'): ValidationResult => {
  const errors: Partial<Record<keyof ExpenseFormData, string>> = {};

  // Validate required fields
  const dateError = validateDate(formData.date);
  if (dateError) errors.date = dateError;

  const descriptionError = validateDescription(formData.description);
  if (descriptionError) errors.description = descriptionError;

  const categoryError = validateExpenseCategory(formData.expreseCategory);
  if (categoryError) errors.expreseCategory = categoryError;

  const amountError = validateNetAmount(formData.netAmount);
  if (amountError) errors.netAmount = amountError;

  const vatError = validateVatPercentage(formData.vatPercentage);
  if (vatError) errors.vatPercentage = vatError;

  const statusError = validateStatus(formData.status);
  if (statusError) errors.status = statusError;

  // Validate conditional fields based on type
  if (type === 'client') {
    const clientError = validateClientId(formData.clientId);
    if (clientError) errors.clientId = clientError;
  } else if (type === 'team') {
    const teamError = validateTeamId(formData.teamId);
    if (teamError) errors.teamId = teamError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Single field validation for real-time validation
export const validateSingleField = (field: keyof ExpenseFormData, value: any, type?: 'client' | 'team'): string | null => {
  switch (field) {
    case 'date':
      return validateDate(value);
    case 'clientId':
      return type === 'client' ? validateClientId(value) : null;
    case 'teamId':
      return type === 'team' ? validateTeamId(value) : null;
    case 'description':
      return validateDescription(value);
    case 'expreseCategory':
      return validateExpenseCategory(value);
    case 'netAmount':
      return validateNetAmount(value);
    case 'vatPercentage':
      return validateVatPercentage(value);
    case 'status':
      return validateStatus(value);
    default:
      return null;
  }
};
