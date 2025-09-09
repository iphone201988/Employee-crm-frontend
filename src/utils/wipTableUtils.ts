import { WIPJob } from '@/types/wipTable';

export const getJobStatusColor = (status: WIPJob['jobStatus']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'on-hold': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getActionStatusColor = (status: WIPJob['actionStatus']) => {
  switch (status) {
    case 'ready-to-invoice': return 'bg-green-100 text-green-800';
    case 'review': return 'bg-yellow-100 text-yellow-800';
    case 'upcoming': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getTriggerLabel = (trigger: string) => {
  const labels = {
    'monthly': 'Monthly',
    'threshold-500': 'Threshold €500',
    'threshold-1000': 'Threshold €1,000',
    'threshold-2000': 'Threshold €2,000',
    'threshold-2500': 'Threshold €2,500',
    'job-completion': 'Job Completion',
    '30-days': 'Every 30 Days',
    'manual-review': 'Manual Review',
    'bi-monthly': 'Bi-Monthly'
  };
  return labels[trigger as keyof typeof labels] || trigger;
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-GB');
};