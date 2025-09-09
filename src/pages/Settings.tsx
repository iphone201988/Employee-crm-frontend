
import React, { useState, } from 'react';
import SettingsTab from '@/components/SettingsTab';


const Settings = () => {
  const [autoApproveTimesheets, setAutoApproveTimesheets] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto">
            <SettingsTab
              autoApproveTimesheets={autoApproveTimesheets}
              onAutoApproveChange={setAutoApproveTimesheets}
            />
      </div>
    </div>
  );
};

export default Settings;
