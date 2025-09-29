import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import InputComponent from "./component/Input";
import { validateClientForm, convertEmptyToNA } from "@/utils/validation";
import { useAddClientMutation, useUpdateClientMutation } from "@/store/clientApi";
import { useGetAllCategorieasQuery } from "@/store/categoryApi";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { DateOrNAInput } from '@/components/DateOrNAInput';



const AddClient = ({ dialogOpen, setDialogOpen, onClientAdd, editMode = false, clientToEdit }: IAddClient) => {
    const [addClient, { isLoading: isAdding }] = useAddClientMutation();
    const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();
    const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("bussiness");
    const [submitError, setSubmitError] = useState<string>("");
    
    const isSubmitting = isAdding || isUpdating;

    console.log("categories", categories?.data?.bussiness);



    const [formData, setFormData] = useState<ClientData>(() => {
        if (editMode && clientToEdit) {
            return {
                clientRef: clientToEdit.clientRef || 'N/A',
                name: clientToEdit.name || '',
                businessTypeId: clientToEdit.businessTypeId || '',
                taxNumber: clientToEdit.taxNumber || '',
                croNumber: clientToEdit.croNumber || 'N/A',
                address: clientToEdit.address || 'N/A',
                contactName: clientToEdit.contactName || 'N/A',
                email: clientToEdit.email || '',
                emailNote: clientToEdit.emailNote || 'N/A',
                phone: clientToEdit.phone || 'N/A',
                phoneNote: clientToEdit.phoneNote || 'N/A',
                onboardedDate: clientToEdit.onboardedDate ? new Date(clientToEdit.onboardedDate) : new Date(),
                amlCompliant: clientToEdit.amlCompliant || false,
                audit: clientToEdit.audit || false,
            };
        }
        return {
            clientRef: 'N/A',
            name: '',
            businessTypeId: '',
            taxNumber: '',
            croNumber: 'N/A',
            address: 'N/A',
            contactName: 'N/A',
            email: '',
            emailNote: 'N/A',
            phone: 'N/A',
            phoneNote: 'N/A',
            onboardedDate: new Date(),
            amlCompliant: false,
            audit: false,
        };
    });

    const [errors, setErrors] = useState<Partial<Record<keyof ClientData, string>>>({});

    // Update form data when clientToEdit changes
    useEffect(() => {
        if (editMode && clientToEdit) {
            setFormData({
                clientRef: clientToEdit.clientRef || 'N/A',
                name: clientToEdit.name || '',
                businessTypeId: clientToEdit.businessTypeId || '',
                taxNumber: clientToEdit.taxNumber || '',
                croNumber: clientToEdit.croNumber || 'N/A',
                address: clientToEdit.address || 'N/A',
                contactName: clientToEdit.contactName || 'N/A',
                email: clientToEdit.email || '',
                emailNote: clientToEdit.emailNote || 'N/A',
                phone: clientToEdit.phone || 'N/A',
                phoneNote: clientToEdit.phoneNote || 'N/A',
                onboardedDate: clientToEdit.onboardedDate ? new Date(clientToEdit.onboardedDate) : new Date(),
                amlCompliant: clientToEdit.amlCompliant || false,
                audit: clientToEdit.audit || false,
            });
        }
    }, [editMode, clientToEdit]);

    const handleInputChange = (field: keyof ClientData) => (value: string | boolean | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));

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
            const processedFormData = {
                ...formData,
                clientRef: convertEmptyToNA(formData.clientRef),
                croNumber: convertEmptyToNA(formData.croNumber),
                address: convertEmptyToNA(formData.address),
                contactName: convertEmptyToNA(formData.contactName),
                email: convertEmptyToNA(formData.email),
                emailNote: convertEmptyToNA(formData.emailNote),
                phone: convertEmptyToNA(formData.phone),
                phoneNote: convertEmptyToNA(formData.phoneNote),
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
                address: 'N/A',
                contactName: 'N/A',
                email: '',
                emailNote: 'N/A',
                phone: 'N/A',
                phoneNote: 'N/A',
                onboardedDate: new Date(),
                amlCompliant: false,
                audit: false,
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
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editMode ? 'Edit Client' : 'Add Client'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Client Reference (Optional)"
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

                            <InputComponent
                                label="Tax Number *"
                                id="taxNumber"
                                value={formData.taxNumber}
                                onChange={handleInputChange('taxNumber')}
                                placeholder="Enter tax number"
                                error={errors.taxNumber}
                            />
                            <InputComponent
                                label="CRO Number (Optional)"
                                id="croNumber"
                                value={formData.croNumber}
                                onChange={handleInputChange('croNumber')}
                                placeholder="Enter CRO number or leave as N/A"
                                error={errors.croNumber}
                            />

                            <DateOrNAInput
                                label="Onboarded Date (Optional)"
                                id="onboardedDate"
                                value={formData.onboardedDate}
                                onChange={(value) => handleInputChange('onboardedDate')(value)}
                                error={errors.onboardedDate}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                        <InputComponent
                            label="Address (Optional)"
                            id="address"
                            type="textarea"
                            value={formData.address}
                            onChange={handleInputChange('address')}
                            placeholder="Enter full address or leave as N/A"
                            error={errors.address}
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Contact Name (Optional)"
                                id="contactName"
                                value={formData.contactName}
                                onChange={handleInputChange('contactName')}
                                placeholder="Enter contact person name or leave as N/A"
                                error={errors.contactName}
                                className="md:col-span-2"
                            />
                            <InputComponent
                                label="Email"
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange('email')}
                                placeholder="Enter email address"
                                error={errors.email}
                            />
                            <InputComponent
                                label="Email Note (Optional)"
                                id="emailNote"
                                value={formData.emailNote}
                                onChange={handleInputChange('emailNote')}
                                placeholder="Additional email notes or leave as N/A"
                            />
                            <InputComponent
                                label="Phone (Optional)"
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange('phone')}
                                placeholder="Enter phone number or leave as N/A"
                                error={errors.phone}
                            />
                            <InputComponent
                                label="Phone Note (Optional)"
                                id="phoneNote"
                                value={formData.phoneNote}
                                onChange={handleInputChange('phoneNote')}
                                placeholder="Additional phone notes or leave as N/A"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
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
                                label="Audit Compliant"
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

                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogClose(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
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
            </DialogContent>
        </Dialog>
    );
};

export default AddClient;
