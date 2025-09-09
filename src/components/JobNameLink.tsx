import React, { useState } from 'react';
import { JobDetailsDialog } from './JobDetailsDialog';

interface JobNameLinkProps {
  jobName: string;
  jobFee: number;
  wipAmount: number;
  hoursLogged: number;
  className?: string;
}

const JobNameLink: React.FC<JobNameLinkProps> = ({ 
  jobName, 
  jobFee, 
  wipAmount, 
  hoursLogged,
  className = ""
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ${className}`}
      >
        {jobName}
      </button>
      
      <JobDetailsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        jobName={jobName}
        jobFee={jobFee}
        wipAmount={wipAmount}
        hoursLogged={hoursLogged}
      />
    </>
  );
};

export default JobNameLink;