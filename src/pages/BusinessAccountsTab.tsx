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
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';
import BusinessAccountsDetails from '@/components/businessAccounts/businessAccountsDetails';
import BusinessAccountsApproval from '@/components/businessAccounts/BusinessAccountsApproval';
import BusinessAccountAccess from '@/components/businessAccounts/BusinessAccountAccess';
import { useGetCurrentUserQuery } from '@/store/authApi';
const tabs = [
    {
        id: 'teamList',
        label: 'Details'
    },
    // {
    //     id: 'rates',
    //     label: 'Rates'
    // },
    {
        id: 'permissions',
        label: 'Approvals'
    },
    {
        id: 'access',
        label: 'Access'
    }
]


const BusinessAccountsTab = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()
    const {data:currentLogdinUser}:any = useGetCurrentUserQuery()
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
        <div className="space-y-6">
            <div className="mb-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Business Accounts</h1>
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
                                                    <AvatarFallback className="text-xs rounded-full">
                                                        {user?.name}
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
                 <CustomTabs
                tabs={visibleTabs}
                activeTab={activeTab}
                setActiveTab={handleTabSwitch}
            />
            </div>
            {
                activeTab === 'teamList' && currentLogdinUser?.data?.role === 'superAdmin' && (
                    <BusinessAccountsDetails
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'teamList')
                        }
                    />
                )
            }

            {/* {
                activeTab === 'rates' && (
                    <ServiceRatesContent
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'rates')
                        }
                    />
                )
            } */}

            {
                activeTab === 'permissions' && currentLogdinUser?.data?.role === 'superAdmin' && (
                    <BusinessAccountsApproval
                        onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                            setUnsavedChanges(hasChanges, saveFn, discardFn, 'permissions')
                        }
                    />
                )
            }

            {
                activeTab === 'access' && currentLogdinUser?.data?.role === 'superAdmin' && (
                    <BusinessAccountAccess
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

export default BusinessAccountsTab;