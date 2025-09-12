import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import InputComponent from "./component/Input";
import { validateClientForm } from "@/utils/validation";
import { useAddClientMutation } from "@/store/clientApi";
import { useGetAllCategorieasQuery } from "@/store/categoryApi";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";




const AddClient = ({ dialogOpen, setDialogOpen, onClientAdd }: IAddClient) => {
    const [addClient, { isLoading: isSubmitting }] = useAddClientMutation();
    const { data: categories, isLoading: isLoadingCategories, isError } = useGetAllCategorieasQuery("bussiness");
    const [submitError, setSubmitError] = useState<string>("");

    console.log("categories", categories?.data?.bussiness);



    const [formData, setFormData] = useState<ClientData>({
        clientRef: '',
        name: '',
        businessTypeId: '',
        taxNumber: '',
        croNumber: '',
        address: '',
        contactName: '',
        email: '',
        emailNote: '',
        phone: '',
        phoneNote: '',
        onboardedDate: new Date(),
        amlCompliant: false,
        audit: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof ClientData, string>>>({});

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
            const res = await addClient(formData).unwrap();
            console.log('Client added successfully:', res);

            // Call the callback if provided
            onClientAdd?.(formData);

            // Reset form and close dialog
            setFormData({
                clientRef: '',
                name: '',
                businessTypeId: '',
                taxNumber: '',
                croNumber: '',
                address: '',
                contactName: '',
                email: '',
                emailNote: '',
                phone: '',
                phoneNote: '',
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
                    <DialogTitle>Add Client</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Client Reference"
                                id="clientRef"
                                value={formData.clientRef}
                                onChange={handleInputChange('clientRef')}
                                placeholder="Enter client reference"
                                error={errors.clientRef}
                            />
                            <InputComponent
                                label="Client Name"
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
                                <Label htmlFor="businessType">Business Type</Label>
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
                                label="Tax Number"
                                id="taxNumber"
                                value={formData.taxNumber}
                                onChange={handleInputChange('taxNumber')}
                                placeholder="Enter tax number"
                                error={errors.taxNumber}
                            />
                            <InputComponent
                                label="CRO Number"
                                id="croNumber"
                                value={formData.croNumber || ''}
                                onChange={handleInputChange('croNumber')}
                                placeholder="Enter CRO number (optional)"
                                error={errors.croNumber}
                            />
                            <InputComponent
                                label="Onboarded Date"
                                id="onboardedDate"
                                type="date"
                                value={formatDateForInput(formData.onboardedDate)}
                                onChange={(value) => handleInputChange('onboardedDate')(new Date(value as string))}
                                error={errors.onboardedDate}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Address</h3>
                        <InputComponent
                            label="Address"
                            id="address"
                            type="textarea"
                            value={formData.address}
                            onChange={handleInputChange('address')}
                            placeholder="Enter full address"
                            error={errors.address}
                        />
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputComponent
                                label="Contact Name"
                                id="contactName"
                                value={formData.contactName}
                                onChange={handleInputChange('contactName')}
                                placeholder="Enter contact person name"
                                error={errors.contactName}
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
                                label="Email Note"
                                id="emailNote"
                                value={formData.emailNote || ''}
                                onChange={handleInputChange('emailNote')}
                                placeholder="Additional email notes (optional)"
                            />
                            <InputComponent
                                label="Phone"
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange('phone')}
                                placeholder="Enter phone number"
                                error={errors.phone}
                            />
                            <InputComponent
                                label="Phone Note"
                                id="phoneNote"
                                value={formData.phoneNote || ''}
                                onChange={handleInputChange('phoneNote')}
                                placeholder="Additional phone notes (optional)"
                                className="md:col-span-2"
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
                                    Adding Client...
                                </>
                            ) : (
                                "Add Client"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddClient;
