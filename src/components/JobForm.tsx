// components/JobForm.tsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useCreateJobMutation, useUpdateJobMutation } from '@/store/jobApi';
import { toast } from 'sonner';
// import { JobFormData, validateJobForm } from '@/utils/jobValidation';
import { JobFormData, validateJobForm } from '@/utils/validation/jobValidations';
import InputComponent from './client/component/Input';
import { Loader2 } from 'lucide-react';

// --- Type Definitions ---
type JobStatus = 'queued' | 'inProgress' | 'withClient' | 'forApproval' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface DropdownOption {
    _id: string;
    name: string;
}

interface JobFormProps {
    job?: any | null;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

// --- Component ---
export const JobForm = ({ job, onSubmit, onCancel }: JobFormProps) => {
    // --- State ---
    const { data: categoriesData, isLoading: isLoadingDropdowns } = useGetDropdownOptionsQuery("all");
    const [createJob, { isLoading: isCreatingJob }] = useCreateJobMutation();
    const [updateJob, { isLoading: isUpdatingJob }] = useUpdateJobMutation();

    const [formData, setFormData] = useState<JobFormData & { teamMembers: string[], status: JobStatus, priority: Priority, description: string }>({
        name: job?.jobName || '',
        clientId: job?.clientId || '',
        clientName: job?.clientName || '',
        jobTypeId: job?.jobTypeId || '',
        startDate: job?.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
        endDate: job?.endDate ? new Date(job.endDate).toISOString().split('T')[0] : '',
        jobCost: job?.estimatedCost,
        status: job?.status || 'queued',
        priority: job?.priority || 'medium',
        jobManagerId: job?.jobManagerId || '',
        teamMembers: job?.team || [],
        description: job?.description || ''
    });

    const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
    const [submitError, setSubmitError] = useState<string>('');
    const [showClientSuggestions, setShowClientSuggestions] = useState(false);
    const clientInputContainerRef = useRef<HTMLDivElement>(null);

    // --- Data Extraction ---
    const { clients, jobTypes, teamMembers } = useMemo(() => {
        const data = categoriesData?.data || {};
        return {
            clients: (data.clients as DropdownOption[]) || [],
            jobTypes: (data.jobs as DropdownOption[]) || [],
            teamMembers: (data.teams as DropdownOption[]) || [],
        };
    }, [categoriesData]);

    const filteredClients = useMemo(() => {
        if (!formData.clientName) return [];
        return clients.filter(client => client.name.toLowerCase().includes(formData.clientName!.toLowerCase()));
    }, [formData.clientName, clients]);

    // --- Handlers ---
    const handleInputChange = (field: keyof typeof formData) => (value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleClientNameChange = (value: string) => {
        setFormData({ ...formData, clientName: value, clientId: '' });
        setShowClientSuggestions(true);
        if (errors.clientName) {
            setErrors(prev => ({ ...prev, clientName: undefined }));
        }
    };

    const handleSuggestionClick = (client: DropdownOption) => {
        setFormData({ ...formData, clientName: client.name, clientId: client._id });
        setShowClientSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError('');
        setErrors({});

        const validationResult = validateJobForm(formData, clients);
        if (!validationResult.isValid) {
            setErrors(validationResult.errors);
            return;
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            clientId: formData.clientId,
            jobTypeId: formData.jobTypeId,
            jobManagerId: formData.jobManagerId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            jobCost: formData.jobCost,
            teamMembers: formData.teamMembers,
            status: formData.status,
            priority: formData.priority,
        };

        try {
            if (job) {
                await updateJob({ jobId: job.id, jobData: payload }).unwrap();
                toast.success("Job updated successfully!");
            } else {
                await createJob(payload).unwrap();
                toast.success("Job created successfully!");
            }
            onSubmit(payload);
            onCancel();
        } catch (error: any) {
            const errorMessage = error?.data?.message || "An unknown error occurred.";
            setSubmitError(errorMessage);
            toast.error(`Failed: ${errorMessage}`);
        }
    };

    // --- Effect to close suggestions ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientInputContainerRef.current && !clientInputContainerRef.current.contains(event.target as Node)) {
                setShowClientSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);

    const isLoading = isLoadingDropdowns || isCreatingJob || isUpdatingJob;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 form-change" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-[20px]">
                <InputComponent label="Job Name" id="jobName" value={formData.name} onChange={handleInputChange('name')} error={errors.name} />

                <div className="relative" ref={clientInputContainerRef}>
                    <InputComponent
                        label="Client Name"
                        id="clientName"
                        value={formData.clientName}
                        onChange={handleClientNameChange}
                        onFocus={() => setShowClientSuggestions(true)}
                        autoComplete="off"
                        error={errors.clientName}
                    />

                    {showClientSuggestions && (
                        <ul className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {filteredClients.length > 0 ? (
                                filteredClients.map((client) => (
                                    <li
                                        key={client._id}
                                        onClick={() => handleSuggestionClick(client)}
                                        className="px-3 py-2 cursor-pointer hover:bg-muted"
                                    >
                                        {client.name}
                                    </li>
                                ))
                            ) : (
                                <li className="px-3 py-2 text-muted-foreground">
                                    Type client name.{" "}
                                    <a
                                        href="/clients"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Add new client
                                    </a>
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <Select value={formData.jobTypeId} onValueChange={handleInputChange('jobTypeId')}>
                        <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                        <SelectContent>{jobTypes.map(type => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.jobTypeId && <p className="text-sm text-red-600 mt-1">{errors.jobTypeId}</p>}
                </div>

                <InputComponent label="Estimated Cost" id="estimatedCost" type="number" value={String(formData.jobCost ?? '')} onChange={(val) => handleInputChange('jobCost')(parseFloat(val as string) || undefined)} error={errors.jobCost} />

                <InputComponent label="Start Date" id="startDate" type="date" value={formData.startDate} onChange={handleInputChange('startDate')} error={errors.startDate} />
                <InputComponent label="End Date" id="endDate" type="date" value={formData.endDate} onChange={handleInputChange('endDate')} error={errors.endDate} />
                <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={handleInputChange('priority')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={handleInputChange('status')}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="queued">Queued</SelectItem>
                            <SelectItem value="inProgress">In Progress</SelectItem>
                            <SelectItem value="withClient">With Client</SelectItem>
                            <SelectItem value="forApproval">For Approval</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="jobManager">Job Manager</Label>
                    <Select value={formData.jobManagerId} onValueChange={handleInputChange('jobManagerId')}>
                        <SelectTrigger><SelectValue placeholder="Select job manager" /></SelectTrigger>
                        <SelectContent>{teamMembers.map(member => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.jobManagerId && <p className="text-sm text-red-600 mt-1">{errors.jobManagerId}</p>}
                </div>

                <div>
                    <Label htmlFor="team">Team Members</Label>
                    <Select onValueChange={value => {
                        if (value && !formData.teamMembers.includes(value)) {
                            handleInputChange('teamMembers')([...formData.teamMembers, value]);
                        }
                    }}>
                        <SelectTrigger><SelectValue placeholder="Add team member" /></SelectTrigger>
                        <SelectContent>{teamMembers.map(member => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {formData.teamMembers.map((memberId) => {
                            const memberName = teamMembers.find(tm => tm._id === memberId)?.name || memberId;
                            return <Badge key={memberId} variant="secondary" className="text-xs">{memberName}<button type="button" onClick={() => handleInputChange('teamMembers')(formData.teamMembers.filter(id => id !== memberId))} className="ml-1 font-bold">×</button></Badge>;
                        })}
                    </div>
                </div>
            </div>

            <InputComponent className='px-[20px]' label="Description" id="description" type="textarea" value={formData.description} onChange={handleInputChange('description')} placeholder="Job description..." />

            {submitError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{submitError}</div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t bg-[#381980] p-[20px]">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-[6px] text-[#017DB9]">Cancel</Button>
                <Button type="submit" disabled={isLoading} className="!bg-[#017DB9] rounded-[6px]">
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : (job ? 'Update Job' : 'Add Job')}
                </Button>
            </div>
        </form>
    );
};
