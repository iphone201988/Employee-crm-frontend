import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGetDropdownOptionsQuery } from '@/store/teamApi';

type JobStatus = 'queued' | 'in-progress' | 'with-client' | 'for-approval' | 'completed';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
interface Job {
    id: string;
    jobName: string;
    clientName: string;
    jobType: string;
    startDate: string;
    endDate: string;
    estimatedCost: number;
    actualCost: number;
    status: JobStatus;
    priority: Priority;
    assignedTo: string;
    jobManager: string;
    team: string[];
    description: string;
}
// Job Form Component
interface JobFormProps {
    job?: Job | null;
    serviceTypes: Array<{
        key: string;
        name: string;
    }>;
    teamMembers: string[];
    onSubmit: (data: Partial<Job>) => void;
    onCancel: () => void;
}
export const JobForm = ({
    job,
    serviceTypes,
    teamMembers,
    onSubmit,
    onCancel
}: JobFormProps) => {
    const { data: categoriesData } = useGetDropdownOptionsQuery("all");
    const [formData, setFormData] = useState<Partial<Job>>({
        jobName: job?.jobName || '',
        clientName: job?.clientName || '',
        jobType: job?.jobType || '',
        startDate: job?.startDate || '',
        endDate: job?.endDate || '',
        estimatedCost: job?.estimatedCost || 0,
        actualCost: job?.actualCost || 0,
        status: job?.status || 'queued',
        priority: job?.priority || 'medium',
        assignedTo: job?.assignedTo || '',
        jobManager: job?.jobManager || teamMembers[0] || '',
        team: job?.team || [],
        description: job?.description || ''
    });
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    return <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="jobName">Job Name</Label>
                <Input id="jobName" value={formData.jobName} onChange={e => setFormData({
                    ...formData,
                    jobName: e.target.value
                })} required />
            </div>
            <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={formData.clientName} onChange={e => setFormData({
                    ...formData,
                    clientName: e.target.value
                })} required />
            </div>
            <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={formData.jobType} onValueChange={value => setFormData({
                    ...formData,
                    jobType: value
                })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                        {categoriesData?.data?.jobs.map(type => <SelectItem key={type.name} value={type.name}>
                            {type.name}
                        </SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="jobManager">Job Manager</Label>
                <Select value={formData.jobManager} onValueChange={value => setFormData({
                    ...formData,
                    jobManager: value
                })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select job manager" />
                    </SelectTrigger>
                    <SelectContent>
                        {categoriesData?.data?.teams.map(member => <SelectItem key={member?.name} value={member?.name}>
                            {member?.name}
                        </SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({
                    ...formData,
                    startDate: e.target.value
                })} required />
            </div>
            <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={formData.endDate} onChange={e => setFormData({
                    ...formData,
                    endDate: e.target.value
                })} required />
            </div>
            <div>
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input id="estimatedCost" type="number" value={formData.estimatedCost} onChange={e => setFormData({
                    ...formData,
                    estimatedCost: parseFloat(e.target.value) || 0
                })} required />
            </div>
            <div>
                <Label htmlFor="actualCost">Actual Cost</Label>
                <Input id="actualCost" type="number" value={formData.actualCost} onChange={e => setFormData({
                    ...formData,
                    actualCost: parseFloat(e.target.value) || 0
                })} />
            </div>
            <div>
                <Label htmlFor="team">Team Members</Label>
                <Select value="" onValueChange={value => {
                    const currentTeam = Array.isArray(formData.team) ? formData.team : [];
                    if (!currentTeam.includes(value)) {
                        setFormData({
                            ...formData,
                            team: [...currentTeam, value]
                        });
                    }
                }}>
                    <SelectTrigger>
                        <SelectValue placeholder="Add team member" />
                    </SelectTrigger>
                    <SelectContent>
                        {teamMembers.map(member => <SelectItem key={member} value={member}>
                            {member}
                        </SelectItem>)}
                    </SelectContent>
                </Select>
                {Array.isArray(formData.team) && formData.team.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
                    {formData.team.map((member, index) => <Badge key={index} variant="secondary" className="text-xs">
                        {member}
                        <button type="button" onClick={() => setFormData({
                            ...formData,
                            team: formData.team?.filter((_, i) => i !== index) || []
                        })} className="ml-1 text-xs">
                            ×
                        </button>
                    </Badge>)}
                </div>}
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: JobStatus) => setFormData({
                    ...formData,
                    status: value
                })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="queued">Queued</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="with-client">With Client</SelectItem>
                        <SelectItem value="for-approval">For Approval</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
            })} placeholder="Job description..." />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit">
                {job ? 'Update Job' : 'Add Job'}
            </Button>
        </div>
    </form>;
};