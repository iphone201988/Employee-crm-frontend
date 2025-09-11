import { useEffect, useState } from 'react';
import CustomTabs from '@/components/Tabs';
import DetailsContent from '@/components/Team/DetailsContent';
import { ServiceRatesContent } from '@/components/Team/ServiceRatesContent';
import ApprovalsContent from '@/components/Team/ApprovalsContent';
import AccessContent from '@/components/Team/AccessContent';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
const tabs = [
    {
        id: 'teamList',
        label: 'Details'
    },
    {
        id: 'rates',
        label: 'Rates'
    },
    {
        id: 'permissions',
        label: 'Approvals'
    },
    {
        id: 'access',
        label: 'Access'
    }
]

const TeamTab = () => {

    const [activeTab, setActiveTab] = useState<string>('teamList');
    const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);

    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);

    return (
        <div className="space-y-6">
            <CustomTabs
                tabs={visibleTabs}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
            {
                activeTab === 'teamList' && (
                    <DetailsContent />
                )
            }

            {
                activeTab === 'rates' && (
                    <ServiceRatesContent />
                )
            }

            {
                activeTab === 'permissions' && (
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