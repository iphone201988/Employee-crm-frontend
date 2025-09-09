
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobBuilderTab from '@/components/JobBuilderTab';
import JobTemplatesTab from '@/components/JobTemplatesTab';
import JobsTab from '@/components/JobsTab';
import ServicesTab from '@/components/ServicesTab';
import CustomTabs from '@/components/Tabs';


const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('jobs');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [writeOffEntries, setWriteOffEntries] = useState<any[]>([]);
  const [autoApproveTimesheets, setAutoApproveTimesheets] = useState(false);

  const handleInvoiceCreate = (invoice: any) => {
    setInvoices(prev => [...prev, invoice]);
    setActiveTab('invoices');
  };

  const handleWriteOff = (writeOffEntry: any) => {
    setWriteOffEntries(prev => [...prev, writeOffEntry]);
    setActiveTab('write-off-report');
  };

  const tabs=[
    {
      id: 'services',
      label: 'Services'
    },
    {
      id: 'job-templates',
      label: 'Job Templates'
    },
    {
      id: 'job-builder',
      label: 'Job Builder'
    },
    {
      id: 'jobs',
      label: 'Job List'
    }
  ]
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto">

        <CustomTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab==='services' && <ServicesTab />}
        {activeTab==='job-templates' && <JobTemplatesTab />}
        {activeTab==='job-builder' && <JobBuilderTab />}
        {activeTab==='jobs' && <JobsTab />}
      </div>
    </div>
  );
};

export default Jobs;
