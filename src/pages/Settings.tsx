
import React, { useState, } from 'react';
import SettingsTab from '@/components/SettingsTab';


const Settings = () => {
  const [autoApproveTimesheets, setAutoApproveTimesheets] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <SettingsTab
              autoApproveTimesheets={autoApproveTimesheets}
              onAutoApproveChange={setAutoApproveTimesheets}
            />
      </div>
    </div>
  );
};

export default Settings;
