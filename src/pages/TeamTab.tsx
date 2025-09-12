import { useEffect, useState } from 'react';
import CustomTabs from '@/components/Tabs';
import DetailsContent from '@/components/Team/DetailsContent';
import { ServiceRatesContent } from '@/components/Team/ServiceRatesContent';
import ApprovalsContent from '@/components/Team/ApprovalsContent';
import AccessContent from '@/components/Team/AccessContent';
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
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

    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab, setCurrentTab]);

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

    return (
        <div className="space-y-6">
            <CustomTabs
                tabs={visibleTabs}
                activeTab={activeTab}
                setActiveTab={handleTabSwitch}
            />
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