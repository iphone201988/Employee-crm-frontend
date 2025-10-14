
import React, { useState, useEffect } from 'react';
import SettingsTab from '@/components/SettingsTab';
import { useGetCurrentUserQuery } from '@/store/authApi';


const Settings = () => {
  const [autoApproveTimesheets, setAutoApproveTimesheets] = useState(false);
  const [wipWarningPercentage, setWipWarningPercentage] = useState(80);
  
  // Fetch current user data to get settings
  const { data: currentUserData, refetch: refetchUserData } = useGetCurrentUserQuery<any>();

  // Update local state when user data is fetched
  useEffect(() => {
    if (currentUserData?.data?.settings && currentUserData.data.settings.length > 0) {
      const settings = currentUserData.data.settings[0];
      setAutoApproveTimesheets(settings.autoApproveTimesheets || false);
      setWipWarningPercentage(settings.wipWarningPercentage || 80);
    }
  }, [currentUserData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto">
            <SettingsTab
              autoApproveTimesheets={autoApproveTimesheets}
              onAutoApproveChange={setAutoApproveTimesheets}
              wipWarningPercentage={wipWarningPercentage}
              onWipWarningPercentageChange={setWipWarningPercentage}
              onSettingsUpdate={refetchUserData}
            />
      </div>
    </div>
  );
};

export default Settings;
