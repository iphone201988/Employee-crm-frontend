import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DEFAULT_SERVICE_RATES } from "@/constants/teamConstants";
import { formatCurrency } from '@/lib/currency';
import ClientNameLink from '@/components/ClientNameLink';
import JobNameLink from '@/components/JobNameLink';
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
// Import profile images
import johnSmithProfile from '@/assets/profile-john-smith.png';
import sarahJohnsonProfile from '@/assets/profile-sarah-johnson.png';
import mikeWilsonProfile from '@/assets/profile-mike-wilson.png';
import emilyDavisProfile from '@/assets/profile-emily-davis.png';
import lisaThompsonProfile from '@/assets/profile-lisa-thompson.png';
import { JobForm } from './JobForm';
type JobStatus = 'queued' | 'in-progress' | 'with-client' | 'for-approval' | 'completed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
interface Job {
  id: string;
  jobName: string;
  clientName: string;
  jobType: string;
  startDate: string;
  endDate: string;
  estimatedCost: number;
  actualCost: number;
  status: JobStatus;
  priority: Priority;
  assignedTo: string;
  jobManager: string;
  team: string[];
  description: string;
}
const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};
const statusColors = {
  queued: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-green-100 text-green-800',
  'with-client': 'bg-orange-100 text-orange-800',
  'for-approval': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800'
};

