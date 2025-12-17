import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import InputComponent from "./component/Input";
import { validateClientForm, convertEmptyToNA } from "@/utils/validation";
import { useAddClientMutation, useUpdateClientMutation } from "@/store/clientApi";
import { useGetAllCategorieasQuery } from "@/store/categoryApi";
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { DateOrNAInput } from '@/components/DateOrNAInput';
import { normalizeOptionalText, parseDateValue } from '@/utils/clientFieldUtils';

// Helper function to format date as YYYY-MM-DD (date-only, no time)
const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};



const AddClient = ({ dialogOpen, setDialogOpen, onClientAdd, editMode = false, clientToEdit }: IAddClient) => {
    const [addClient, { isLoading: isAdding }] = useAddClientMutation();
    const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
    const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("bussiness");
    const { data: dropdownOptions, isLoading: isLoadingTeamOptions } = useGetDropdownOptionsQuery("all");
    const [submitError, setSubmitError] = useState<string>("");
    
    const isSubmitting = isAdding || isUpdating;

    // Generate year end options (e.g., "31 - Dec")
    const yearEndOptions = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return months.map((month, index) => `${daysInMonth[index]} - ${month}`);
    }, []);

    console.log("categories", categories?.data?.bussiness);

    const teamMembers = useMemo(() => {
        const data = dropdownOptions?.data || {};
        return Array.isArray(data.teams) ? data.teams : [];
    }, [dropdownOptions]);

    const sanitizeContactField = (value?: string) => normalizeOptionalText(value);

    const buildInitialFormData = (): ClientData => {
        if (editMode && clientToEdit) {
            return {
                clientRef: clientToEdit.clientRef || 'N/A',
                name: clientToEdit.name || '',
                businessTypeId: clientToEdit.businessTypeId || '',
                taxNumber: clientToEdit.taxNumber || '',
                croNumber: clientToEdit.croNumber || 'N/A',
                croLink: clientToEdit.croLink || '',
                clientManagerId: (clientToEdit as any).clientManagerId || '',
                address: clientToEdit.address || 'N/A',
                email: sanitizeContactField(clientToEdit.email),
                emailNote: sanitizeContactField(clientToEdit.emailNote),
                phone: sanitizeContactField(clientToEdit.phone),
                phoneNote: sanitizeContactField(clientToEdit.phoneNote),
                onboardedDate: parseDateValue(clientToEdit.onboardedDate) || undefined,
                amlCompliant: clientToEdit.amlCompliant || false,
                audit: clientToEdit.audit || false,
                clientStatus: clientToEdit.clientStatus || 'Current',
                yearEnd: clientToEdit.yearEnd || '',
                arDate: parseDateValue(clientToEdit.arDate) || undefined,
            };
        }
        return {
            clientRef: 'N/A',
            name: '',
            businessTypeId: '',
            taxNumber: '',
            croNumber: 'N/A',
            croLink: '',
            clientManagerId: '',
            address: 'N/A',
            email: '',
            emailNote: '',
            phone: '',
            phoneNote: '',
            onboardedDate: undefined,
            amlCompliant: false,
            audit: false,
            clientStatus: 'Current',
            yearEnd: '',
            arDate: undefined,
        };
    };

    const [formData, setFormData] = useState<ClientData>(buildInitialFormData);

    const [errors, setErrors] = useState<Partial<Record<keyof ClientData, string>>>({});

    // Update form data when clientToEdit changes
    useEffect(() => {
        if (editMode && clientToEdit) {
            setFormData(buildInitialFormData());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editMode, clientToEdit]);

    const handleInputChange = (field: keyof ClientData) => (value: string | boolean | Date | null | undefined) => {
        let nextValue = value;
        if ((field === 'onboardedDate' || field === 'arDate') && !value) {
            nextValue = undefined;
        }
        setFormData(prev => ({ ...prev, [field]: nextValue }));

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const validationResult = validateClientForm(formData);
        console.log("validationResult", validationResult);

        setErrors(validationResult.errors);
        return validationResult.isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");

        if (!validateForm()) {
            return;
        }

        try {
            // Convert empty values to "N/A" before submission
            // Explicitly exclude contactName and only include valid fields
            const { contactName: _ } = formData as any;
            const sanitizedEmail = sanitizeContactField(formData.email);
            const sanitizedEmailNote = sanitizeContactField(formData.emailNote);
            const sanitizedPhone = sanitizeContactField(formData.phone);
            const sanitizedPhoneNote = sanitizeContactField(formData.phoneNote);

            const processedFormData: any = {
                clientRef: convertEmptyToNA(formData.clientRef),
                name: formData.name,
                businessTypeId: formData.businessTypeId,
                taxNumber: (!formData.taxNumber || formData.taxNumber.trim() === '') ? null : formData.taxNumber,
                croNumber: convertEmptyToNA(formData.croNumber),
                croLink: formData.croLink || '',
                clientManagerId: formData.clientManagerId || undefined,
                address: convertEmptyToNA(formData.address),
                email: sanitizedEmail || undefined,
                emailNote: sanitizedEmailNote || undefined,
                phone: sanitizedPhone || undefined,
                phoneNote: sanitizedPhoneNote || undefined,
                onboardedDate: formData.onboardedDate instanceof Date ? formatDateOnly(formData.onboardedDate) : (formData.onboardedDate || null),
                amlCompliant: formData.amlCompliant,
                audit: formData.audit,
                clientStatus: formData.clientStatus || 'Current',
                yearEnd: formData.yearEnd || '',
                arDate: formData.arDate instanceof Date ? formatDateOnly(formData.arDate) : (formData.arDate || null),
            };

            let res;
            if (editMode && clientToEdit?._id) {
                // Update existing client
                res = await updateClient({ 
                    clientId: clientToEdit._id, 
                    ...processedFormData 
                }).unwrap();
                console.log('Client updated successfully:', res);
            } else {
                // Add new client
                res = await addClient(processedFormData).unwrap();
                console.log('Client added successfully:', res);
            }

            // Call the callback if provided
            onClientAdd?.(processedFormData);

            // Reset form and close dialog
            setFormData({
                clientRef: 'N/A',
                name: '',
                businessTypeId: '',
                taxNumber: 'N/A',
                croNumber: 'N/A',
                croLink: '',
                clientManagerId: '',
                address: 'N/A',
                email: '',
                emailNote: '',
                phone: '',
                phoneNote: '',
                onboardedDate: undefined,
                amlCompliant: false,
                audit: false,
                clientStatus: 'Current',
                yearEnd: '',
                arDate: undefined,
            });
            setErrors({});
            setDialogOpen(false);
        } catch (error: any) {
            console.error('Failed to add client:', error);
            setSubmitError(error?.data?.message || 'Failed to add client. Please try again.');
        }
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setErrors({});
            setSubmitError("");
        }
    };

    const formatDateForInput = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    return (
        <Dialog  open={dialogOpen} onOpenChange={handleDialogClose} >
            <DialogContent className="max-w-2xl  h-[80vh] !rounded-none p-0 border-none for-close">
                <button 
                    onClick={() => handleDialogClose(false)}
                    className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"
                >
                    <X size={16}/>
                </button>
                <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
                    <DialogTitle className="text-center text-white py-4">{editMode ? 'Edit Client' : '+ New Client'}</DialogTitle>
                </DialogHeader>

              <div className="overflow-auto h-full">
                  <form onSubmit={handleSubmit} className="space-y-6 form-change ">
                    <div className="space-y-4 px-[20px]">
                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Client Reference"
                                id="clientRef"
                                value={formData.clientRef}
                                onChange={handleInputChange('clientRef')}
                                placeholder="Enter client reference or leave as N/A"
                                error={errors.clientRef}
                            />
                            <InputComponent
                                label="Client Name *"
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange('name')}
                                placeholder="Enter client name"
                                error={errors.name}
                            />
                            {/* <InputComponent
                                label="Business Type"
                                id="businessType"
                                value={formData.businessType}
                                onChange={handleInputChange('businessType')}
                                placeholder="Enter business type"
                                error={errors.businessType}
                            /> */}

                            <div>
                                <Label htmlFor="businessType">Business Type *</Label>
                                <Select
                                    value={formData.businessTypeId}
                                    onValueChange={handleInputChange('businessTypeId')}
                                    disabled={isLoadingCategories}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            isLoadingCategories
                                                ? "Loading business types..."
                                                : "Select business type"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingCategories ? (
                                            <SelectItem value="" disabled>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading...
                                                </div>
                                            </SelectItem>
                                        ) : isError ? (
                                            <SelectItem value="" disabled>
                                                Error loading business types
                                            </SelectItem>
                                        ) : (
                                            categories?.data?.bussiness?.map((business: any) => (
                                                <SelectItem key={business._id} value={business._id}>
                                                    {business.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.businessTypeId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.businessTypeId}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="clientManagerId">Client Manager</Label>
                                <Select
                                    value={formData.clientManagerId || ''}
                                    onValueChange={handleInputChange('clientManagerId')}
                                    disabled={isLoadingTeamOptions}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={
                                            isLoadingTeamOptions
                                                ? "Loading team members..."
                                                : "Select client manager"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isLoadingTeamOptions ? (
                                            <SelectItem value="" disabled>
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Loading...
                                                </div>
                                            </SelectItem>
                                        ) : teamMembers.length === 0 ? (
                                            <SelectItem value="" disabled>
                                                No team members found
                                            </SelectItem>
                                        ) : (
                                            teamMembers.map((member: any) => (
                                                <SelectItem key={member._id} value={member._id}>
                                                    {member.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.clientManagerId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.clientManagerId}</p>
                                )}
                            </div>

                            <InputComponent
                                label="TAX/PPS NO"
                                id="taxNumber"
                                value={formData.taxNumber}
                                onChange={handleInputChange('taxNumber')}
                                placeholder="Enter tax/PPS number"
                                error={errors.taxNumber}
                            />
                            <InputComponent
                                label="CRO NO"
                                id="croNumber"
                                value={formData.croNumber}
                                onChange={handleInputChange('croNumber')}
                                placeholder="Enter CRO number or leave as N/A"
                                error={errors.croNumber}
                            />
                            <InputComponent
                                label="CRO Link"
                                id="croLink"
                                value={formData.croLink || ''}
                                onChange={handleInputChange('croLink')}
                                placeholder="Enter CRO link URL"
                                error={errors.croLink}
                            />
                            <div>
                                <Label htmlFor="clientStatus">Client Status *</Label>
                                <Select
                                    value={formData.clientStatus || 'Current'}
                                    onValueChange={handleInputChange('clientStatus')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select client status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Prospect">Prospect</SelectItem>
                                        <SelectItem value="Current">Current</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.clientStatus && (
                                    <p className="mt-1 text-sm text-red-600">{errors.clientStatus}</p>
                                )}
                            </div>
                            <div>
                            <Label htmlFor="yearEnd">Year End</Label>
                                <Select
                                    value={formData.yearEnd || ''}
                                    onValueChange={handleInputChange('yearEnd')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select year end" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearEndOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.yearEnd && (
                                    <p className="mt-1 text-sm text-red-600">{errors.yearEnd}</p>
                                )}
                            </div>
                            <DateOrNAInput
                                label="Onboarded Date"
                                id="onboardedDate"
                                value={formData.onboardedDate ?? null}
                                onChange={(value) => handleInputChange('onboardedDate')(value)}
                                error={errors.onboardedDate}
                            />
                            <DateOrNAInput
                                label="AR Date"
                                id="arDate"
                                value={formData.arDate ?? null}
                                onChange={(value) => handleInputChange('arDate')(value)}
                                error={errors.arDate}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 px-[20px]">
                        <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                        <InputComponent
                            label="Address"
                            id="address"
                            type="textarea"
                            value={formData.address}
                            onChange={handleInputChange('address')}
                            placeholder="Enter full address or leave as N/A"
                            error={errors.address}
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4 px-[20px]">
                        <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Email"
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange('email')}
                                placeholder="Enter email address or leave as N/A"
                                error={errors.email}
                            />
                            <InputComponent
                                label="Email Note"
                                id="emailNote"
                                value={formData.emailNote}
                                onChange={handleInputChange('emailNote')}
                                placeholder="Additional email notes or leave as N/A"
                            />
                            <InputComponent
                                label="Phone"
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange('phone')}
                                placeholder="Enter phone number or leave as N/A"
                                error={errors.phone}
                            />
                            <InputComponent
                                label="Phone Note"
                                id="phoneNote"
                                value={formData.phoneNote}
                                onChange={handleInputChange('phoneNote')}
                                placeholder="Additional phone notes or leave as N/A"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 px-[20px]">
                        <h3 className="text-lg font-semibold text-gray-800">Compliance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <InputComponent
                                label="AML Compliant"
                                id="amlCompliant"
                                type="checkbox"
                                value={formData.amlCompliant}
                                onChange={handleInputChange('amlCompliant')}
                            />
                            <InputComponent
                                label="In Audit"
                                id="auditCompliant"
                                type="checkbox"
                                value={formData.audit}
                                onChange={handleInputChange('audit')}
                            />
                        </div>
                    </div>

                    {/* Submit Error Display */}
                    {submitError && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        {submitError}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6 border-t p-[20px] bg-[#381980]">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogClose(false)}
                            disabled={isSubmitting}
                            className="rounded-[6px] text-[#017DB9]"
                        >
                            Cancel
                        </Button>
                        <Button
                        className="!bg-[#017DB9] rounded-[6px]"
                            type="submit"
                            disabled={isSubmitting || isLoadingCategories}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {editMode ? 'Updating Client...' : 'Adding Client...'}
                                </>
                            ) : (
                                editMode ? 'Update Client' : 'Add Client'
                            )}
                        </Button>
                    </div>
                </form>
              </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddClient;
