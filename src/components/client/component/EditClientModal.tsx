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
  const { data: categoriesData } = useGetDropdownOptionsQuery("bussiness");
  const businessTypes: BusinessType[] = categoriesData?.data?.bussiness || [];

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

    const validationResult = validateClientForm(validationData);
    if (!validationResult.isValid) {
      setErrors(validationResult.errors);
      toast.error("Please correct the errors before saving.");
      return;
    }

    try {
      const payload = {
        clientId: editableData._id,
        ...validationData 
      };

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

                <InputComponent label="Tax Number" id="taxNumber" value={editableData.taxNumber} onChange={handleInputChange('taxNumber')} error={errors.taxNumber} />
                <InputComponent label="CRO Number" id="croNumber" value={editableData.croNumber} onChange={handleInputChange('croNumber')} error={errors.croNumber} />
                <InputComponent label="Onboarded Date" id="onboardedDate" type="date" value={String(editableData.onboardedDate || '').split('T')[0]} onChange={(val) => handleInputChange('onboardedDate')(new Date(val as string))} error={errors.onboardedDate} />
                <InputComponent label="Address" id="address" type="textarea" value={editableData.address} onChange={handleInputChange('address')} error={errors.address} className="md:col-span-2" />
                <InputComponent label="Contact Person" id="contactName" value={editableData.contactName} onChange={handleInputChange('contactName')} error={errors.contactName} />
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
