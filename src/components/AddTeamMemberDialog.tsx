import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from 'lucide-react';
import { useGetAllCategorieasQuery } from '@/store/categoryApi';
import { useAddTeamMemberMutation, useUploadImageMutation } from '@/store/teamApi';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


const AddTeamMemberDialog = ({ open, onOpenChange }: AddTeamMemberDialogProps) => {


    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
    const [hourlyRate, setHourlyRate] = useState<number | string>('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dailyCapacity, setDailyCapacity] = useState({
        monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);


    const { data: categoriesData } = useGetAllCategorieasQuery("department");
    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
    const [addTeamMember, { isLoading: isAddingMember }] = useAddTeamMemberMutation();


    const departments = categoriesData?.data?.departments || [];
    const days = [
        { key: 'monday', label: 'Mon' }, { key: 'tuesday', label: 'Tue' }, { key: 'wednesday', label: 'Wed' }, 
        { key: 'thursday', label: 'Thu' }, { key: 'friday', label: 'Fri' }, { key: 'saturday', label: 'Sat' }, { key: 'sunday', label: 'Sun' },
    ];


    const resetForm = () => {
        setName('');
        setEmail('');
        setDepartmentId(undefined);
        setHourlyRate('');
        setAvatarUrl('');
        setImagePreview(null);
        setDailyCapacity({ monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 });
    };


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;


        setImagePreview(URL.createObjectURL(file)); 


        try {
            const result = await uploadImage(file).unwrap();
            setAvatarUrl(result.fileUrl); 
            toast.success('Image uploaded successfully!');
        } catch (error) {
            toast.error('Image upload failed.');
            setImagePreview(null); 
        }
    };


    const handleSave = async () => {
        if (!name.trim() || !email.trim() || !departmentId) {
            toast.error('Please fill in all required fields: Name, Email, and Department.');
            return;
        }


        try {
            await addTeamMember({
                name,
                email,
                departmentId,
                avatarUrl,
                hourlyRate: Number(hourlyRate) || 0,
                workSchedule: dailyCapacity,
            }).unwrap();


            toast.success('Team member added successfully!');
            resetForm();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to add team member.');
        }
    };
    
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
                <div className="space-y-6">
                    {/* --- Main Info Grid --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="name">Team Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
                        </div>
                        <div>
                            <Label htmlFor="hourlyRate">Hourly Rate (€)</Label>
                            <Input id="hourlyRate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g., 50" min="0" />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>


                    {/* --- Profile Image Section --- */}
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
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setAvatarUrl('');
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingImage}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Image
                                    </Button>
                                </>
                            )}
                            {isUploadingImage && <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>}
                        </div>
                    </div>


                    {/* --- Daily Capacity Section --- */}
                    <div>
                        <Label>Daily Capacity Hours</Label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                            {days.map((day) => (
                                <div key={day.key}>
                                    <Label htmlFor={day.key} className="text-xs">{day.label}</Label>
                                    <Input
                                        id={day.key} type="number" min="0" max="24"
                                        value={dailyCapacity[day.key as keyof typeof dailyCapacity]}
                                        onChange={(e) => setDailyCapacity(p => ({ ...p, [day.key]: Number(e.target.value) }))}
                                        className="w-full h-8 text-sm" placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* --- Action Buttons --- */}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isAddingMember || isUploadingImage}>
                            {isAddingMember ? 'Adding Member...' : 'Add Member'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


export default AddTeamMemberDialog;
