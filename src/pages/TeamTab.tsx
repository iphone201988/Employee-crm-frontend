import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import CustomTabs from '@/components/Tabs';
import DetailsContent from '@/components/Team/DetailsContent';
import { ServiceRatesContent } from '@/components/Team/ServiceRatesContent';
import ApprovalsContent from '@/components/Team/ApprovalsContent';
import AccessContent from '@/components/Team/AccessContent';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useLazyGetTabAccessQuery } from '@/store/authApi';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import Avatars from '@/components/Avatars';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
    const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);
    const {
        hasUnsavedChanges,
        pendingTabId,
        isModalOpen,
        isSaving,
        setUnsavedChanges,
        setCurrentTab,
        handleTabChange,
        handleSaveAndContinue,
        handleDiscardAndContinue,
        handleCancelTabChange,
    } = useUnsavedChanges();

    const getActiveTab = () => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && visibleTabs.some(tab => tab.id === tabFromUrl)) {
            return tabFromUrl;
        }
        if (visibleTabs.some(tab => tab.id === 'teamList')) {
            return 'teamList';
        }
        return visibleTabs.length > 0 ? visibleTabs[0].id : '';
    };

    const activeTab = getActiveTab();

    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
            const defaultTab = visibleTabs.some(tab => tab.id === 'teamList') ? 'teamList' : visibleTabs[0].id;
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', defaultTab);
            setSearchParams(newParams);
        }
        getTabAccess(activeTab).unwrap();
    }, [visibleTabs, activeTab, searchParams, setSearchParams]);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab, setCurrentTab]);

    useEffect(() => {
        if (visibleTabs.length > 0 && !searchParams.get('tab')) {
            const defaultTab = visibleTabs.some(tab => tab.id === 'teamList') ? 'teamList' : visibleTabs[0].id;
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', defaultTab);
            setSearchParams(newParams);
        }
    }, [visibleTabs, searchParams, setSearchParams]);

    const handleTabSwitch = (newTabId: string) => {
        const canSwitch = handleTabChange(newTabId);
        if (canSwitch) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', newTabId);
            setSearchParams(newParams);
        }
    };

    const handleModalSave = async () => {
        try {
            const canSwitch = await handleSaveAndContinue();
            if (canSwitch && pendingTabId) {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('tab', pendingTabId);
                setSearchParams(newParams);
            }
        } catch (error) {
            console.error('Error in handleModalSave:', error);
        }
    };

    const handleModalDiscard = () => {
        const canSwitch = handleDiscardAndContinue();
        if (canSwitch && pendingTabId) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', pendingTabId);
            setSearchParams(newParams);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="mb-6">

            <Avatars activeTab={activeTab} title={"Teams"} />

                {/* Tabs */}
                <CustomTabs
                    tabs={visibleTabs}
                    activeTab={activeTab}
                    setActiveTab={handleTabSwitch}
                />
            </div>
            {
                activeTab === 'teamList' && (
                    <DetailsContent
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'teamList')
                        }
                    />
                )
            }

            {
                activeTab === 'rates' && (
                    <ServiceRatesContent
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'rates')
                        }
                    />
                )
            }

            {
                activeTab === 'permissions' && (
                    <ApprovalsContent
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'permissions')
                        }
                    />
                )
            }

            {
                activeTab === 'access' && (
                    <AccessContent
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'access')
                        }
                    />
                )
            }
            {
                activeTab === '' && (
                    <div>YOU HAVE NO ACCESS</div>
                )
            }

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={handleCancelTabChange}
                onConfirm={handleModalSave}
                onCancel={handleModalDiscard}
                title="Unsaved Changes"
                description="You have unsaved changes. What would you like to do?"
                confirmText="Save Changes"
                cancelText="Discard Changes"
                isLoading={isSaving}
            />
        </div>
    );
};

export default TeamTab;