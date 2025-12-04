// components/EditClientModal.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Loader2 } from 'lucide-react';
import { useUpdateClientMutation } from "@/store/clientApi";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { toast } from 'sonner';
import InputComponent from './Input';
import { ClientData, validateClientForm } from '@/utils/validation/clientUpdateValidation';

// --- Interface Definitions ---
interface BusinessType {
  _id: string;
  name: string;
}

interface FullClientData extends ClientData {
  _id: string;
  // This allows businessTypeId to be an object, string, null, or undefined initially
  businessTypeId: BusinessType | string | null;
  amlCompliant?: boolean;
  audit?: boolean;
  clientStatus?: string;
  yearEnd?: string;
  arDate?: Date | string;
  croLink?: string;
  clientManagerId?: string;
  clientManager?: { _id: string; name: string } | string | null;
}

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientData: FullClientData;
}

// Helper function to safely extract the business type ID
const getBusinessTypeId = (businessTypeId: FullClientData['businessTypeId']): string => {
    if (businessTypeId && typeof businessTypeId === 'object') {
        // It's a populated object, return its _id
        return businessTypeId._id;
    }
    // It's a string, null, or undefined, so return it as a string or an empty string
    return (businessTypeId as string) || '';
};


const EditClientModal = ({ open, onOpenChange, clientData }: EditClientModalProps) => {
  const [editableData, setEditableData] = useState<FullClientData>(clientData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientData, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
  const { data: categoriesData } = useGetDropdownOptionsQuery("all");
  const businessTypes: BusinessType[] = categoriesData?.data?.bussiness || [];
  const teamMembers: { _id: string; name: string }[] = categoriesData?.data?.teams || [];

  useEffect(() => {
    if (open) {
      setEditableData(clientData);
      setErrors({});
      setSubmitError('');
    }
  }, [clientData, open]);
  
  const handleInputChange = (field: keyof FullClientData) => (value: string | boolean | Date) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    setSubmitError('');
    setErrors({});
    
    // Use the helper to get the ID for validation and payload
    const businessTypeIdString = getBusinessTypeId(editableData.businessTypeId);

    const validationData:any = {
        ...editableData,
        businessTypeId: businessTypeIdString
    };

    validationData._id = undefined
    validationData.status = undefined
    validationData.services = undefined
    validationData.createdAt = undefined
    validationData.updatedAt = undefined
    validationData.clientManager = undefined
    if (!validationData.clientManagerId) {
        validationData.clientManagerId = undefined;
    }

    const validationResult = validateClientForm(validationData);
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      toast.error("Please correct the errors before saving.");
      return;
    }

    try {
      // Format dates properly for API
      const payload: any = {
        clientId: editableData._id,
        ...validationData 
      };
      
      // Handle empty taxNumber - convert to null or empty string (both allowed by backend)
      if (payload.taxNumber !== undefined && (!payload.taxNumber || payload.taxNumber.trim() === '')) {
        payload.taxNumber = null;
      }
      
      // Helper function to format date as YYYY-MM-DD (date-only, no time)
      const formatDateOnly = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Convert Date objects to date-only strings (YYYY-MM-DD) for onboardedDate and arDate
      if (payload.onboardedDate instanceof Date) {
        payload.onboardedDate = formatDateOnly(payload.onboardedDate);
      } else if (payload.onboardedDate && typeof payload.onboardedDate === 'string') {
        // If it's already a date string, extract just the date part (YYYY-MM-DD)
        const dateMatch = payload.onboardedDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          payload.onboardedDate = dateMatch[1];
        } else {
          // Try to parse and reformat
          const date = new Date(payload.onboardedDate);
          if (!isNaN(date.getTime())) {
            payload.onboardedDate = formatDateOnly(date);
          } else {
            payload.onboardedDate = null;
          }
        }
      } else if (!payload.onboardedDate) {
        // If not provided, set to null (allowed by backend)
        payload.onboardedDate = null;
      }
      
      if (payload.arDate instanceof Date) {
        payload.arDate = formatDateOnly(payload.arDate);
      } else if (payload.arDate && typeof payload.arDate === 'string') {
        // If it's already a date string, extract just the date part (YYYY-MM-DD)
        const dateMatch = payload.arDate.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          payload.arDate = dateMatch[1];
        } else {
          // Try to parse and reformat
          const date = new Date(payload.arDate);
          if (!isNaN(date.getTime())) {
            payload.arDate = formatDateOnly(date);
          } else {
            payload.arDate = null;
          }
        }
      } else if (!payload.arDate) {
        // If not provided, set to null (allowed by backend)
        payload.arDate = null;
      }

      await updateClient(payload).unwrap();
      toast.success("Client details updated successfully!");
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Failed to update client. Please try again.";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const currentBusinessTypeId = getBusinessTypeId(editableData.businessTypeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Edit Client: {clientData?.name}</DialogTitle>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                    {isUpdating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-1" /> Save Changes</>}
                </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputComponent label="Client Ref" id="clientRef" value={editableData.clientRef} onChange={handleInputChange('clientRef')} error={errors.clientRef} />
                <InputComponent label="Client Name" id="name" value={editableData.name} onChange={handleInputChange('name')} error={errors.name} />
                
                <div>
                    <Label htmlFor="businessTypeId">Business Type</Label>
                    <Select value={currentBusinessTypeId} onValueChange={handleInputChange('businessTypeId')}>
                        <SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger>
                        <SelectContent>
                            {businessTypes.map((type) => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.businessTypeId && <p className="text-sm text-red-600 mt-1">{errors.businessTypeId}</p>}
                </div>

                <div>
                    <Label htmlFor="clientManagerId">Client Manager</Label>
                    <Select value={editableData.clientManagerId || ''} onValueChange={handleInputChange('clientManagerId')}>
                        <SelectTrigger><SelectValue placeholder="Select client manager" /></SelectTrigger>
                        <SelectContent>
                            {teamMembers.map((member) => (
                                <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.clientManagerId && <p className="text-sm text-red-600 mt-1">{errors.clientManagerId}</p>}
                </div>

                <InputComponent label="TAX/PPS NO (Optional)" id="taxNumber" value={editableData.taxNumber} onChange={handleInputChange('taxNumber')} error={errors.taxNumber} />
                <InputComponent label="CRO NO (Optional)" id="croNumber" value={editableData.croNumber} onChange={handleInputChange('croNumber')} error={errors.croNumber} />
                <InputComponent label="CRO Link" id="croLink" value={editableData.croLink || ''} onChange={handleInputChange('croLink')} error={errors.croLink} />
                <div>
                    <Label htmlFor="clientStatus">Client Status</Label>
                    <Select value={editableData.clientStatus || 'Current'} onValueChange={handleInputChange('clientStatus')}>
                        <SelectTrigger><SelectValue placeholder="Select client status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Prospect">Prospect</SelectItem>
                            <SelectItem value="Current">Current</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.clientStatus && <p className="text-sm text-red-600 mt-1">{errors.clientStatus}</p>}
                </div>
                <div>
                    <Label htmlFor="yearEnd">Year End</Label>
                    <Select value={editableData.yearEnd || ''} onValueChange={handleInputChange('yearEnd')}>
                        <SelectTrigger><SelectValue placeholder="Select year end" /></SelectTrigger>
                        <SelectContent>
                            {['31 - Jan', '28 - Feb', '31 - Mar', '30 - Apr', '31 - May', '30 - Jun', '31 - Jul', '31 - Aug', '30 - Sep', '31 - Oct', '30 - Nov', '31 - Dec'].map((option) => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.yearEnd && <p className="text-sm text-red-600 mt-1">{errors.yearEnd}</p>}
                </div>
                <InputComponent label="Onboarded Date" id="onboardedDate" type="date" value={String(editableData.onboardedDate || '').split('T')[0]} onChange={(val) => handleInputChange('onboardedDate')(new Date(val as string))} error={errors.onboardedDate} />
                <InputComponent label="AR Date" id="arDate" type="date" value={editableData.arDate ? String(editableData.arDate).split('T')[0] : ''} onChange={(val) => handleInputChange('arDate')(val ? new Date(val as string) : undefined)} error={errors.arDate} />
                <InputComponent label="Address" id="address" type="textarea" value={editableData.address} onChange={handleInputChange('address')} error={errors.address} className="md:col-span-2" />
                <InputComponent label="Email" id="email" type="email" value={editableData.email} onChange={handleInputChange('email')} error={errors.email} />
                <InputComponent label="Phone" id="phone" type="tel" value={editableData.phone} onChange={handleInputChange('phone')} error={errors.phone} />
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4 text-sm text-red-700">{submitError}</div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;