// Sample jobs data
const sampleJobs: Job[] = [{
  id: 'job-1',
  jobName: 'Annual Tax Return',
  clientName: 'Water Savers Limited',
  jobType: 'Income Tax',
  startDate: '2025-01-15',
  endDate: '2025-03-15',
  estimatedCost: 2500,
  actualCost: 2200,
  status: 'in-progress',
  priority: 'high',
  assignedTo: 'John Smith',
  jobManager: 'Sarah Johnson',
  team: ['John Smith', 'Mike Wilson'],
  description: 'Complete annual tax return preparation and filing'
}, {
  id: 'job-2',
  jobName: 'Monthly Payroll',
  clientName: 'Green Gardens Limited',
  jobType: 'Payroll',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  estimatedCost: 800,
  actualCost: 750,
  status: 'completed',
  priority: 'medium',
  assignedTo: 'Sarah Johnson',
  jobManager: 'Emily Davis',
  team: ['Sarah Johnson'],
  description: 'Process monthly payroll for 25 employees'
}, {
  id: 'job-3',
  jobName: 'VAT Return Q4',
  clientName: 'Tech Solutions Inc.',
  jobType: 'VAT',
  startDate: '2025-01-10',
  endDate: '2025-02-10',
  estimatedCost: 600,
  actualCost: 0,
  status: 'with-client',
  priority: 'medium',
  assignedTo: 'Mike Wilson',
  jobManager: 'John Smith',
  team: ['Mike Wilson', 'Lisa Thompson'],
  description: 'Quarterly VAT return preparation and submission'
}, {
  id: 'job-4',
  jobName: 'Financial Audit',
  clientName: 'Brown Enterprises',
  jobType: 'Audit',
  startDate: '2025-02-01',
  endDate: '2025-04-30',
  estimatedCost: 5000,
  actualCost: 0,
  status: 'for-approval',
  priority: 'urgent',
  assignedTo: 'Emily Davis',
  jobManager: 'Sarah Johnson',
  team: ['Emily Davis', 'John Smith', 'Mike Wilson'],
  description: 'Annual financial audit and compliance review'
}, {
  id: 'job-5',
  jobName: 'Bookkeeping Services',
  clientName: 'Smith & Associates',
  jobType: 'Bookkeeping',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  estimatedCost: 3600,
  actualCost: 300,
  status: 'queued',
  priority: 'low',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Emily Davis',
  team: ['Lisa Thompson'],
  description: 'Ongoing monthly bookkeeping services'
}, {
  id: 'job-6',
  jobName: 'Corporation Tax',
  clientName: 'Digital Marketing Ltd',
  jobType: 'Income Tax',
  startDate: '2025-01-20',
  endDate: '2025-03-20',
  estimatedCost: 1800,
  actualCost: 900,
  status: 'in-progress',
  priority: 'high',
  assignedTo: 'John Smith',
  jobManager: 'Sarah Johnson',
  team: ['John Smith', 'Emily Davis'],
  description: 'Corporate tax preparation and filing'
}, {
  id: 'job-7',
  jobName: 'Management Accounts',
  clientName: 'Retail Solutions Inc',
  jobType: 'Management Accounts',
  startDate: '2025-01-05',
  endDate: '2025-02-05',
  estimatedCost: 1200,
  actualCost: 1100,
  status: 'completed',
  priority: 'medium',
  assignedTo: 'Mike Wilson',
  jobManager: 'John Smith',
  team: ['Mike Wilson'],
  description: 'Monthly management accounts preparation'
}, {
  id: 'job-8',
  jobName: 'VAT Return Q1',
  clientName: 'Construction Co Ltd',
  jobType: 'VAT',
  startDate: '2025-02-01',
  endDate: '2025-02-28',
  estimatedCost: 450,
  actualCost: 0,
  status: 'queued',
  priority: 'low',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Emily Davis',
  team: ['Lisa Thompson'],
  description: 'First quarter VAT return'
}, {
  id: 'job-9',
  jobName: 'Statutory Accounts',
  clientName: 'Food Services Ltd',
  jobType: 'Accounts Preparation',
  startDate: '2025-01-25',
  endDate: '2025-04-25',
  estimatedCost: 3200,
  actualCost: 800,
  status: 'with-client',
  priority: 'urgent',
  assignedTo: 'Sarah Johnson',
  jobManager: 'Mike Wilson',
  team: ['Sarah Johnson', 'Lisa Thompson'],
  description: 'Year-end statutory accounts preparation'
}, {
  id: 'job-10',
  jobName: 'PAYE Compliance',
  clientName: 'Healthcare Partners',
  jobType: 'Payroll',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  estimatedCost: 650,
  actualCost: 620,
  status: 'for-approval',
  priority: 'medium',
  assignedTo: 'Emily Davis',
  jobManager: 'Sarah Johnson',
  team: ['Emily Davis'],
  description: 'PAYE compliance and returns'
}, {
  id: 'job-11',
  jobName: 'Self Assessment',
  clientName: 'Individual Client 1',
  jobType: 'Income Tax',
  startDate: '2025-01-30',
  endDate: '2025-03-01',
  estimatedCost: 400,
  actualCost: 0,
  status: 'queued',
  priority: 'high',
  assignedTo: 'John Smith',
  jobManager: 'Emily Davis',
  team: ['John Smith'],
  description: 'Personal self-assessment tax return'
}, {
  id: 'job-12',
  jobName: 'Internal Audit',
  clientName: 'Manufacturing Ltd',
  jobType: 'Audit',
  startDate: '2025-02-15',
  endDate: '2025-05-15',
  estimatedCost: 4200,
  actualCost: 1000,
  status: 'in-progress',
  priority: 'medium',
  assignedTo: 'Mike Wilson',
  jobManager: 'John Smith',
  team: ['Mike Wilson', 'Sarah Johnson'],
  description: 'Internal audit procedures and reporting'
}, {
  id: 'job-13',
  jobName: 'Budget Planning',
  clientName: 'Consulting Group',
  jobType: 'Management Accounts',
  startDate: '2025-01-10',
  endDate: '2025-02-10',
  estimatedCost: 1500,
  actualCost: 750,
  status: 'with-client',
  priority: 'low',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Mike Wilson',
  team: ['Lisa Thompson', 'Emily Davis'],
  description: 'Annual budget planning and forecasting'
}, {
  id: 'job-14',
  jobName: 'Quarterly Review',
  clientName: 'Property Investments',
  jobType: 'Accounts Preparation',
  startDate: '2025-01-15',
  endDate: '2025-02-15',
  estimatedCost: 950,
  actualCost: 450,
  status: 'completed',
  priority: 'medium',
  assignedTo: 'Sarah Johnson',
  jobManager: 'Emily Davis',
  team: ['Sarah Johnson'],
  description: 'Quarterly financial review and analysis'
}, {
  id: 'job-15',
  jobName: 'Tax Advisory',
  clientName: 'Tech Startup Ltd',
  jobType: 'Tax Advisory',
  startDate: '2025-02-01',
  endDate: '2025-03-01',
  estimatedCost: 2200,
  actualCost: 0,
  status: 'for-approval',
  priority: 'urgent',
  assignedTo: 'John Smith',
  jobManager: 'Sarah Johnson',
  team: ['John Smith', 'Mike Wilson'],
  description: 'Strategic tax advisory services'
},
// Additional 15 jobs
{
  id: 'job-16',
  jobName: 'R&D Tax Credits',
  clientName: 'Innovation Labs Ltd',
  jobType: 'Tax Advisory',
  startDate: '2025-01-05',
  endDate: '2025-02-28',
  estimatedCost: 1800,
  actualCost: 900,
  status: 'in-progress',
  priority: 'high',
  assignedTo: 'Mike Wilson',
  jobManager: 'John Smith',
  team: ['Mike Wilson', 'Lisa Thompson'],
  description: 'R&D tax credit claim preparation'
}, {
  id: 'job-17',
  jobName: 'Transfer Pricing',
  clientName: 'Global Corp Ltd',
  jobType: 'Tax Advisory',
  startDate: '2025-02-10',
  endDate: '2025-04-10',
  estimatedCost: 6500,
  actualCost: 0,
  status: 'queued',
  priority: 'medium',
  assignedTo: 'Emily Davis',
  jobManager: 'Sarah Johnson',
  team: ['Emily Davis', 'John Smith', 'Mike Wilson'],
  description: 'Transfer pricing documentation and analysis'
}, {
  id: 'job-18',
  jobName: 'HMRC Enquiry',
  clientName: 'Retail Chain Ltd',
  jobType: 'Tax Advisory',
  startDate: '2025-01-20',
  endDate: '2025-03-20',
  estimatedCost: 3500,
  actualCost: 1750,
  status: 'with-client',
  priority: 'urgent',
  assignedTo: 'Sarah Johnson',
  jobManager: 'Emily Davis',
  team: ['Sarah Johnson', 'John Smith'],
  description: 'HMRC enquiry response and support'
}, {
  id: 'job-19',
  jobName: 'Pension Auto-Enrolment',
  clientName: 'Service Company Ltd',
  jobType: 'Payroll',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  estimatedCost: 750,
  actualCost: 720,
  status: 'completed',
  priority: 'medium',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Mike Wilson',
  team: ['Lisa Thompson'],
  description: 'Pension auto-enrolment setup and compliance'
}, {
  id: 'job-20',
  jobName: 'Financial Forecasting',
  clientName: 'Growth Tech Ltd',
  jobType: 'Management Accounts',
  startDate: '2025-01-25',
  endDate: '2025-02-25',
  estimatedCost: 2800,
  actualCost: 0,
  status: 'for-approval',
  priority: 'high',
  assignedTo: 'John Smith',
  jobManager: 'Sarah Johnson',
  team: ['John Smith', 'Emily Davis'],
  description: '12-month financial forecasting model'
}, {
  id: 'job-21',
  jobName: 'Compliance Review',
  clientName: 'Financial Services Ltd',
  jobType: 'Audit',
  startDate: '2025-02-05',
  endDate: '2025-03-05',
  estimatedCost: 4800,
  actualCost: 2400,
  status: 'in-progress',
  priority: 'high',
  assignedTo: 'Emily Davis',
  jobManager: 'John Smith',
  team: ['Emily Davis', 'Mike Wilson', 'Sarah Johnson'],
  description: 'Regulatory compliance audit and review'
}, {
  id: 'job-22',
  jobName: 'Year End Accounts',
  clientName: 'Manufacturing Co Ltd',
  jobType: 'Accounts Preparation',
  startDate: '2025-01-10',
  endDate: '2025-03-31',
  estimatedCost: 3200,
  actualCost: 800,
  status: 'queued',
  priority: 'medium',
  assignedTo: 'Mike Wilson',
  jobManager: 'Emily Davis',
  team: ['Mike Wilson', 'Lisa Thompson'],
  description: 'Year-end statutory accounts preparation'
}, {
  id: 'job-23',
  jobName: 'VAT Health Check',
  clientName: 'Hospitality Group Ltd',
  jobType: 'VAT',
  startDate: '2025-01-15',
  endDate: '2025-02-15',
  estimatedCost: 850,
  actualCost: 425,
  status: 'with-client',
  priority: 'low',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Mike Wilson',
  team: ['Lisa Thompson'],
  description: 'Comprehensive VAT compliance review'
}, {
  id: 'job-24',
  jobName: 'Payroll Year End',
  clientName: 'Education Services Ltd',
  jobType: 'Payroll',
  startDate: '2025-03-01',
  endDate: '2025-04-15',
  estimatedCost: 1200,
  actualCost: 0,
  status: 'queued',
  priority: 'high',
  assignedTo: 'Sarah Johnson',
  jobManager: 'John Smith',
  team: ['Sarah Johnson', 'Emily Davis'],
  description: 'Annual payroll year-end procedures'
}, {
  id: 'job-25',
  jobName: 'Cash Flow Analysis',
  clientName: 'Startup Ventures Ltd',
  jobType: 'Management Accounts',
  startDate: '2025-01-08',
  endDate: '2025-02-08',
  estimatedCost: 1600,
  actualCost: 800,
  status: 'completed',
  priority: 'medium',
  assignedTo: 'John Smith',
  jobManager: 'Sarah Johnson',
  team: ['John Smith'],
  description: 'Monthly cash flow analysis and projections'
}, {
  id: 'job-26',
  jobName: 'Corporation Tax Planning',
  clientName: 'Professional Services Ltd',
  jobType: 'Tax Advisory',
  startDate: '2025-02-15',
  endDate: '2025-03-15',
  estimatedCost: 2400,
  actualCost: 0,
  status: 'for-approval',
  priority: 'medium',
  assignedTo: 'Emily Davis',
  jobManager: 'Mike Wilson',
  team: ['Emily Davis', 'Lisa Thompson'],
  description: 'Corporation tax planning and optimization'
}, {
  id: 'job-27',
  jobName: 'Due Diligence',
  clientName: 'Acquisition Target Ltd',
  jobType: 'Audit',
  startDate: '2025-01-30',
  endDate: '2025-03-30',
  estimatedCost: 8500,
  actualCost: 2125,
  status: 'in-progress',
  priority: 'urgent',
  assignedTo: 'Mike Wilson',
  jobManager: 'Sarah Johnson',
  team: ['Mike Wilson', 'John Smith', 'Emily Davis', 'Lisa Thompson'],
  description: 'Financial due diligence for acquisition'
}, {
  id: 'job-28',
  jobName: 'Monthly Bookkeeping',
  clientName: 'E-commerce Ltd',
  jobType: 'Bookkeeping',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  estimatedCost: 480,
  actualCost: 460,
  status: 'completed',
  priority: 'low',
  assignedTo: 'Lisa Thompson',
  jobManager: 'Emily Davis',
  team: ['Lisa Thompson'],
  description: 'Monthly bookkeeping and reconciliation'
}, {
  id: 'job-29',
  jobName: 'Partnership Accounts',
  clientName: 'Legal Partnership',
  jobType: 'Accounts Preparation',
  startDate: '2025-02-01',
  endDate: '2025-04-01',
  estimatedCost: 2200,
  actualCost: 0,
  status: 'queued',
  priority: 'medium',
  assignedTo: 'Sarah Johnson',
  jobManager: 'John Smith',
  team: ['Sarah Johnson', 'Mike Wilson'],
  description: 'Partnership accounts preparation and filing'
}, {
  id: 'job-30',
  jobName: 'CIS Compliance',
  clientName: 'Construction Firm Ltd',
  jobType: 'Payroll',
  startDate: '2025-01-12',
  endDate: '2025-02-12',
  estimatedCost: 920,
  actualCost: 460,
  status: 'with-client',
  priority: 'high',
  assignedTo: 'John Smith',
  jobManager: 'Emily Davis',
  team: ['John Smith', 'Lisa Thompson'],
  description: 'Construction Industry Scheme compliance'
}];
const JobsTab = () => {
  const [jobs, setJobs] = useState<Job[]>(sampleJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [chartView, setChartView] = useState<'jobTypes' | 'teamMembers' | 'late' | 'jobManagers' | 'wipPercentage' | 'distribution'>('distribution');
  const [isReportCollapsed, setIsReportCollapsed] = useState(false);

  // Date filter states
  const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('yearly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Distribution filter states
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const serviceTypes = Object.keys(DEFAULT_SERVICE_RATES).map(key => ({
    key,
    name: key === 'vat' ? 'VAT' : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
  }));
  const teamMembers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'Lisa Thompson'];

  const { data: categoriesData } = useGetDropdownOptionsQuery("all");
  console.log('=================================', categoriesData?.data);

  // Profile image mapping
  const getProfileImage = (name: string): string => {
    const profileImages: Record<string, string> = {
      'John Smith': johnSmithProfile,
      'Sarah Johnson': sarahJohnsonProfile,
      'Mike Wilson': mikeWilsonProfile,
      'Emily Davis': emilyDavisProfile,
      'Lisa Thompson': lisaThompsonProfile
    };
    return profileImages[name] || '';
  };
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const openDialog = (job?: Job) => {
    setEditingJob(job || null);
    setDialogOpen(true);
  };
  const openViewDialog = (job: Job) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };
  const handleSubmit = (formData: Partial<Job>) => {
    if (editingJob) {
      // Edit existing job
      setJobs(jobs.map(job => job.id === editingJob.id ? {
        ...job,
        ...formData
      } : job));
    } else {
      // Add new job
      const newJob: Job = {
        id: generateId(),
        jobName: formData.jobName || '',
        clientName: formData.clientName || '',
        jobType: formData.jobType || '',
        startDate: formData.startDate || '',
        endDate: formData.endDate || '',
        estimatedCost: formData.estimatedCost || 0,
        actualCost: formData.actualCost || 0,
        status: formData.status || 'queued',
        priority: formData.priority || 'medium',
        assignedTo: formData.assignedTo || '',
        jobManager: teamMembers[0] || 'John Smith',
        // Default job manager
        team: [formData.assignedTo || teamMembers[0] || 'John Smith'],
        // Default team
        description: formData.description || ''
      };
      setJobs([...jobs, newJob]);
    }
    setDialogOpen(false);
    setEditingJob(null);
  };
  const deleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };
  const handleChartRowClick = (item: {
    type: string;
    count: number;
  }) => {
    if (chartView === 'teamMembers') {
      // Map display names back to status values
      const statusMapping: Record<string, string> = {
        'queued': 'queued',
        'in progress': 'in-progress',
        'with client': 'with-client',
        'for approval': 'for-approval',
        'completed': 'completed'
      };
      const statusValue = statusMapping[item.type.toLowerCase()] || item.type;
      setStatusFilter(statusValue);
    } else {
      // For all other views, reset to show all jobs and let user manually filter
      setStatusFilter('all');
      setPriorityFilter('all');
    }
  };
  // Get date range based on filter
  const getDateRange = (date: Date, filter: string) => {
    const start = new Date(date);
    const end = new Date(date);

    switch (filter) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const { start: dateRangeStart, end: dateRangeEnd } = getDateRange(selectedDate, dateFilter);

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;

    // Date filter - check if job overlaps with selected date range
    const jobStart = new Date(job.startDate);
    const jobEnd = new Date(job.endDate);
    const matchesDate = jobStart <= dateRangeEnd && jobEnd >= dateRangeStart;

    return matchesStatus && matchesPriority && matchesDate;
  });

  // Format date display
  const formatDateDisplay = () => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    switch (dateFilter) {
      case 'daily':
        return selectedDate.toLocaleDateString('en-GB', options);
      case 'weekly':
        const weekStart = new Date(selectedDate);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekNumber = Math.ceil(((selectedDate.getTime() - new Date(selectedDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
        return `${weekStart.toLocaleDateString('en-GB', options)} to ${weekEnd.toLocaleDateString('en-GB', options)} - Week ${weekNumber}`;
      case 'monthly':
        return selectedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      case 'yearly':
        return selectedDate.getFullYear().toString();
      default:
        return '';
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);

    switch (dateFilter) {
      case 'daily':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }

    setSelectedDate(newDate);
  };

  // Calculate job type distribution for chart
  const jobTypeDistribution = filteredJobs.reduce((acc, job) => {
    acc[job.jobType] = (acc[job.jobType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate team member distribution for chart (by status)
  const teamStatusDistribution = filteredJobs.reduce((acc, job) => {
    const statusKey = job.status === 'in-progress' ? 'in progress' : job.status === 'with-client' ? 'with client' : job.status === 'for-approval' ? 'for approval' : job.status;
    acc[statusKey] = (acc[statusKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate cost vs WIP distribution
  const costVsWipDistribution = {
    'Under Budget': filteredJobs.filter(job => job.actualCost > 0 && job.actualCost < job.estimatedCost).length,
    'On Budget': filteredJobs.filter(job => job.actualCost > 0 && job.actualCost === job.estimatedCost).length,
    'Over Budget': filteredJobs.filter(job => job.actualCost > 0 && job.actualCost > job.estimatedCost).length,
    'Not Started': filteredJobs.filter(job => job.actualCost === 0).length
  };

  // Calculate job manager distribution
  const jobManagerDistribution = filteredJobs.reduce((acc, job) => {
    acc[job.jobManager] = (acc[job.jobManager] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate WIP % of Fee distribution
  const wipPercentageDistribution = {
    '0-25%': filteredJobs.filter(job => {
      if (job.estimatedCost === 0) return false;
      const percentage = job.actualCost / job.estimatedCost * 100;
      return percentage >= 0 && percentage <= 25;
    }).length,
    '26-50%': filteredJobs.filter(job => {
      if (job.estimatedCost === 0) return false;
      const percentage = job.actualCost / job.estimatedCost * 100;
      return percentage > 25 && percentage <= 50;
    }).length,
    '51-75%': filteredJobs.filter(job => {
      if (job.estimatedCost === 0) return false;
      const percentage = job.actualCost / job.estimatedCost * 100;
      return percentage > 50 && percentage <= 75;
    }).length,
    '76-100%': filteredJobs.filter(job => {
      if (job.estimatedCost === 0) return false;
      const percentage = job.actualCost / job.estimatedCost * 100;
      return percentage > 75 && percentage <= 100;
    }).length
  };

  // Calculate late distribution (overdue jobs only)
  const now = new Date();
  const lateDistribution = {
    'Overdue 1-3 days': filteredJobs.filter(job => {
      const endDate = new Date(job.endDate);
      const diffDays = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 1 && diffDays <= 3;
    }).length,
    'Overdue 4-7 days': filteredJobs.filter(job => {
      const endDate = new Date(job.endDate);
      const diffDays = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 4 && diffDays <= 7;
    }).length,
    'Overdue 8+ days': filteredJobs.filter(job => {
      const endDate = new Date(job.endDate);
      const diffDays = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 8;
    }).length
  };
  const jobTypeChartData = Object.entries(jobTypeDistribution).map(([type, count]) => ({
    type,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 5); // Top 5 job types

  const teamChartData = Object.entries(teamStatusDistribution).map(([type, count]) => ({
    type,
    count
  })).sort((a, b) => b.count - a.count);
  const lateChartData = Object.entries(lateDistribution).map(([type, count]) => ({
    type,
    count
  })).filter(item => item.count > 0);
  const jobManagerChartData = Object.entries(jobManagerDistribution).map(([manager, count]) => ({
    type: manager,
    count
  })).sort((a, b) => b.count - a.count);
  const wipPercentageChartData = Object.entries(wipPercentageDistribution).map(([range, count]) => ({
    type: range,
    count
  })).filter(item => item.count > 0);

  // Calculate team member distribution by type and status
  const teamDistributionData = teamMembers.map(member => {
    const memberJobs = filteredJobs.filter(job => job.assignedTo === member);
    const jobTypeBreakdown = memberJobs.reduce((acc, job) => {
      acc[job.jobType] = (acc[job.jobType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusBreakdown = memberJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      member,
      totalJobs: memberJobs.length,
      jobTypes: jobTypeBreakdown,
      statuses: statusBreakdown
    };
  });

  // Get unique job types and statuses for distribution filters
  const allJobTypes = [...new Set(filteredJobs.map(job => job.jobType))];
  const allStatuses = [...new Set(filteredJobs.map(job => job.status))];

  // Get filtered statuses based on selected job type
  const getFilteredStatuses = () => {
    if (selectedJobType === 'all') return allStatuses;
    return [...new Set(filteredJobs.filter(job => job.jobType === selectedJobType).map(job => job.status))];
  };

  const handleJobTypeClick = (jobType: string) => {
    setSelectedJobType(jobType);
    setSelectedStatus('all'); // Reset status filter when job type changes
  };

  // Sorting function
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Apply sorting to filtered jobs
  const sortedJobs = useMemo(() => {
    if (!sortColumn) return filteredJobs;

    return [...filteredJobs].sort((a, b) => {
      let aValue = a[sortColumn as keyof typeof a];
      let bValue = b[sortColumn as keyof typeof b];

      // Handle special cases
      if (sortColumn === 'estimatedCost' || sortColumn === 'actualCost') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredJobs, sortColumn, sortDirection]);

  const chartData = chartView === 'jobTypes' ? jobTypeChartData :
    chartView === 'teamMembers' ? teamChartData :
      chartView === 'late' ? lateChartData :
        chartView === 'jobManagers' ? jobManagerChartData :
          chartView === 'distribution' ? [] : wipPercentageChartData;

  // Calculate status counts for workflow tabs
  const statusCounts = filteredJobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return <div className="space-y-6">
    {/* Date Filter */}
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Button
              variant={dateFilter === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('daily')}
            >
              Daily
            </Button>
            <Button
              variant={dateFilter === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={dateFilter === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={dateFilter === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter('yearly')}
            >
              Yearly
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {formatDateDisplay()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Distribution Chart */}
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant={chartView === 'distribution' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('distribution')}>
                Distribution
              </Button>
              <Button variant={chartView === 'jobTypes' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('jobTypes')}>
                Job Types
              </Button>
              <Button variant={chartView === 'teamMembers' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('teamMembers')}>
                By Status
              </Button>
              <Button variant={chartView === 'jobManagers' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('jobManagers')}>
                By Job Manager
              </Button>
              <Button variant={chartView === 'late' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('late')}>
                Late
              </Button>
              <Button variant={chartView === 'wipPercentage' ? 'default' : 'outline'} size="sm" onClick={() => setChartView('wipPercentage')}>
                WIP % of Fee
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReportCollapsed(!isReportCollapsed)}
              className="ml-2"
            >
              {isReportCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
          {!isReportCollapsed && (chartView === 'distribution' ? (
            <div className="space-y-4">

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Total Jobs</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleJobTypeClick('all')}>
                      Job Types {selectedJobType !== 'all' && <Badge variant="outline" className="ml-2">Filtered</Badge>}
                    </TableHead>
                    <TableHead>Job Statuses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamDistributionData.map((data, index) => {
                    // Filter the data based on selected filters
                    const filteredJobTypes = selectedJobType === 'all'
                      ? data.jobTypes
                      : Object.fromEntries(Object.entries(data.jobTypes).filter(([type]) => type === selectedJobType));

                    const filteredStatuses = selectedStatus === 'all'
                      ? data.statuses
                      : Object.fromEntries(Object.entries(data.statuses).filter(([status]) => status === selectedStatus));

                    const filteredTotalJobs = selectedJobType === 'all' && selectedStatus === 'all'
                      ? data.totalJobs
                      : filteredJobs.filter(job =>
                        job.assignedTo === data.member &&
                        (selectedJobType === 'all' || job.jobType === selectedJobType) &&
                        (selectedStatus === 'all' || job.status === selectedStatus)
                      ).length;

                    // Only show rows with jobs matching the filters
                    if (filteredTotalJobs === 0) return null;

                    return (
                      <TableRow key={data.member}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getProfileImage(data.member)} alt={data.member} />
                            <AvatarFallback>{data.member.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          {data.member}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{filteredTotalJobs}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(filteredJobTypes).map(([type, count]) => (
                              <Badge
                                key={type}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-muted"
                                onClick={() => handleJobTypeClick(type)}
                              >
                                {type}: {count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(filteredStatuses).map(([status, count]) => (
                              <Badge key={status} variant="outline" className="text-xs">
                                {status}: {count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-2">
              {chartData.map((item, index) => {
                const getBarColor = () => {
                  if (chartView === 'wipPercentage') {
                    // Color coded ranges: 0-25% green, 26-50% yellow, 51-75% orange, 76-100% red
                    const wipColors = ['hsl(142, 71%, 45%)', 'hsl(47, 96%, 53%)', 'hsl(25, 95%, 53%)', 'hsl(0, 84%, 60%)'];
                    return wipColors[index] || `hsl(${index * 60}, 65%, 50%)`;
                  }
                  return `hsl(${(index * 137) % 360}, 70%, 55%)`;
                };
                const percentage = Math.round((item.count / Math.max(...chartData.map(d => d.count)) * 100));
                return <div key={item.type} onClick={() => handleChartRowClick(item)} className="group flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-muted/30 hover:to-muted/10 rounded-lg p-3 -m-1 transition-all duration-300 border border-transparent hover:border-border/50 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-sm border border-white/20" style={{
                      backgroundColor: getBarColor(),
                      boxShadow: `0 2px 8px ${getBarColor()}20`
                    }} />
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-64 bg-muted/70 rounded-full h-3 overflow-hidden border border-border/30 shadow-inner">
                      <Progress
                        value={percentage}
                        className="h-3 [&>div]:transition-all [&>div]:duration-700"
                        style={{
                          '--progress-background': getBarColor(),
                          '--progress-foreground': getBarColor()
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right">{item.count}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">{percentage}%</span>
                  </div>
                </div>;
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Workflow Status Tabs */}
    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
      <div className="flex justify-between items-center mb-6 pb-6">
        <TabsList>
          <TabsTrigger value="all">All ({filteredJobs.length})</TabsTrigger>
          <TabsTrigger value="queued">Queued ({statusCounts.queued || 0})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({statusCounts['in-progress'] || 0})</TabsTrigger>
          <TabsTrigger value="with-client">With Client ({statusCounts['with-client'] || 0})</TabsTrigger>
          <TabsTrigger value="for-approval">For Approval ({statusCounts['for-approval'] || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({statusCounts.completed || 0})</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Job
          </Button>
        </div>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('jobName')}>
                  Job Name {sortColumn === 'jobName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('clientName')}>
                  Client {sortColumn === 'clientName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('jobType')}>
                  Job Type {sortColumn === 'jobType' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                  Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium cursor-pointer hover:bg-muted/50" onClick={() => handleSort('jobManager')}>
                  Job Manager {sortColumn === 'jobManager' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium">Team</TableHead>
                <TableHead className="font-medium text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('estimatedCost')}>
                  Job Fee {sortColumn === 'estimatedCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('actualCost')}>
                  Job WIP {sortColumn === 'actualCost' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="font-medium text-right">WIP % of Fee</TableHead>
                <TableHead className="font-medium text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map(job => <TableRow key={job.id}>
                <TableCell className="font-medium">
                  <JobNameLink
                    jobName={job.jobName}
                    jobFee={job.estimatedCost}
                    wipAmount={job.actualCost}
                    hoursLogged={Math.round(job.actualCost / 150)}
                  />
                </TableCell>
                <TableCell><ClientNameLink clientName={job.clientName} /></TableCell>
                <TableCell>{job.jobType}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${statusColors[job.status]}`}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getProfileImage(job.jobManager)} />
                      <AvatarFallback className="text-xs">
                        {job.jobManager.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {job.team.slice(0, 3).map((member, index) => <Avatar key={index} className="h-6 w-6">
                      <AvatarImage src={getProfileImage(member)} />
                      <AvatarFallback className="text-xs">
                        {member.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>)}
                    {job.team.length > 3 && <span className="text-xs text-muted-foreground ml-1">
                      +{job.team.length - 3}
                    </span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(job.estimatedCost)}</TableCell>
                <TableCell className="text-right">{job.actualCost > 0 ? formatCurrency(job.actualCost) : '-'}</TableCell>
                <TableCell className="text-right">
                  {job.estimatedCost > 0 && job.actualCost > 0 ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Progress
                        value={Math.min(100, Math.round(job.actualCost / job.estimatedCost * 100))}
                        className="w-12 h-2"
                      />
                      <span className="text-xs min-w-[2.5rem]">
                        {Math.round(job.actualCost / job.estimatedCost * 100)}%
                      </span>
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Button variant="ghost" size="sm" onClick={() => openViewDialog(job)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDialog(job)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Tabs>

    {/* Add/Edit Job Dialog */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
        </DialogHeader>

        <JobForm job={editingJob} serviceTypes={serviceTypes} teamMembers={teamMembers} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} />
      </DialogContent>
    </Dialog>

    {/* View Job Dialog */}
    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        {selectedJob && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Job Name</Label>
              <p className="text-sm text-muted-foreground">{selectedJob.jobName}</p>
            </div>
            <div>
              <Label>Client</Label>
              <p className="text-sm text-muted-foreground">{selectedJob.clientName}</p>
            </div>
            <div>
              <Label>Type</Label>
              <p className="text-sm text-muted-foreground">{selectedJob.jobType}</p>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant="outline" className={`text-xs ${statusColors[selectedJob.status]}`}>
                {selectedJob.status}
              </Badge>
            </div>
            <div>
              <Label>Priority</Label>
              <Badge variant="outline" className={`text-xs ${priorityColors[selectedJob.priority]}`}>
                {selectedJob.priority}
              </Badge>
            </div>
            <div>
              <Label>Assigned To</Label>
              <p className="text-sm text-muted-foreground">{selectedJob.assignedTo}</p>
            </div>
            <div>
              <Label>Start Date</Label>
              <p className="text-sm text-muted-foreground">{new Date(selectedJob.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label>End Date</Label>
              <p className="text-sm text-muted-foreground">{new Date(selectedJob.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label>Estimated Cost</Label>
              <p className="text-sm text-muted-foreground">{formatCurrency(selectedJob.estimatedCost)}</p>
            </div>
            <div>
              <Label>Actual Cost</Label>
              <p className="text-sm text-muted-foreground">
                {selectedJob.actualCost > 0 ? formatCurrency(selectedJob.actualCost) : 'Not yet incurred'}
              </p>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
          </div>
        </div>}
      </DialogContent>
    </Dialog>
  </div>;
};

// Job Form Component
export default JobsTab;