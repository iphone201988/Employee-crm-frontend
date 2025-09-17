import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2 } from 'lucide-react';
import { useGetAllCategorieasQuery } from '@/store/categoryApi';
import { useAddTeamMemberMutation, useUpdateTeamMembersMutation, useUploadImageMutation } from '@/store/teamApi';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMemberData, validateTeamMemberForm } from '@/utils/validation/teamMemberValidation';
import InputComponent from './client/component/Input';
import { TeamMember } from '@/types/APIs/teamApiType'; // Assuming this type is available

interface AddTeamMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberToEdit?: TeamMember | null;
}

const AddTeamMemberDialog = ({ open, onOpenChange, memberToEdit }: AddTeamMemberDialogProps) => {
    const isEditMode = !!memberToEdit;
    
    const getInitialFormData = (): TeamMemberData => ({
        name: '',
        email: '',
        departmentId: '',
        avatarUrl: '',
        hourlyRate: '',
        workSchedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
    });

    const [formData, setFormData] = useState<TeamMemberData>(getInitialFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberData, string>>>({});
    const [submitError, setSubmitError] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categoriesData } = useGetAllCategorieasQuery("department");
    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
    const [addTeamMember, { isLoading: isAddingMember }] = useAddTeamMemberMutation();
    const [updateTeamMember, { isLoading: isUpdatingMember }] = useUpdateTeamMembersMutation();

    const departments = categoriesData?.data?.departments || [];
    const days = [
        { key: 'monday', label: 'Mon' }, { key: 'tuesday', label: 'Tue' }, { key: 'wednesday', label: 'Wed' },
        { key: 'thursday', label: 'Thu' }, { key: 'friday', label: 'Fri' }, { key: 'saturday', label: 'Sat' }, { key: 'sunday', label: 'Sun' },
    ];

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
                departmentId: memberToEdit.department?._id || '',
                avatarUrl: memberToEdit.avatarUrl || '',
                hourlyRate: String(memberToEdit.hourlyRate || ''),
                workSchedule: {
                    monday: memberToEdit.workSchedule.monday ?? 0,
                    tuesday: memberToEdit.workSchedule.tuesday ?? 0,
                    wednesday: memberToEdit.workSchedule.wednesday ?? 0,
                    thursday: memberToEdit.workSchedule.thursday ?? 0,
                    friday: memberToEdit.workSchedule.friday ?? 0,
                    saturday: memberToEdit.workSchedule.saturday ?? 0,
                    sunday: memberToEdit.workSchedule.sunday ?? 0,
                },
            });
            if (memberToEdit.avatarUrl) {
                setImagePreview(import.meta.env.VITE_BACKEND_BASE_URL + memberToEdit.avatarUrl);
            }
        } else {
            resetForm();
        }
    }, [memberToEdit, isEditMode, open]);

    const handleInputChange = (field: keyof TeamMemberData) => (value: string | boolean | Date) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleDailyCapacityChange = (day: keyof TeamMemberData['workSchedule'], value: string) => {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 24) {
            setFormData(prev => ({
                ...prev,
                workSchedule: { ...prev.workSchedule, [day]: numValue }
            }));
        }
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

        const validationResult = validateTeamMemberForm(formData);
        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            return;
        }

        try {
            if (isEditMode && memberToEdit) {
                // Handle Update
                await updateTeamMember({
                    singleTeamMenber: {
                        userId: memberToEdit._id,
                        name: formData.name,
                        departmentId: formData.departmentId,
                        avatarUrl: formData.avatarUrl,
                        workSchedule: formData.workSchedule,
                        hourlyRate: Number(formData.hourlyRate) || 0,
                    },
                }).unwrap();
                toast.success('Team member updated successfully!');
            } else {
                // Handle Add
                await addTeamMember({
                    ...formData,
                    hourlyRate: Number(formData.hourlyRate) || 0,
                }).unwrap();
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
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{isEditMode ? 'Edit' : 'Add'} Team Member</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputComponent
                            label="Team Name"
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
                            // disabled={isEditMode} // Disable email editing
                        />
                        <InputComponent
                            label="Hourly Rate (€)"
                            id="hourlyRate"
                            type="number"
                            value={String(formData.hourlyRate)}
                            onChange={handleInputChange('hourlyRate')}
                            placeholder="e.g., 50"
                            error={errors.hourlyRate}
                        />
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select value={formData.departmentId} onValueChange={(value) => handleInputChange('departmentId')(value)}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept: any) => (
                                        <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.departmentId && <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>}
                        </div>
                    </div>

                    <div>
                        <Label>Profile Image</Label>
                        <div className="mt-2">
                            {imagePreview ? (
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={imagePreview} alt="Image Preview" />
                                        <AvatarFallback>IMG</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        type="button" variant="destructive" size="sm"
                                        onClick={() => {
                                            setImagePreview(null);
                                            handleInputChange('avatarUrl')('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" />Remove
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
                                        <Upload className="h-4 w-4 mr-2" />Upload Image
                                    </Button>
                                </>
                            )}
                            {isUploadingImage && <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>}
                            {errors.avatarUrl && <p className="mt-1 text-sm text-red-600">{errors.avatarUrl}</p>}
                        </div>
                    </div>

                    <div>
                        <Label>Daily Capacity Hours</Label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                            {days.map((day) => (
                                <div key={day.key}>
                                    <Label htmlFor={day.key} className="text-xs">{day.label}</Label>
                                    <Input
                                        id={day.key} type="number" min="0" max="24" step="0.1"
                                        value={formData.workSchedule[day.key as keyof typeof formData.workSchedule]}
                                        onChange={(e) => handleDailyCapacityChange(day.key as keyof typeof formData.workSchedule, e.target.value)}
                                        className="w-full h-8 text-sm" placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {submitError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{submitError}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? 'Saving...' : 'Adding...'}</> : (isEditMode ? 'Save Changes' : 'Add Member')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTeamMemberDialog;
