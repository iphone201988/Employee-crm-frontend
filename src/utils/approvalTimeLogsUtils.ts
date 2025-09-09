export const calculateAmount = (duration: string, rate: number) => {
  const [hours, minutes] = duration.split(':').map(Number);
  const totalHours = hours + minutes / 60;
  return (totalHours * rate).toFixed(2);
};

export const calculateClientSummary = (clientEntries: any[]) => {
  const billableTime = clientEntries.filter(e => e.billable === 'billable').reduce((sum, e) => {
    const [hours, minutes] = e.hours.split(':').map(Number);
    return sum + hours + minutes / 60;
  }, 0);
  
  const nonBillableTime = clientEntries.filter(e => e.billable === 'non-billable').reduce((sum, e) => {
    const [hours, minutes] = e.hours.split(':').map(Number);
    return sum + hours + minutes / 60;
  }, 0);
  
  const unknownTime = clientEntries.filter(e => e.billable === 'unknown').reduce((sum, e) => {
    const [hours, minutes] = e.hours.split(':').map(Number);
    return sum + hours + minutes / 60;
  }, 0);

  const formatTime = (totalHours: number) => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  };

  const billableAmount = billableTime * 75; // Assuming €75/hour for billable
  
  return {
    billable: formatTime(billableTime),
    billableAmount: billableAmount.toFixed(2),
    nonBillable: nonBillableTime > 0 ? formatTime(nonBillableTime) : 'N/A',
    unknown: unknownTime > 0 ? formatTime(unknownTime) : 'N/A'
  };
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'billable':
      return 'bg-green-100 text-green-800';
    case 'non-billable':
      return 'bg-red-100 text-red-800';
    case 'unknown':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPurposeColor = (purpose: string) => {
  switch (purpose) {
    case 'Accounts preparation':
      return 'bg-blue-100 text-blue-800';
    case 'Year end accounts':
      return 'bg-purple-100 text-purple-800';
    case 'Personal tax return':
      return 'bg-yellow-100 text-yellow-800';
    case 'Management accounts':
      return 'bg-indigo-100 text-indigo-800';
    case 'Client consultation':
      return 'bg-orange-100 text-orange-800';
    case 'Tax planning research':
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const formatDuration = (hours: string) => {
  return hours; // Already in 00:00:00 format
};