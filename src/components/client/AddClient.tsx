import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import InputComponent from "./component/Input";
import { validateClientForm } from "@/utils/validation";




const AddClient = ({ dialogOpen, setDialogOpen, onClientAdd }: IAddClient) => {
    const [formData, setFormData] = useState<ClientData>({
        clientRef: '',
        clientName: '',
        businessType: '',
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
        auditCompliant: false,
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
        setErrors(validationResult.errors);
        return validationResult.isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onClientAdd?.(formData);
            setDialogOpen(false);
            setFormData({
                clientRef: '',
                clientName: '',
                businessType: '',
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
                auditCompliant: false,
            });
            setErrors({});
        }
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setErrors({});
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
                                id="clientName"
                                value={formData.clientName}
                                onChange={handleInputChange('clientName')}
                                placeholder="Enter client name"
                                error={errors.clientName}
                            />
                            <InputComponent
                                label="Business Type"
                                id="businessType"
                                value={formData.businessType}
                                onChange={handleInputChange('businessType')}
                                placeholder="Enter business type"
                                error={errors.businessType}
                            />
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
                                value={formData.auditCompliant}
                                onChange={handleInputChange('auditCompliant')}
                            />
                        </div>
                    </div>


                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogClose(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            Add Client
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddClient;
