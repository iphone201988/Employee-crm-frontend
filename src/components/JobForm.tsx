import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGetDropdownOptionsQuery } from '@/store/teamApi';
import { useCreateJobMutation, useUpdateJobMutation } from '@/store/jobApi';
import { toast } from 'sonner';

// --- Type Definitions ---
type JobStatus = 'queued' | 'inProgress' | 'withClient' | 'forApproval' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface DropdownOption {
    _id: string;
    name: string;
}

interface Job {
    id: string;
    jobName: string;
    clientName: string;
    clientId: string;
    jobType: string;
    jobTypeId: string;
    startDate: string;
    endDate: string;
    estimatedCost: number;
    actualCost: number;
    status: JobStatus;
    priority: Priority;
    jobManager: string;
    jobManagerId: string;
    team: string[];
    description: string;
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
    const [updateJob, { isLoading: isUpdating }] = useUpdateJobMutation(job?.id);

    const [formData, setFormData] = useState({
        name: job?.jobName || '',
        clientId: job?.clientId || '',
        clientName: job?.clientName || '',
        jobTypeId: job?.jobTypeId || '',
        startDate: job?.startDate || '',
        endDate: job?.endDate || '',
        jobCost: job?.estimatedCost,
        status: job?.status || 'queued',
        priority: job?.priority || 'medium',
        jobManagerId: job?.jobManagerId || '',
        teamMembers: job?.team || [],
        description: job?.description || ''
    });

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

    // --- Validation Function ---
    const validateForm = () => {
        const fields: { key: keyof typeof formData, name: string }[] = [
            { key: 'name', name: 'Job Name' },
            { key: 'clientName', name: 'Client Name' },
            { key: 'jobTypeId', name: 'Job Type' },
            { key: 'jobManagerId', name: 'Job Manager' },
            { key: 'startDate', name: 'Start Date' },
            { key: 'endDate', name: 'End Date' },
        ];

        for (const field of fields) {
            if (!formData[field.key]) {
                toast.error(`${field.name} is required.`);
                return false;
            }
        }

        if (formData.jobCost === undefined || formData.jobCost < 0) {
            toast.error('Estimated Cost is required and must be a positive number.');
            return false;
        }

        // Special validation to ensure the clientName entered matches a client from the list
        const isValidClient = clients.some(client => client.name.toLowerCase() === formData.clientName.toLowerCase());
        if (!isValidClient) {
            toast.error("Please select a valid client from the suggestions list.");
            return false;
        }

        return true;
    };

    // --- Handlers ---
    const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, clientName: e.target.value, clientId: '' });
        setShowClientSuggestions(true);
    };

    const handleSuggestionClick = (client: DropdownOption) => {
        setFormData({ ...formData, clientName: client.name, clientId: client._id });
        setShowClientSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Run validation before proceeding
        if (!validateForm()) {
            return;
        }

        const payload: any = {
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
                onSubmit(payload);
                onCancel();
            } else {
                await createJob(payload).unwrap();
                toast.success("Job created successfully!");
                onSubmit(payload);
                onCancel();
            }

        } catch (error) {
            console.error("Failed to create job:", error);
            const errorMessage = (error as any)?.data?.message || "An unknown error occurred.";
            toast.error(`Failed to create job: ${errorMessage}`);
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

    const isLoading = isLoadingDropdowns || isCreatingJob;

    return (
        // Add noValidate to disable default browser validation popups
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
                {/* Job Name */}
                <div>
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input id="jobName" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                {/* Client Name with Suggestions */}
                <div className="relative" ref={clientInputContainerRef}>
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" value={formData.clientName} onChange={handleClientNameChange} onFocus={() => setShowClientSuggestions(true)} autoComplete="off" />
                    {showClientSuggestions && filteredClients.length > 0 && (
                        <ul className="absolute z-10 w-full bg-background border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
                            {filteredClients.map(client => (
                                <li key={client._id} onClick={() => handleSuggestionClick(client)} className="px-3 py-2 cursor-pointer hover:bg-muted">{client.name}</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Job Type */}
                <div>
                    <Label htmlFor="jobType">Job Type</Label>
                    <Select value={formData.jobTypeId} onValueChange={value => setFormData({ ...formData, jobTypeId: value })}>
                        <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                        <SelectContent>{jobTypes.map(type => <SelectItem key={type._id} value={type._id}>{type.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                {/* Job Manager */}
                <div>
                    <Label htmlFor="jobManager">Job Manager</Label>
                    <Select value={formData.jobManagerId} onValueChange={value => setFormData({ ...formData, jobManagerId: value })}>
                        <SelectTrigger><SelectValue placeholder="Select job manager" /></SelectTrigger>
                        <SelectContent>{teamMembers.map(member => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                {/* Dates & Cost */}
                <div><Label htmlFor="startDate">Start Date</Label><Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
                <div><Label htmlFor="endDate">End Date</Label><Input id="endDate" type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
                <div><Label htmlFor="estimatedCost">Estimated Cost</Label><Input id="estimatedCost" type="number" value={formData.jobCost} onChange={e => setFormData({ ...formData, jobCost: parseFloat(e.target.value) || undefined })} min={0} /></div>

                {/* Status & Priority */}
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: JobStatus) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: Priority) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Team Members */}
                <div>
                    <Label htmlFor="team">Team Members</Label>
                    <Select onValueChange={value => {
                        if (value && !formData.teamMembers.includes(value)) {
                            setFormData({ ...formData, teamMembers: [...formData.teamMembers, value] });
                        }
                    }}>
                        <SelectTrigger><SelectValue placeholder="Add team member" /></SelectTrigger>
                        <SelectContent>{teamMembers.map(member => <SelectItem key={member._id} value={member._id}>{member.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {formData.teamMembers.map((memberId) => {
                            const memberName = teamMembers.find(tm => tm._id === memberId)?.name || memberId;
                            return <Badge key={memberId} variant="secondary" className="text-xs">{memberName}<button type="button" onClick={() => setFormData({ ...formData, teamMembers: formData.teamMembers.filter(id => id !== memberId) })} className="ml-1 font-bold">×</button></Badge>;
                        })}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Job description..." />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>{isCreatingJob ? 'Adding Job...' : (job ? 'Update Job' : 'Add Job')}</Button>
            </div>
        </form>
    );
};
