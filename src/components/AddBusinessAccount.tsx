import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from 'lucide-react';
import { useAddCompanyMutation, useAddTeamMemberMutation, useUpdateTeamMembersMutation, useUploadImageMutation } from '@/store/teamApi';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import InputComponent from './client/component/Input';
import { TeamMember } from '@/types/APIs/teamApiType'; // Assuming this type is available

interface SimplifiedTeamMemberData {
    name: string;
    email: string;
    avatarUrl: string;
}

interface AddTeamMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberToEdit?: TeamMember | null;
}

const AddBusinessAccount = ({ open, onOpenChange, memberToEdit }: AddTeamMemberDialogProps) => {
    const isEditMode = !!memberToEdit;
    
    const getInitialFormData = (): SimplifiedTeamMemberData => ({
        name: '',
        email: '',
        avatarUrl: '',
    });

    const [formData, setFormData] = useState<SimplifiedTeamMemberData>(getInitialFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof SimplifiedTeamMemberData, string>>>({});
    const [submitError, setSubmitError] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
    const [addTeamMember, { isLoading: isAddingMember }] = useAddCompanyMutation();
    const [updateTeamMember, { isLoading: isUpdatingMember }] = useUpdateTeamMembersMutation();

    const resetForm = () => {
        setFormData(getInitialFormData());
        setErrors({});
        setSubmitError("");
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleDialogClose = (isOpen: boolean) => {
        if (!isOpen) {
            resetForm();
        }
        onOpenChange(isOpen);
    };

    useEffect(() => {
        if (isEditMode && memberToEdit) {
            setFormData({
                name: memberToEdit.name,
                email: memberToEdit.email,
                avatarUrl: memberToEdit.avatarUrl || '',
            });
            if (memberToEdit.avatarUrl) {
                setImagePreview(import.meta.env.VITE_BACKEND_BASE_URL + memberToEdit.avatarUrl);
            }
        } else {
            resetForm();
        }
    }, [memberToEdit, isEditMode, open]);

    const handleInputChange = (field: keyof SimplifiedTeamMemberData) => (value: string | boolean | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof SimplifiedTeamMemberData, string>> = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));

        try {
            const result = await uploadImage(file).unwrap();
            handleInputChange('avatarUrl')(result.fileUrl);
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Image upload failed.');
            setImagePreview(null);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        setErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            if (isEditMode && memberToEdit) {
                // Handle Update
                await updateTeamMember({
                    singleTeamMenber: {
                        userId: memberToEdit._id,
                        name: formData.name,
                        // avatarUrl: formData.avatarUrl,
                    },
                }).unwrap();
                toast.success('Team member updated successfully!');
            } else {
                // Handle Add
                formData.avatarUrl = undefined;
                await addTeamMember(formData).unwrap();
                toast.success('Team member added successfully!');
            }
            handleDialogClose(false);
        } catch (error: any) {
            const action = isEditMode ? 'update' : 'add';
            const errorMessage = error?.data?.message || `Failed to ${action} team member. Please try again.`;
            setSubmitError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const isLoading = isAddingMember || isUpdatingMember || isUploadingImage;

    return (
        <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Company</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <InputComponent
                            label="Company Name"
                            id="name"
                            value={formData.name}
                            onChange={handleInputChange('name')}
                            placeholder="Enter name"
                            error={errors.name}
                        />
                        
                        <InputComponent
                            label="Email Address"
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            placeholder="Enter email"
                            error={errors.email}
                            disabled={isEditMode}
                        />
                    </div>
                    {submitError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            {submitError}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditMode ? 'Saving...' : 'Adding...'}
                                </>
                            ) : (
                                isEditMode ? 'Save Changes' : 'Add Company'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddBusinessAccount;