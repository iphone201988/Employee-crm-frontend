import  { useState } from 'react';
import CustomTabs from '@/components/Tabs';
import DetailsContent from '@/components/Team/DetailsContent';
import { ServiceRatesContent } from '@/components/Team/ServiceRatesContent';
import ApprovalsContent from '@/components/Team/ApprovalsContent';
import AccessContent from '@/components/Team/AccessContent';

interface TeamMember {
  id: string;
  name: string;
  defaultRate: number;
  isDefaultRateLocked: boolean;
  rates: {
    accounts: number | string;
    audit: number | string;
    bookkeeping: number | string;
    companySecretary: number | string;
    corporationTax: number | string;
    managementAccounts: number | string;
    payroll: number | string;
    personalTax: number | string;
    vat: number | string;
    cgt: number | string;
  };
}

const TeamTab = () => {
  
  const [activeTab, setActiveTab] = useState<string>('details');
  

  const tabs = [
    {
      id: 'details',
      label: 'Details'
    },
    {
      id: 'rates',
      label: 'Rates'
    },
    {
      id: 'approvals',
      label: 'Approvals'
    },
    {
      id: 'access',
      label: 'Access'
    }
  ]

  return (
    <div className="space-y-6">
      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
        {
          activeTab === 'details' && (
            <DetailsContent />
          )
        }

        {
          activeTab === 'rates' && (
            <ServiceRatesContent/>
          )
        }

        {
          activeTab === 'approvals' && (
            <ApprovalsContent />
          )
        }

        {
          activeTab === 'access' && (
            <AccessContent />
          )
        }

    </div>
  );
};

export default TeamTab;