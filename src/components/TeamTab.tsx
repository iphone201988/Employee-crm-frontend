import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit3, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES, DEFAULT_SERVICE_RATES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from './AddTeamMemberDialog';
import CustomTabs from './Tabs';
import DetailsContent from './Team/DetailsContent';
import { ServiceRatesContent } from './Team/ServiceRatesContent';
import ApprovalsContent from './Team/ApprovalsContent';
import AccessContent from './Team/AccessContent';
import { useGetAllTeamMembersQuery } from '@/store/teamApi';

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

// Main services for the billable rates table (matching reference image)
const mainServices = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'audit', label: 'Audit' },
  { key: 'bookkeeping', label: 'Bookkeeping' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'vat', label: 'VAT' },
  { key: 'companySecretary', label: 'Company Secretarial' },
  { key: 'cgt', label: 'CGT' },
];

const services = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'audit', label: 'Audit' },
  { key: 'bookkeeping', label: 'Bookkeeping' },
  { key: 'companySecretary', label: 'Company Secretary' },
  { key: 'corporationTax', label: 'Corporation Tax' },
  { key: 'managementAccounts', label: 'Management Accounts' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'personalTax', label: 'Personal Tax' },
  { key: 'vat', label: 'VAT' },
  { key: 'cgt', label: 'CGT' },
];

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