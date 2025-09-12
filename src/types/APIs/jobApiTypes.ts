export interface Job {
  _id: string;
  name: string;
  description: string;
  clientId: string;
  jobTypeId: string;
  jobManagerId: string;
  startDate: string; 
  endDate: string; 
  jobCost: number;
  teamMembers: string[];
  status: 'notStarted' | 'inProgress' | 'completed' | 'onHold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}