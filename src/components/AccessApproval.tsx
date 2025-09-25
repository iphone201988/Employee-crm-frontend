import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useGetCompanyByIdQuery,
  useUpdateTeamMembersMutation,
} from '@/store/teamApi'; // Using your existing teamApi
import { toast } from 'sonner';
import { skipToken } from '@reduxjs/toolkit/query/react';

interface AccessApprovalProps {
  companyId: string;
}

const AccessApproval: React.FC<AccessApprovalProps> = ({ companyId }) => {
  // Use the existing query to get company details, which should include access info
  const { data: companyDetailsData, isLoading, isError } = useGetCompanyByIdQuery(
    companyId ? { companyId } : skipToken
  );

  // Use the existing mutation to update the access
  const [updateTeamMembers, { isLoading: isUpdating }] = useUpdateTeamMembersMutation();

  // Assumption: The company object has an 'access' field like { hasAccess: boolean }
  // Adjust this path if your data structure is different.
  const hasAccess = companyDetailsData?.data?.company?.access?.hasAccess || false;

  const handleAccessChange = async (checked: boolean) => {
    if (!companyDetailsData?.data?.company) {
      toast.error('Company data is not available.');
      return;
    }

    try {
      // The payload for the mutation.
      // Make sure your API expects the payload in this format.
      await updateTeamMembers({
        companyId: companyDetailsData.data.company._id,
        // Assuming your mutation can handle an 'accessPayload'
        accessPayload: { hasAccess: checked },
      }).unwrap();
      
      toast.success(`Access has been ${checked ? 'granted' : 'revoked'}.`);
    } catch (error) {
      toast.error('Failed to update access.');
    }
  };

  if (isLoading) {
    return <p>Loading access details...</p>;
  }

  if (isError) {
    return <p className="text-red-500">Could not load access details.</p>;
  }

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <Switch
        id="access-mode"
        checked={hasAccess}
        onCheckedChange={handleAccessChange}
        disabled={isUpdating}
      />
      <Label htmlFor="access-mode" className="font-medium">
        {isUpdating ? 'Updating...' : (hasAccess ? 'Access Granted' : 'Access Revoked')}
      </Label>
    </div>
  );
};

export default AccessApproval;
