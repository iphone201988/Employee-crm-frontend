export interface TimeLogFormData {
  date: string;
  clientId: string;
  jobId: string;
  jobTypeId: string;
  teamId: string;
  purposeId: string;
  description: string;
  duration: number;
  billable: boolean;
  rate: string;
  status: 'notInvoiced' | 'invoiced' | 'paid';
}

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof TimeLogFormData, string>>;
}

export const validateDate = (date: string): string | null => {
  if (!date || !date.trim()) {
    return 'Date is required';
  }
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }
  
  // Check if date is not in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  if (dateObj > today) {
    return 'Date cannot be in the future';
  }
  
  return null;
};

export const validateClient = (clientId: string): string | null => {
  if (!clientId || !clientId.trim()) {
    return 'Client is required';
  }
  return null;
};

export const validateJob = (jobId: string): string | null => {
  if (!jobId || !jobId.trim()) {
    return 'Job is required';
  }
  return null;
};

export const validateJobType = (jobTypeId: string): string | null => {
  if (!jobTypeId || !jobTypeId.trim()) {
    return 'Job type is required';
  }
  return null;
};

export const validateTeam = (teamId: string): string | null => {
  if (!teamId || !teamId.trim()) {
    return 'Team is required';
  }
  return null;
};

export const validatePurpose = (purposeId: string): string | null => {
  if (!purposeId || !purposeId.trim()) {
    return 'Time purpose is required';
  }
  return null;
};

export const validateDescription = (description: string): string | null => {
  if (!description || !description.trim()) {
    return 'Description is required';
  }
  
  if (description.trim().length < 3) {
    return 'Description must be at least 3 characters';
  }
  
  if (description.trim().length > 500) {
    return 'Description must be less than 500 characters';
  }
  
  return null;
};

export const validateDuration = (duration: number): string | null => {
  if (!duration || duration <= 0) {
    return 'Duration must be greater than 0';
  }
  
  // Check if duration is reasonable (not more than 24 hours)
  if (duration > 24 * 3600) { // 24 hours in seconds
    return 'Duration cannot exceed 24 hours';
  }
  
  return null;
};

export const validateRate = (rate: string, billable: boolean): string | null => {
  if (billable) {
    if (!rate || !rate.trim()) {
      return 'Rate is required when billable';
    }
    
    const rateNum = parseFloat(rate);
    if (isNaN(rateNum) || rateNum < 0) {
      return 'Rate must be a valid positive number';
    }
    
    if (rateNum > 10000) {
      return 'Rate cannot exceed 10,000';
    }
  }
  
  return null;
};

export const validateTimeLogForm = (formData: TimeLogFormData): ValidationResult => {
  const errors: Partial<Record<keyof TimeLogFormData, string>> = {};

  // Validate required fields
  const dateError = validateDate(formData.date);
  if (dateError) errors.date = dateError;

  const clientError = validateClient(formData.clientId);
  if (clientError) errors.clientId = clientError;

  const jobError = validateJob(formData.jobId);
  if (jobError) errors.jobId = jobError;

  const jobTypeError = validateJobType(formData.jobTypeId);
  if (jobTypeError) errors.jobTypeId = jobTypeError;

  const teamError = validateTeam(formData.teamId);
  if (teamError) errors.teamId = teamError;

  const purposeError = validatePurpose(formData.purposeId);
  if (purposeError) errors.purposeId = purposeError;

  const descriptionError = validateDescription(formData.description);
  if (descriptionError) errors.description = descriptionError;

  const durationError = validateDuration(formData.duration);
  if (durationError) errors.duration = durationError;

  const rateError = validateRate(formData.rate, formData.billable);
  if (rateError) errors.rate = rateError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSingleField = (field: keyof TimeLogFormData, value: any, formData?: Partial<TimeLogFormData>): string | null => {
  switch (field) {
    case 'date':
      return validateDate(value);
    case 'clientId':
      return validateClient(value);
    case 'jobId':
      return validateJob(value);
    case 'jobTypeId':
      return validateJobType(value);
    case 'teamId':
      return validateTeam(value);
    case 'purposeId':
      return validatePurpose(value);
    case 'description':
      return validateDescription(value);
    case 'duration':
      return validateDuration(value);
    case 'rate':
      return validateRate(value, formData?.billable || false);
    default:
      return null;
  }
};
