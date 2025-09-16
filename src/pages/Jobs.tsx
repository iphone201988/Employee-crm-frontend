
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobBuilderTab from '@/components/JobBuilderTab';
import JobTemplatesTab from '@/components/JobTemplatesTab';
import JobsTab from '@/components/JobsTab';
import ServicesTab from '@/components/ServicesTab';
import CustomTabs from '@/components/Tabs';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
const tabs = [
  {
    id: 'services',
    label: 'Services'
  },
  // {
  //   id: 'jobTemplates',
  //   label: 'Job Templates'
  // },
  {
    id: 'jobBuilder',
    label: 'Job Builder'
  },
  {
    id: 'jobList',
    label: 'Job List'
  }
]
const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('');
  const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

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


  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto">

        <CustomTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === 'services' && <ServicesTab />}
        {/* {activeTab === 'jobTemplates' && <JobTemplatesTab />} */}
        {activeTab === 'jobBuilder' && <JobBuilderTab />}
        {activeTab === 'jobList' && <JobsTab />}
      </div>
    </div>
  );
};

export default Jobs;
