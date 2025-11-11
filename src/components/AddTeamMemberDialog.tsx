import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Loader2 } from 'lucide-react';
import { useGetAllCategorieasQuery } from '@/store/categoryApi';
import { useAddTeamMemberMutation, useUpdateTeamMembersMutation, useUploadImageMutation, useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useGetCurrentUserQuery } from '@/store/authApi';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMemberData as OriginalTeamMemberData, validateTeamMemberForm } from '@/utils/validation/teamMemberValidation';
import InputComponent from './client/component/Input';
import { TeamMember } from '@/types/APIs/teamApiType';

// --- Reusable Time Conversion Utilities ---
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  const [hours = 0, minutes = 0, seconds = 0] = parts;
  return (hours * 3600) + (minutes * 60) + seconds;
};

const secondsToTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// Extend the type to include the optional companyId and string-based workSchedule
interface TeamMemberData extends Omit<OriginalTeamMemberData, 'workSchedule'> {
    companyId?: string;
    workSchedule: { [key in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']: string };
}

interface AddTeamMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberToEdit?: TeamMember | null;
}

const AddTeamMemberDialog = ({ open, onOpenChange, memberToEdit }: AddTeamMemberDialogProps) => {
    const isEditMode = !!memberToEdit;
    const { data: currentUser } = useGetCurrentUserQuery<any>();
    
    // MODIFIED: Initial form data now uses time strings for workSchedule
    const getInitialFormData = (): TeamMemberData => ({
        name: '',
        email: '',
        departmentId: '',
        avatarUrl: '',
        hourlyRate: '',
        companyId: '',
        workSchedule: {
            monday: '00:00:00',
            tuesday: '00:00:00',
            wednesday: '00:00:00',
            thursday: '00:00:00',
            friday: '00:00:00',
            saturday: '00:00:00',
            sunday: '00:00:00',
        },
    });

    const [formData, setFormData] = useState<TeamMemberData>(getInitialFormData());
    const [errors, setErrors] = useState<Partial<Record<keyof TeamMemberData, string>>>({});
    const [submitError, setSubmitError] = useState<string>("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categoriesData } = useGetAllCategorieasQuery("department");
    const { data: companiesData } = useGetDropdownOptionsQuery('company', {
        skip: currentUser?.data?.role !== 'superAdmin',
    });
    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
    const [addTeamMember, { isLoading: isAddingMember }] = useAddTeamMemberMutation();
    const [updateTeamMember, { isLoading: isUpdatingMember }] = useUpdateTeamMembersMutation();

    const departments = categoriesData?.data?.departments || [];
    const companies = companiesData?.data?.companies || [];
    const days = [
        { key: 'monday', label: 'Mon' }, { key: 'tuesday', label: 'Tue' }, { key: 'wednesday', label: 'Wed' },
        { key: 'thursday', label: 'Thu' }, { key: 'friday', label: 'Fri' }, { key: 'saturday', label: 'Sat' }, { key: 'sunday', label: 'Sun' },
    ] as const;

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
            // MODIFIED: Convert seconds to time strings when populating the form
            const scheduleInTimeFormat = Object.fromEntries(
                days.map(day => [
                    day.key,
                    secondsToTime(memberToEdit.workSchedule?.[day.key] ?? 0)
                ])
            ) as TeamMemberData['workSchedule'];

            setFormData({
                name: memberToEdit.name,
                email: memberToEdit.email,
                departmentId: memberToEdit.department?._id || '',
                avatarUrl: memberToEdit.avatarUrl || '',
                hourlyRate: String(memberToEdit.hourlyRate || ''),
                companyId: memberToEdit?.companyId || '',
                workSchedule: scheduleInTimeFormat,
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

    // MODIFIED: Handle daily capacity as a string
    const handleDailyCapacityChange = (day: keyof TeamMemberData['workSchedule'], value: string) => {
        setFormData(prev => ({
            ...prev,
            workSchedule: { ...prev.workSchedule, [day]: value }
        }));
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImagePreview(URL.createObjectURL(file));

        try {
            const result = await uploadImage(file).unwrap();
            setFormData(prev => ({ ...prev, avatarUrl: result.fileUrl }));
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Image upload failed.');
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError("");
        
        // Assuming validation is adapted for string-based schedule
        const validationResult = validateTeamMemberForm(formData as any); 
        const currentErrors:any = { ...validationResult.errors };

        if (currentUser?.data?.role === 'superAdmin' && !formData.companyId) {
            currentErrors.companyId = 'Company is required.';
        }

        if (Object.keys(currentErrors).length > 0) {
            setErrors(currentErrors);
            return;
        }
        setErrors({});

        try {
            // MODIFIED: Convert workSchedule from time strings to seconds before API call
            const scheduleInSeconds = Object.fromEntries(
                Object.entries(formData.workSchedule).map(([day, timeStr]) => [
                    day,
                    timeToSeconds(timeStr)
                ])
            );

            const payload: any = {
                name: formData.name,
                email: formData.email,
                departmentId: formData.departmentId,
                avatarUrl: formData.avatarUrl,
                workSchedule: scheduleInSeconds,
                hourlyRate: Number(formData.hourlyRate) || 0,
                ...(currentUser?.data?.role === 'superAdmin' && { companyId: formData.companyId }),
            };

            if (isEditMode && memberToEdit) {
                delete payload.email;
                delete payload.companyId;
                await updateTeamMember({
                    singleTeamMenber: {
                        userId: memberToEdit._id,
                        ...payload
                    },
                }).unwrap();
                toast.success('Team member updated successfully!');
            } else {
                await addTeamMember(payload).unwrap();
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
            <DialogContent className="max-w-2xl !rounded-none p-0 border-none for-close">
                <DialogHeader className="bg-[#381980] sticky z-50 top-0 left-0 w-full text-center ">
                    <DialogTitle className="text-center text-white py-4">{isEditMode ? 'Edit' : 'Add'} Team Member</DialogTitle>
                    </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 form-change">
                    {/* ... other form fields remain the same ... */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-[20px]">
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
                            disabled={isEditMode}
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
                            <Select value={formData.departmentId} onValueChange={(value) => handleInputChange('departmentId')(value)}  >
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept: any) => (
                                        <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.departmentId && <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>}
                        </div>
                        
                        {currentUser?.data?.role === 'superAdmin' && (
                            <div>
                                <Label htmlFor="company">For (Company)</Label>
                                <Select value={formData.companyId} onValueChange={(value) => handleInputChange('companyId')(value)} disabled={isEditMode}>
                                    <SelectTrigger id="company">
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map((company: any) => (
                                            <SelectItem key={company._id} value={company._id}>{company.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>}
                            </div>
                        )}
                    </div>
                    <div className='px-[20px]'>
                        <Label >Profile Image</Label>
                        <div className="mt-2 rounded-[6px]">
                            {imagePreview ? (
                                <div className="flex items-center gap-4 rounded-[6px]">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={imagePreview} alt="Image Preview" />
                                        <AvatarFallback>IMG</AvatarFallback>
                                    </Avatar>
                                    <Button
                                     className=' rounded-[6px]'
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

                    {/* MODIFIED: Daily capacity inputs now use text and time format */}
                    <div className='px-[20px]'>
                        <Label>Daily Capacity</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
                            {days.map((day) => (
                                <div key={day.key}>
                                    <Label htmlFor={day.key} className="text-xs font-medium">{day.label}</Label>
                                    <Input
                                        id={day.key}
                                        type="text"
                                        value={formData.workSchedule[day.key]}
                                        onChange={(e) => handleDailyCapacityChange(day.key, e.target.value)}
                                        className="w-full h-8 text-sm text-center"
                                        placeholder="HH:mm:ss"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {submitError && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{submitError}</div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t  p-[20px] bg-[#381980]">
                        <Button type="button"  className="rounded-[6px] text-[#017DB9]" variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}  className="!bg-[#017DB9] rounded-[6px]">
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? 'Saving...' : 'Adding...'}</> : (isEditMode ? 'Save Changes' : 'Add Member')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddTeamMemberDialog;

