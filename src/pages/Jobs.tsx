
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobBuilderTab from '@/components/JobBuilderTab';
import JobTemplatesTab from '@/components/JobTemplatesTab';
import JobsTab from '@/components/JobsTab';
import ServicesTab from '@/components/ServicesTab';
import CustomTabs from '@/components/Tabs';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import Avatars from '@/components/Avatars';
const tabs = [
  {
    id: 'services',
    label: 'Job Types'
  },
  // {
  //   id: 'jobTemplates',
  //   label: 'Job Templates'
  // },
  // {
  //   id: 'jobBuilder',
  //   label: 'Job Builder'
  // },
  {
    id: 'jobList',
    label: 'Job List'
  }
]
const Jobs = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('');
  const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
    getTabAccess(activeTab).unwrap();
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
    <div className="min-h-screen bg-background p-6">
      {/* Main Content */}
      {/* <div className="max-w-[1600px] mx-auto"> */}

      <div className="mb-6">

        <Avatars activeTab={activeTab} title={"Jobs"} />

        {/* Tabs */}
        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className='mt-5'>

        {activeTab === 'services' && <ServicesTab />}
        {/* {activeTab === 'jobTemplates' && <JobTemplatesTab />} */}
        {/* {activeTab === 'jobBuilder' && <JobBuilderTab />} */}
        {activeTab === 'jobList' && <JobsTab />}
        {activeTab === '' && <div>YOU HAVE NO ACCESS</div>}
      </div>
      {/* </div> */}
    </div>
  );
};

export default Jobs;
