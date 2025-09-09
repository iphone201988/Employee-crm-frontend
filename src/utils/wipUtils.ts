import { formatCurrency } from '@/lib/currency';
import { WIPData, WIPClientGroup } from '@/types/wip';

export const groupByClient = (data: WIPData[]): WIPClientGroup[] => {
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.clientName]) {
      acc[item.clientName] = [];
    }
    acc[item.clientName].push(item);
    return acc;
  }, {} as Record<string, WIPData[]>);

  return Object.entries(grouped).map(([clientName, jobs]) => ({
    clientName,
    jobs,
    totalWIP: jobs.reduce((sum, job) => sum + job.wipAmount, 0),
    totalUnbilled: jobs.reduce((sum, job) => sum + job.unbilledAmount, 0),
    totalOutstanding: jobs.reduce((sum, job) => sum + job.outstandingAmount, 0)
  }));
};

export const getTriggerLabel = (trigger: string) => {
  const labels = {
    'monthly': 'Monthly',
    'job-completion': 'Job Completion',
    'manual-review': 'Manual Review',
    'threshold-500': 'Threshold €500',
    'threshold-1000': 'Threshold €1000',
    '30-days': '30 Days'
  };
  return labels[trigger as keyof typeof labels] || trigger;
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-GB');
};

export const getJobStatusColor = (status: string) => {
  const statusColors = {
    'active': 'bg-green-100 text-green-800',
    'completed': 'bg-blue-100 text-blue-800',
    'on-hold': 'bg-yellow-100 text-yellow-800'
  };
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
};