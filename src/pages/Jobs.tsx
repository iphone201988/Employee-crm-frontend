
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
const tabs = [
  {
    id: 'services',
    label: 'Services'
  },
  {
    id: 'jobTemplates',
    label: 'Job Templates'
  },
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Jobs</h1>
            <div className="flex -space-x-2 overflow-x-auto pb-2 sm:pb-0">
              {/* Wrap the list of avatars in a single TooltipProvider */}
              <TooltipProvider>
                {currentTabsUsers?.result.length > 0 &&
                  currentTabsUsers?.result.map((user: any, index) => (
                    <Tooltip key={user?.id || index} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Avatar
                          className="border-2 border-background w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full"
                        // The native `title` attribute is no longer needed
                        >
                          <AvatarImage
                            src={
                              import.meta.env.VITE_BACKEND_BASE_URL + user?.avatarUrl
                            }
                            className="rounded-full"
                          />
                          <AvatarFallback className="text-xs rounded-full bg-gray-400">
                            {user?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user?.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className='mt-5'>

        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'jobTemplates' && <JobTemplatesTab />}
        {activeTab === 'jobBuilder' && <JobBuilderTab />}
        {activeTab === 'jobList' && <JobsTab />}
        {activeTab === '' && <div>YOU HAVE NO ACCESS</div>}
      </div>
      {/* </div> */}
    </div>
  );
};

export default Jobs;
