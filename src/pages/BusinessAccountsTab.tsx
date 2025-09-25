import { useEffect, useState } from 'react';
import { useLazyGetTabAccessQuery, useGetCurrentUserQuery } from '@/store/authApi';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

import CustomTabs from '@/components/Tabs';
import BusinessAccountsDetails from '@/components/businessAccounts/BusinessAccountsDetails';
import BusinessAccountsApproval from '@/components/businessAccounts/BusinessAccountsApproval';
import BusinessAccountAccess from '@/components/businessAccounts/BusinessAccountAccess';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@radix-ui/react-tooltip';

const tabs = [
    { id: 'teamList', label: 'Details' },
    // { id: 'rates', label: 'Rates' },
    // { id: 'permissions', label: 'Approvals' },
    // { id: 'access', label: 'Access' }
];

const BusinessAccountsTab = () => {
    const { data: currentLogdinUser }: any = useGetCurrentUserQuery();
    const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);

    // Determines the initial active tab
    const getInitialTab = () => {
        if (visibleTabs.some(tab => tab.id === 'teamList')) {
            return 'teamList';
        }
        return visibleTabs.length > 0 ? visibleTabs[0].id : '';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);
    const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery();

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

    // Effect to set a default tab if the current activeTab is no longer visible
    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(getInitialTab());
        }
    }, [visibleTabs, activeTab]);

    // Effect to fetch data and update the unsaved changes hook when the tab changes
    useEffect(() => {
        if (activeTab) {
            getTabAccess(activeTab).unwrap();
            setCurrentTab(activeTab);
        }
    }, [activeTab, getTabAccess, setCurrentTab]);

    const handleTabSwitch = (newTabId: string) => {
        const canSwitch = handleTabChange(newTabId);
        if (canSwitch) {
            setActiveTab(newTabId);
        }
    };

    const handleModalSave = async () => {
        try {
            const canSwitch = await handleSaveAndContinue();
            if (canSwitch && pendingTabId) {
                setActiveTab(pendingTabId);
            }
        } catch (error) {
            console.error('Error in handleModalSave:', error);
        }
    };

    const handleModalDiscard = () => {
        const canSwitch = handleDiscardAndContinue();
        if (canSwitch && pendingTabId) {
            setActiveTab(pendingTabId);
        }
    };

    if (isLoading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    if (isError || activeTab === '') {
        return <div>YOU HAVE NO ACCESS</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="mb-6">
                {/* Your header content can go here */}
                {/* <div className="flex ..."> ... </div> */}

                {/* The CustomTabs component now uses the internal state */}
                <CustomTabs
                    tabs={visibleTabs}
                    activeTab={activeTab}
                    setActiveTab={handleTabSwitch}
                />
            </div>

            {activeTab === 'teamList' && currentLogdinUser?.data?.role === 'superAdmin' && (
                <BusinessAccountsDetails
                    onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                        setUnsavedChanges(hasChanges, saveFn, discardFn, 'teamList')
                    }
                />
            )}

            {/* {activeTab === 'permissions' && currentLogdinUser?.data?.role === 'superAdmin' && (
                <BusinessAccountsApproval
                    onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                        setUnsavedChanges(hasChanges, saveFn, discardFn, 'permissions')
                    }
                />
            )}

            {activeTab === 'access' && currentLogdinUser?.data?.role === 'superAdmin' && (
                <BusinessAccountAccess
                    onUnsavedChangesChange={(hasChanges, saveFn, discardFn) =>
                        setUnsavedChanges(hasChanges, saveFn, discardFn, 'access')
                    }
                />
            )} */}

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
