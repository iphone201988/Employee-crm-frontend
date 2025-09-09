import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from '@/lib/currency';

interface JobData {
  jobName: string;
  clientName: string;
  jobType: string;
}

interface JobTypeData {
  jobType: string;
  numberOfJobs: number;
  totalCosts: number;
  writeOffValue: number;
  percentageWriteOff: number;
  jobsWithWriteOff: number;
  jobs: JobData[];
  jobsWithWriteOffList: JobData[];
}

const JobTypesReportTab = () => {
  const [selectedJobs, setSelectedJobs] = useState<{ type: string; jobs: JobData[] } | null>(null);
  const [viewMode, setViewMode] = useState<'jobType' | 'client' | 'team'>('jobType'); // Updated to fix caching issue
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Sample data for job types report
  const jobTypeData: JobTypeData[] = [
    {
      jobType: 'Annual Accounts',
      numberOfJobs: 15,
      totalCosts: 52000,
      writeOffValue: 4200,
      percentageWriteOff: 8.1,
      jobsWithWriteOff: 8,
      jobs: [
        { jobName: 'Annual Accounts - W1 2025', clientName: 'Smith & Co Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W2 2025', clientName: 'Green Gardens Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W3 2025', clientName: 'Tech Solutions Inc', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W4 2025', clientName: 'Brown Enterprises', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W5 2025', clientName: 'Water Savers Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W6 2025', clientName: 'Blue Sky Trading', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W7 2025', clientName: 'Red Rose Consulting', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W8 2025', clientName: 'Golden Gate Corp', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W9 2025', clientName: 'Silver Stone Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W10 2025', clientName: 'Crystal Clear Services', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W11 2025', clientName: 'Bright Future Holdings', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W12 2025', clientName: 'Quick Response Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W13 2025', clientName: 'Fast Track Solutions', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W14 2025', clientName: 'Smart Move Associates', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W15 2025', clientName: 'New Wave Enterprises', jobType: 'Annual Accounts' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Annual Accounts - W1 2025', clientName: 'Smith & Co Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W3 2025', clientName: 'Tech Solutions Inc', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W5 2025', clientName: 'Water Savers Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W7 2025', clientName: 'Red Rose Consulting', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W9 2025', clientName: 'Silver Stone Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W11 2025', clientName: 'Bright Future Holdings', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W13 2025', clientName: 'Fast Track Solutions', jobType: 'Annual Accounts' },
        { jobName: 'Annual Accounts - W15 2025', clientName: 'New Wave Enterprises', jobType: 'Annual Accounts' }
      ]
    },
    {
      jobType: 'Audit',
      numberOfJobs: 8,
      totalCosts: 78000,
      writeOffValue: 6800,
      percentageWriteOff: 8.7,
      jobsWithWriteOff: 4,
      jobs: [
        { jobName: 'Audit - 2024', clientName: 'Morrison Holdings Ltd', jobType: 'Audit' },
        { jobName: 'Audit - 2023', clientName: 'Pacific Trading Co', jobType: 'Audit' },
        { jobName: 'Audit - 2022', clientName: 'Metro Finance Group', jobType: 'Audit' },
        { jobName: 'Audit - 2021', clientName: 'Central Business Hub', jobType: 'Audit' },
        { jobName: 'Audit - 2020', clientName: 'Atlantic Ventures Ltd', jobType: 'Audit' },
        { jobName: 'Audit - 2019', clientName: 'Northern Star Corp', jobType: 'Audit' },
        { jobName: 'Audit - 2018', clientName: 'Southern Cross Trading', jobType: 'Audit' },
        { jobName: 'Audit - 2017', clientName: 'Eastern Bay Holdings', jobType: 'Audit' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Audit - 2024', clientName: 'Morrison Holdings Ltd', jobType: 'Audit' },
        { jobName: 'Audit - 2023', clientName: 'Pacific Trading Co', jobType: 'Audit' },
        { jobName: 'Audit - 2022', clientName: 'Metro Finance Group', jobType: 'Audit' },
        { jobName: 'Audit - 2021', clientName: 'Central Business Hub', jobType: 'Audit' }
      ]
    },
    {
      jobType: 'Payroll',
      numberOfJobs: 25,
      totalCosts: 16800,
      writeOffValue: 1450,
      percentageWriteOff: 8.6,
      jobsWithWriteOff: 12,
      jobs: [
        { jobName: 'Payroll - W1 2025', clientName: 'Alpha Systems Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W2 2025', clientName: 'Beta Corp', jobType: 'Payroll' },
        { jobName: 'Payroll - W3 2025', clientName: 'Gamma Industries', jobType: 'Payroll' },
        { jobName: 'Payroll - W4 2025', clientName: 'Delta Holdings', jobType: 'Payroll' },
        { jobName: 'Payroll - W5 2025', clientName: 'Epsilon Trading', jobType: 'Payroll' },
        { jobName: 'Payroll - W6 2025', clientName: 'Zeta Services', jobType: 'Payroll' },
        { jobName: 'Payroll - W7 2025', clientName: 'Eta Consulting', jobType: 'Payroll' },
        { jobName: 'Payroll - W8 2025', clientName: 'Theta Group', jobType: 'Payroll' },
        { jobName: 'Payroll - W9 2025', clientName: 'Iota Solutions', jobType: 'Payroll' },
        { jobName: 'Payroll - W10 2025', clientName: 'Kappa Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W11 2025', clientName: 'Lambda Corp', jobType: 'Payroll' },
        { jobName: 'Payroll - W12 2025', clientName: 'Mu Enterprises', jobType: 'Payroll' },
        { jobName: 'Payroll - W13 2025', clientName: 'Nu Holdings', jobType: 'Payroll' },
        { jobName: 'Payroll - W14 2025', clientName: 'Xi Trading', jobType: 'Payroll' },
        { jobName: 'Payroll - W15 2025', clientName: 'Omicron Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W16 2025', clientName: 'Pi Services', jobType: 'Payroll' },
        { jobName: 'Payroll - W17 2025', clientName: 'Rho Group', jobType: 'Payroll' },
        { jobName: 'Payroll - W18 2025', clientName: 'Sigma Corp', jobType: 'Payroll' },
        { jobName: 'Payroll - W19 2025', clientName: 'Tau Industries', jobType: 'Payroll' },
        { jobName: 'Payroll - W20 2025', clientName: 'Upsilon Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W21 2025', clientName: 'Phi Holdings', jobType: 'Payroll' },
        { jobName: 'Payroll - W22 2025', clientName: 'Chi Trading', jobType: 'Payroll' },
        { jobName: 'Payroll - W23 2025', clientName: 'Psi Solutions', jobType: 'Payroll' },
        { jobName: 'Payroll - W24 2025', clientName: 'Omega Corp', jobType: 'Payroll' },
        { jobName: 'Payroll - W25 2025', clientName: 'Apex Ventures', jobType: 'Payroll' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Payroll - W1 2025', clientName: 'Alpha Systems Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W3 2025', clientName: 'Gamma Industries', jobType: 'Payroll' },
        { jobName: 'Payroll - W5 2025', clientName: 'Epsilon Trading', jobType: 'Payroll' },
        { jobName: 'Payroll - W7 2025', clientName: 'Eta Consulting', jobType: 'Payroll' },
        { jobName: 'Payroll - W9 2025', clientName: 'Iota Solutions', jobType: 'Payroll' },
        { jobName: 'Payroll - W11 2025', clientName: 'Lambda Corp', jobType: 'Payroll' },
        { jobName: 'Payroll - W13 2025', clientName: 'Nu Holdings', jobType: 'Payroll' },
        { jobName: 'Payroll - W15 2025', clientName: 'Omicron Ltd', jobType: 'Payroll' },
        { jobName: 'Payroll - W17 2025', clientName: 'Rho Group', jobType: 'Payroll' },
        { jobName: 'Payroll - W19 2025', clientName: 'Tau Industries', jobType: 'Payroll' },
        { jobName: 'Payroll - W21 2025', clientName: 'Phi Holdings', jobType: 'Payroll' },
        { jobName: 'Payroll - W23 2025', clientName: 'Psi Solutions', jobType: 'Payroll' }
      ]
    },
    {
      jobType: 'VAT Return',
      numberOfJobs: 20,
      totalCosts: 11200,
      writeOffValue: 890,
      percentageWriteOff: 7.9,
      jobsWithWriteOff: 10,
      jobs: [
        { jobName: 'VAT Return - Q1 2025', clientName: 'Nexus Partners', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q2 2025', clientName: 'Vertex Solutions', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2025', clientName: 'Zenith Corp', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q4 2025', clientName: 'Pinnacle Ltd', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2024', clientName: 'Summit Holdings', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q2 2024', clientName: 'Crest Trading', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2024', clientName: 'Acme Industries', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q4 2024', clientName: 'Prime Services', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2023', clientName: 'Elite Group', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q2 2023', clientName: 'Stellar Corp', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2023', clientName: 'Dynamic Ltd', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q4 2023', clientName: 'Velocity Holdings', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2022', clientName: 'Impact Solutions', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q2 2022', clientName: 'Fusion Trading', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2022', clientName: 'Matrix Corp', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q4 2022', clientName: 'Phoenix Ltd', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2021', clientName: 'Quantum Services', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q2 2021', clientName: 'Catalyst Group', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2021', clientName: 'Prism Holdings', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q4 2021', clientName: 'Synergy Corp', jobType: 'VAT Return' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'VAT Return - Q1 2025', clientName: 'Nexus Partners', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2025', clientName: 'Zenith Corp', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2024', clientName: 'Summit Holdings', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2024', clientName: 'Acme Industries', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2023', clientName: 'Elite Group', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2023', clientName: 'Dynamic Ltd', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2022', clientName: 'Impact Solutions', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2022', clientName: 'Matrix Corp', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q1 2021', clientName: 'Quantum Services', jobType: 'VAT Return' },
        { jobName: 'VAT Return - Q3 2021', clientName: 'Prism Holdings', jobType: 'VAT Return' }
      ]
    },
    {
      jobType: 'Tax Return',
      numberOfJobs: 30,
      totalCosts: 24500,
      writeOffValue: 2100,
      percentageWriteOff: 8.6,
      jobsWithWriteOff: 15,
      jobs: [
        { jobName: 'Tax Return - 2024', clientName: 'Global Enterprises', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2023', clientName: 'Universal Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2022', clientName: 'Continental Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2021', clientName: 'International Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2020', clientName: 'Worldwide Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2019', clientName: 'Transnational Group', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2018', clientName: 'Multinational Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2017', clientName: 'Metropolitan Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2016', clientName: 'Regional Solutions', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2015', clientName: 'National Trading', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2014', clientName: 'Federal Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2013', clientName: 'State Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2012', clientName: 'Provincial Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2011', clientName: 'Local Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2010', clientName: 'City Group', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2009', clientName: 'District Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2008', clientName: 'County Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2007', clientName: 'Borough Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2006', clientName: 'Parish Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2005', clientName: 'Ward Trading', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2004', clientName: 'Zone Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2003', clientName: 'Sector Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2002', clientName: 'Division Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2001', clientName: 'Unit Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2000', clientName: 'Branch Group', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 1999', clientName: 'Office Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 1998', clientName: 'Desk Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 1997', clientName: 'Station Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 1996', clientName: 'Point Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 1995', clientName: 'Center Trading', jobType: 'Tax Return' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Tax Return - 2024', clientName: 'Global Enterprises', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2023', clientName: 'Universal Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2022', clientName: 'Continental Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2021', clientName: 'International Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2020', clientName: 'Worldwide Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2019', clientName: 'Transnational Group', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2018', clientName: 'Multinational Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2017', clientName: 'Metropolitan Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2016', clientName: 'Regional Solutions', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2015', clientName: 'National Trading', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2014', clientName: 'Federal Corp', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2013', clientName: 'State Holdings', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2012', clientName: 'Provincial Ltd', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2011', clientName: 'Local Services', jobType: 'Tax Return' },
        { jobName: 'Tax Return - 2010', clientName: 'City Group', jobType: 'Tax Return' }
      ]
    },
    {
      jobType: 'Corporation Tax',
      numberOfJobs: 12,
      totalCosts: 19800,
      writeOffValue: 1650,
      percentageWriteOff: 8.3,
      jobsWithWriteOff: 6,
      jobs: [
        { jobName: 'Corporation Tax - 2024', clientName: 'Heritage Group', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2023', clientName: 'Legacy Holdings', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2022', clientName: 'Foundation Corp', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2021', clientName: 'Cornerstone Ltd', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2020', clientName: 'Milestone Services', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2019', clientName: 'Keystone Trading', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2018', clientName: 'Benchmark Group', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2017', clientName: 'Standard Holdings', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2016', clientName: 'Quality Corp', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2015', clientName: 'Excellence Ltd', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2014', clientName: 'Premium Services', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2013', clientName: 'Superior Trading', jobType: 'Corporation Tax' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Corporation Tax - 2024', clientName: 'Heritage Group', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2023', clientName: 'Legacy Holdings', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2022', clientName: 'Foundation Corp', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2021', clientName: 'Cornerstone Ltd', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2020', clientName: 'Milestone Services', jobType: 'Corporation Tax' },
        { jobName: 'Corporation Tax - 2019', clientName: 'Keystone Trading', jobType: 'Corporation Tax' }
      ]
    },
    {
      jobType: 'Bookkeeping',
      numberOfJobs: 18,
      totalCosts: 18600,
      writeOffValue: 1580,
      percentageWriteOff: 8.5,
      jobsWithWriteOff: 9,
      jobs: [
        { jobName: 'Bookkeeping - Jan 2025', clientName: 'Horizon Enterprises', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Feb 2025', clientName: 'Vista Holdings', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Mar 2025', clientName: 'Outlook Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Apr 2025', clientName: 'Perspective Ltd', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - May 2025', clientName: 'Viewpoint Services', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jun 2025', clientName: 'Panorama Trading', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jul 2025', clientName: 'Landscape Group', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Aug 2025', clientName: 'Scenery Holdings', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Sep 2025', clientName: 'Picture Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Oct 2025', clientName: 'Image Ltd', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Nov 2025', clientName: 'Frame Services', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Dec 2025', clientName: 'Canvas Trading', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jan 2024', clientName: 'Portrait Group', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Feb 2024', clientName: 'Sketch Holdings', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Mar 2024', clientName: 'Drawing Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Apr 2024', clientName: 'Design Ltd', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - May 2024', clientName: 'Art Services', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jun 2024', clientName: 'Creative Trading', jobType: 'Bookkeeping' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Bookkeeping - Jan 2025', clientName: 'Horizon Enterprises', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Mar 2025', clientName: 'Outlook Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - May 2025', clientName: 'Viewpoint Services', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jul 2025', clientName: 'Landscape Group', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Sep 2025', clientName: 'Picture Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Nov 2025', clientName: 'Frame Services', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Jan 2024', clientName: 'Portrait Group', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - Mar 2024', clientName: 'Drawing Corp', jobType: 'Bookkeeping' },
        { jobName: 'Bookkeeping - May 2024', clientName: 'Art Services', jobType: 'Bookkeeping' }
      ]
    },
    {
      jobType: 'Management Accounts',
      numberOfJobs: 10,
      totalCosts: 16500,
      writeOffValue: 1420,
      percentageWriteOff: 8.6,
      jobsWithWriteOff: 5,
      jobs: [
        { jobName: 'Management Accounts - Q1 2025', clientName: 'Strategy Partners', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q2 2025', clientName: 'Vision Holdings', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q3 2025', clientName: 'Mission Corp', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q4 2025', clientName: 'Purpose Ltd', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q1 2024', clientName: 'Goal Services', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q2 2024', clientName: 'Target Trading', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q3 2024', clientName: 'Objective Group', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q4 2024', clientName: 'Aim Holdings', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q1 2023', clientName: 'Focus Corp', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q2 2023', clientName: 'Direction Ltd', jobType: 'Management Accounts' }
      ],
      jobsWithWriteOffList: [
        { jobName: 'Management Accounts - Q1 2025', clientName: 'Strategy Partners', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q3 2025', clientName: 'Mission Corp', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q1 2024', clientName: 'Goal Services', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q3 2024', clientName: 'Objective Group', jobType: 'Management Accounts' },
        { jobName: 'Management Accounts - Q1 2023', clientName: 'Focus Corp', jobType: 'Management Accounts' }
      ]
    }
  ];

  // Calculate totals
  const totalJobs = jobTypeData.reduce((sum, item) => sum + item.numberOfJobs, 0);
  const totalCosts = jobTypeData.reduce((sum, item) => sum + item.totalCosts, 0);
  const totalWriteOff = jobTypeData.reduce((sum, item) => sum + item.writeOffValue, 0);
  const totalJobsWithWriteOff = jobTypeData.reduce((sum, item) => sum + item.jobsWithWriteOff, 0);
  const averageWriteOffPercentage = totalCosts > 0 ? (totalWriteOff / totalCosts) * 100 : 0;

  // Group data by client when viewMode is 'client'
  const groupedByClient = viewMode === 'client' ? jobTypeData.reduce((acc, jobType) => {
    jobType.jobs.forEach(job => {
      if (!acc[job.clientName]) {
        acc[job.clientName] = [];
      }
      acc[job.clientName].push({
        jobName: job.jobName,
        clientName: job.clientName,
        jobType: job.jobType,
        totalCosts: jobType.totalCosts / jobType.numberOfJobs, // Average cost per job
        writeOffValue: jobType.writeOffValue / jobType.numberOfJobs, // Average write off per job
        percentageWriteOff: jobType.percentageWriteOff
      });
    });
    return acc;
  }, {} as Record<string, any[]>) : {};

  const clientData = Object.entries(groupedByClient).map(([clientName, jobs]) => ({
    clientName,
    numberOfJobs: jobs.length,
    totalCosts: jobs.reduce((sum, job) => sum + job.totalCosts, 0),
    writeOffValue: jobs.reduce((sum, job) => sum + job.writeOffValue, 0),
    percentageWriteOff: jobs.length > 0 ? (jobs.reduce((sum, job) => sum + job.writeOffValue, 0) / jobs.reduce((sum, job) => sum + job.totalCosts, 0)) * 100 : 0,
    jobsWithWriteOff: jobs.length, // For demo purposes, assuming all jobs have write offs
    jobs: jobs
  }));

  // Team data for write off analysis by team member
  const teamData = [
    {
      teamMember: 'John Smith',
      role: 'Senior Accountant',
      numberOfJobs: 25,
      totalCosts: 45000,
      writeOffValue: 3800,
      percentageWriteOff: 8.4,
      jobsWithWriteOff: 12,
      jobs: [
        { jobName: 'Annual Accounts - Smith & Co Ltd', clientName: 'Smith & Co Ltd', jobType: 'Annual Accounts' },
        { jobName: 'Tax Return - Global Enterprises', clientName: 'Global Enterprises', jobType: 'Tax Return' },
        { jobName: 'Audit - Morrison Holdings Ltd', clientName: 'Morrison Holdings Ltd', jobType: 'Audit' }
      ]
    },
    {
      teamMember: 'Sarah Connor',
      role: 'Tax Specialist',
      numberOfJobs: 18,
      totalCosts: 32000,
      writeOffValue: 2700,
      percentageWriteOff: 8.4,
      jobsWithWriteOff: 8,
      jobs: [
        { jobName: 'VAT Return - Nexus Partners', clientName: 'Nexus Partners', jobType: 'VAT Return' },
        { jobName: 'Corporation Tax - Heritage Group', clientName: 'Heritage Group', jobType: 'Corporation Tax' }
      ]
    },
    {
      teamMember: 'Mike Johnson',
      role: 'Junior Accountant',
      numberOfJobs: 30,
      totalCosts: 28000,
      writeOffValue: 2400,
      percentageWriteOff: 8.6,
      jobsWithWriteOff: 15,
      jobs: [
        { jobName: 'Payroll - Alpha Systems Ltd', clientName: 'Alpha Systems Ltd', jobType: 'Payroll' },
        { jobName: 'Bookkeeping - Horizon Enterprises', clientName: 'Horizon Enterprises', jobType: 'Bookkeeping' }
      ]
    }
  ];

  const getCurrentData = () => {
    if (viewMode === 'client') return clientData;
    if (viewMode === 'team') return teamData;
    return jobTypeData;
  };

  const currentData = getCurrentData();
  
  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-6">

      {/* Dashboard Cards moved to top */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Total Jobs"
          value={totalJobs}
        />
        
        <DashboardCard
          title="Total Costs"
          value={formatCurrency(totalCosts)}
        />
        
        <DashboardCard
          title="Total Write Offs"
          value={formatCurrency(totalWriteOff)}
        />
        
        <DashboardCard
          title="Jobs with Write Offs"
          value={totalJobsWithWriteOff}
        />
      </DashboardGrid>

      {/* View Mode Switcher moved below dashboard */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'jobType' ? 'default' : 'outline'}
            onClick={() => setViewMode('jobType')}
            className="px-3 py-1 h-8 text-sm"
          >
            Job Type
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'client' ? 'default' : 'outline'}
            onClick={() => setViewMode('client')}
            className="px-3 py-1 h-8 text-sm"
          >
            Client
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'team' ? 'default' : 'outline'}
            onClick={() => setViewMode('team')}
            className="px-3 py-1 h-8 text-sm"
          >
            Team
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                 <TableRow className="border-b border-border bg-muted/50">
                    <TableHead className="border-r p-3 text-foreground h-12">Expand</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">{viewMode === 'client' ? 'Client Name' : viewMode === 'team' ? 'Team Member' : 'Job Type'}</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">No. of Jobs</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">No. Jobs With Write Off Value</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">Total Fees</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">Write Off Value</TableHead>
                    <TableHead className="border-r p-3 text-foreground h-12">Write Off Logic</TableHead>
                    <TableHead className="p-3 text-foreground h-12">% Wrote Off</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                  {currentData.map((item, index) => (
                    <React.Fragment key={index}>
                      <TableRow className="border-b border-border hover:bg-muted/30 transition-colors h-12">
                        <TableCell className="p-3 text-center border-r">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleExpand(index)}
                            className="p-1 h-6 w-6"
                          >
                            {expandedRows.has(index) ? '−' : '+'}
                          </Button>
                        </TableCell>
                        <TableCell className="p-3 font-medium text-foreground border-r text-sm">
                          {viewMode === 'client' ? (item as any).clientName : viewMode === 'team' ? (item as any).teamMember : (item as any).jobType}
                        </TableCell>
                        <TableCell className="p-3 text-center border-r">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted/50 bg-blue-100 text-blue-800 text-sm"
                            onClick={() => setSelectedJobs({ 
                              type: viewMode === 'client' ? (item as any).clientName : viewMode === 'team' ? (item as any).teamMember : (item as any).jobType, 
                              jobs: (item as any).jobs 
                            })}
                          >
                            {item.numberOfJobs}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3 text-center border-r">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-muted/50 bg-red-100 text-red-800 text-sm"
                            onClick={() => setSelectedJobs({ 
                              type: `${viewMode === 'client' ? (item as any).clientName : viewMode === 'team' ? (item as any).teamMember : (item as any).jobType} - Write Off Jobs`, 
                              jobs: (item as any).jobs || (item as any).jobsWithWriteOffList 
                            })}
                          >
                           {item.jobsWithWriteOff}
                         </Badge>
                       </TableCell>
                        <TableCell className="p-3 text-right text-foreground border-r text-sm">{formatCurrency(item.totalCosts)}</TableCell>
                        <TableCell className="p-3 text-right text-foreground border-r text-sm">{formatCurrency(item.writeOffValue)}</TableCell>
                        <TableCell className="p-3 text-center text-foreground border-r text-sm">
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {Math.random() > 0.5 ? 'Proportionally' : 'Manually'}
                          </span>
                        </TableCell>
                        <TableCell className="p-3 text-right text-foreground text-sm">{item.percentageWriteOff.toFixed(1)}%</TableCell>
                     </TableRow>
                     {expandedRows.has(index) && (
                       <TableRow className="bg-muted/20">
                         <TableCell colSpan={8} className="p-0">
                           <div className="p-4">
                             
                             <Table>
                               <TableHeader>
                                 <TableRow>
                                   <TableHead>Job Name</TableHead>
                                   <TableHead>Client Name</TableHead>
                                   <TableHead>Job Type</TableHead>
                                   <TableHead>Write Off Logic</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                 {(item as any).jobs?.slice(0, 5).map((job: JobData, jobIndex: number) => (
                                   <TableRow key={jobIndex}>
                                     <TableCell>{job.jobName}</TableCell>
                                     <TableCell>{job.clientName}</TableCell>
                                     <TableCell>{job.jobType}</TableCell>
                                     <TableCell>
                                       <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                         {Math.random() > 0.5 ? 'Proportionally' : 'Manually'}
                                       </span>
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                             {(item as any).jobs?.length > 5 && (
                               <p className="text-sm text-muted-foreground mt-2">
                                 Showing 5 of {(item as any).jobs.length} jobs
                               </p>
                             )}
                           </div>
                         </TableCell>
                       </TableRow>
                     )}
                    </React.Fragment>
                 ))}
                  {/* Totals row */}
                  <TableRow className="border-t-2 border-border bg-muted/20 font-semibold h-12">
                     <TableCell className="p-3 text-foreground border-r text-sm">-</TableCell>
                     <TableCell className="p-3 text-foreground border-r text-sm">TOTAL</TableCell>
                     <TableCell className="p-3 text-center text-foreground border-r text-sm">{totalJobs}</TableCell>
                     <TableCell className="p-3 text-center text-foreground border-r text-sm">{totalJobsWithWriteOff}</TableCell>
                     <TableCell className="p-3 text-right text-foreground border-r text-sm">{formatCurrency(totalCosts)}</TableCell>
                     <TableCell className="p-3 text-right text-foreground border-r text-sm">{formatCurrency(totalWriteOff)}</TableCell>
                     <TableCell className="p-3 text-center text-foreground border-r text-sm">-</TableCell>
                     <TableCell className="p-3 text-right text-foreground text-sm">{averageWriteOffPercentage.toFixed(1)}%</TableCell>
                  </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Dialog */}
      <Dialog open={selectedJobs !== null} onOpenChange={() => setSelectedJobs(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedJobs?.type}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                 <TableHeader>
                   <TableRow className="border-b border-border bg-muted/50">
                      <TableHead className="border-r p-3 text-foreground">Job Name</TableHead>
                      <TableHead className="border-r p-3 text-foreground">Client Name</TableHead>
                      <TableHead className="border-r p-3 text-foreground">Job Type</TableHead>
                      <TableHead className="p-3 text-foreground">Write Off Logic</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {selectedJobs?.jobs.map((job, index) => (
                     <TableRow key={index} className="border-b border-border hover:bg-muted/30 transition-colors">
                       <TableCell className="p-3 border-r">{job.jobName}</TableCell>
                       <TableCell className="p-3 border-r">{job.clientName}</TableCell>
                       <TableCell className="p-3 border-r">{job.jobType}</TableCell>
                       <TableCell className="p-3">
                         <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                           {Math.random() > 0.5 ? 'Proportionally' : 'Manually'}
                         </span>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
            </div>
            <div className="text-sm text-gray-600">
              Total: {selectedJobs?.jobs.length} jobs
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobTypesReportTab;