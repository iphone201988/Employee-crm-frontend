import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import { DEFAULT_SERVICE_RATES, TEAM_MEMBER_NAMES } from "@/constants/teamConstants";
import { useForm, useFieldArray } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TemplateStatus = 'active' | 'draft' | 'archived';
interface Task {
  id: string;
  title: string;
  priority: Priority;
  teamMember: string;
  allocatedTime: number; // in hours
  dayNumber: number; // day number instead of date
}
interface JobTemplate {
  id: string;
  jobName: string;
  applyPeriodToJobName: boolean;
  startingPeriod?: string;
  internalDeadline: number; // day number
  skip: boolean;
  externalDeadline: number; // day number
  status: TemplateStatus;
  tasks: Task[];
}
interface ServiceTemplates {
  [key: string]: JobTemplate[];
}
const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

// Sample templates data
const sampleTemplates: ServiceTemplates = {
  vat: [{
    id: 'vat-1',
    jobName: 'VT-100',
    applyPeriodToJobName: false,
    internalDeadline: 20,
    skip: false,
    externalDeadline: 25,
    status: 'active',
    tasks: [{
      id: 'task-1',
      title: 'Gather VAT records',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 2,
      dayNumber: 1
    }, {
      id: 'task-2',
      title: 'Review transactions',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 4,
      dayNumber: 5
    }, {
      id: 'task-3',
      title: 'Submit VAT return',
      priority: 'urgent',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 1,
      dayNumber: 20
    }]
  }, {
    id: 'vat-2',
    jobName: 'VT-101',
    applyPeriodToJobName: true,
    internalDeadline: 10,
    skip: false,
    externalDeadline: 15,
    status: 'draft',
    tasks: [{
      id: 'task-4',
      title: 'Prepare application',
      priority: 'high',
      teamMember: 'Emma Thompson',
      allocatedTime: 3,
      dayNumber: 1
    }, {
      id: 'task-5',
      title: 'Submit to Revenue',
      priority: 'urgent',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 1,
      dayNumber: 10
    }]
  }, {
    id: 'vat-3',
    jobName: 'VT-102',
    applyPeriodToJobName: false,
    internalDeadline: 5,
    skip: true,
    externalDeadline: 15,
    status: 'active',
    tasks: [{
      id: 'task-12',
      title: 'Review VAT records',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 3,
      dayNumber: 1
    }, {
      id: 'task-13',
      title: 'Check compliance',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 2,
      dayNumber: 10
    }]
  }],
  payroll: [{
    id: 'payroll-1',
    jobName: 'PR-100',
    applyPeriodToJobName: true,
    internalDeadline: 25,
    skip: false,
    externalDeadline: 30,
    status: 'active',
    tasks: [{
      id: 'task-6',
      title: 'Collect timesheets',
      priority: 'high',
      teamMember: 'Michael Brown',
      allocatedTime: 2,
      dayNumber: 25
    }, {
      id: 'task-7',
      title: 'Calculate pay',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 4,
      dayNumber: 27
    }, {
      id: 'task-8',
      title: 'Generate payslips',
      priority: 'medium',
      teamMember: 'Emma Thompson',
      allocatedTime: 2,
      dayNumber: 30
    }]
  }, {
    id: 'payroll-2',
    jobName: 'PR-101',
    applyPeriodToJobName: false,
    internalDeadline: 5,
    skip: true,
    externalDeadline: 7,
    status: 'draft',
    tasks: [{
      id: 'task-14',
      title: 'Collect weekly timesheets',
      priority: 'high',
      teamMember: 'Michael Brown',
      allocatedTime: 1,
      dayNumber: 7
    }, {
      id: 'task-15',
      title: 'Process weekly pay',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 2,
      dayNumber: 7
    }]
  }],
  cti: [{
    id: 'cti-1',
    jobName: 'CT-100',
    applyPeriodToJobName: false,
    internalDeadline: 50,
    skip: false,
    externalDeadline: 55,
    status: 'archived',
    tasks: [{
      id: 'task-9',
      title: 'Prepare accounts',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 8,
      dayNumber: 1
    }, {
      id: 'task-10',
      title: 'Calculate CT liability',
      priority: 'high',
      teamMember: 'David Chen',
      allocatedTime: 4,
      dayNumber: 20
    }, {
      id: 'task-11',
      title: 'Submit return',
      priority: 'urgent',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 2,
      dayNumber: 55
    }]
  }, {
    id: 'cti-2',
    jobName: 'CT-101',
    applyPeriodToJobName: true,
    internalDeadline: 25,
    skip: false,
    externalDeadline: 30,
    status: 'active',
    tasks: [{
      id: 'task-16',
      title: 'Review tax position',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 4,
      dayNumber: 1
    }, {
      id: 'task-17',
      title: 'Plan tax strategies',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 3,
      dayNumber: 15
    }]
  }],
  audit: [{
    id: 'audit-1',
    jobName: 'AU-100',
    applyPeriodToJobName: true,
    internalDeadline: 70,
    skip: false,
    externalDeadline: 90,
    status: 'active',
    tasks: [{
      id: 'task-18',
      title: 'Plan audit approach',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 8,
      dayNumber: 1
    }, {
      id: 'task-19',
      title: 'Test transactions',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 20,
      dayNumber: 30
    }, {
      id: 'task-20',
      title: 'Draft audit report',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 12,
      dayNumber: 75
    }]
  }, {
    id: 'audit-2',
    jobName: 'AU-101',
    applyPeriodToJobName: false,
    internalDeadline: 25,
    skip: false,
    externalDeadline: 45,
    status: 'draft',
    tasks: [{
      id: 'task-21',
      title: 'Review controls',
      priority: 'medium',
      teamMember: 'Emma Thompson',
      allocatedTime: 6,
      dayNumber: 1
    }, {
      id: 'task-22',
      title: 'Draft recommendations',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 4,
      dayNumber: 30
    }]
  }],
  bookkeeping: [{
    id: 'bookkeeping-1',
    jobName: 'BK-100',
    applyPeriodToJobName: false,
    internalDeadline: 25,
    skip: false,
    externalDeadline: 30,
    status: 'active',
    tasks: [{
      id: 'task-23',
      title: 'Record transactions',
      priority: 'medium',
      teamMember: 'Emma Thompson',
      allocatedTime: 8,
      dayNumber: 1
    }, {
      id: 'task-24',
      title: 'Bank reconciliation',
      priority: 'high',
      teamMember: 'Michael Brown',
      allocatedTime: 2,
      dayNumber: 25
    }, {
      id: 'task-25',
      title: 'Prepare reports',
      priority: 'medium',
      teamMember: 'Emma Thompson',
      allocatedTime: 3,
      dayNumber: 28
    }]
  }],
  incomeTax: [{
    id: 'incometax-1',
    jobName: 'IT-100',
    applyPeriodToJobName: true,
    internalDeadline: 290,
    skip: false,
    externalDeadline: 304,
    status: 'active',
    tasks: [{
      id: 'task-26',
      title: 'Gather tax documents',
      priority: 'high',
      teamMember: 'David Chen',
      allocatedTime: 2,
      dayNumber: 1
    }, {
      id: 'task-27',
      title: 'Prepare tax return',
      priority: 'medium',
      teamMember: 'Emma Thompson',
      allocatedTime: 4,
      dayNumber: 280
    }, {
      id: 'task-28',
      title: 'Submit return',
      priority: 'urgent',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 1,
      dayNumber: 300
    }]
  }, {
    id: 'incometax-2',
    jobName: 'IT-101',
    applyPeriodToJobName: false,
    internalDeadline: 350,
    skip: false,
    externalDeadline: 365,
    status: 'draft',
    tasks: [{
      id: 'task-29',
      title: 'Review tax position',
      priority: 'medium',
      teamMember: 'David Chen',
      allocatedTime: 3,
      dayNumber: 1
    }, {
      id: 'task-30',
      title: 'Plan tax savings',
      priority: 'high',
      teamMember: 'Sarah Mitchell',
      allocatedTime: 2,
      dayNumber: 180
    }]
  }]
};
const JobTemplatesTab = () => {
  const [templates, setTemplates] = useState<ServiceTemplates>(sampleTemplates);
  const [selectedService, setSelectedService] = useState<string>('');
  const [editingTemplate, setEditingTemplate] = useState<JobTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templatesViewOpen, setTemplatesViewOpen] = useState(false);
  const [viewingService, setViewingService] = useState<string>('');
  const [templateDetailOpen, setTemplateDetailOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch
  } = useForm<JobTemplate>();
  const {
    fields: taskFields,
    append: appendTask,
    remove: removeTask
  } = useFieldArray({
    control,
    name: "tasks"
  });
  const serviceTypes = Object.keys(DEFAULT_SERVICE_RATES).map(key => ({
    key,
    name: key === 'vat' ? 'VAT' : key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
    rate: DEFAULT_SERVICE_RATES[key as keyof typeof DEFAULT_SERVICE_RATES]
  }));
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const openDialog = (service: string, template?: JobTemplate) => {
    setSelectedService(service);
    setEditingTemplate(template || null);
    if (template) {
      reset(template);
    } else {
      reset({
        id: generateId(),
        jobName: '',
        applyPeriodToJobName: false,
        startingPeriod: '',
        internalDeadline: 1,
        skip: false,
        externalDeadline: 1,
        status: 'draft',
        tasks: []
      });
    }
    setDialogOpen(true);
  };
  const onSubmit = (data: JobTemplate) => {
    const updatedTemplates = {
      ...templates
    };
    if (!updatedTemplates[selectedService]) {
      updatedTemplates[selectedService] = [];
    }
    if (editingTemplate) {
      const index = updatedTemplates[selectedService].findIndex(t => t.id === editingTemplate.id);
      if (index !== -1) {
        updatedTemplates[selectedService][index] = {
          ...data,
          id: editingTemplate.id
        };
      }
    } else {
      updatedTemplates[selectedService].push({
        ...data,
        id: generateId()
      });
    }
    setTemplates(updatedTemplates);
    setDialogOpen(false);
    reset();
  };
  const deleteTemplate = (service: string, templateId: string) => {
    const updatedTemplates = {
      ...templates
    };
    updatedTemplates[service] = updatedTemplates[service].filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
  };
  const addNewTask = () => {
    appendTask({
      id: generateId(),
      title: '',
      priority: 'medium' as Priority,
      teamMember: '',
      allocatedTime: 0,
      dayNumber: 0
    });
  };
  const openTemplatesView = (serviceKey: string) => {
    setViewingService(serviceKey);
    setTemplatesViewOpen(true);
  };
  const openTemplateDetail = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setTemplateDetailOpen(true);
  };
  const getStatusCounts = (serviceKey: string) => {
    const serviceTemplates = templates[serviceKey] || [];
    return {
      total: serviceTemplates.length,
      active: serviceTemplates.filter(t => t.status === 'active').length,
      draft: serviceTemplates.filter(t => t.status === 'draft').length,
      archived: serviceTemplates.filter(t => t.status === 'archived').length
    };
  };
  return <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48 font-medium">Service</TableHead>
                <TableHead className="w-32 text-center font-medium">Number of Templates</TableHead>
                <TableHead className="w-32 text-center font-medium">Draft</TableHead>
                <TableHead className="w-32 text-center font-medium">Active</TableHead>
                <TableHead className="w-32 text-center font-medium">Archived</TableHead>
                <TableHead className="w-32 text-center font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypes.map(service => {
              const counts = getStatusCounts(service.key);
              return <TableRow key={service.key} className="h-14">
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${counts.total === 0 ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {counts.total}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${counts.draft === 0 ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {counts.draft}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${counts.active === 0 ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {counts.active}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${counts.archived === 0 ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {counts.archived}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => openDialog(service.key)} size="sm" variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                         <Button onClick={() => openTemplatesView(service.key)} size="sm" variant={counts.total > 0 ? "default" : "outline"} disabled={counts.total === 0} className={counts.total === 0 ? "opacity-50" : ""}>
                           <Eye className="w-4 h-4 mr-2" />
                           View Templates
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>;
            })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Templates View Dialog */}
      <Dialog open={templatesViewOpen} onOpenChange={setTemplatesViewOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {serviceTypes.find(s => s.key === viewingService)?.name} Templates
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(templates[viewingService] || []).map(template => <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTemplateDetail(template)}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${template.status === 'active' ? 'bg-green-500' : template.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                          <span className={`text-xs font-medium ${template.status === 'active' ? 'text-green-600' : template.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {template.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">{template.jobName}</h4>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Tasks: {template.tasks.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Internal: Day {template.internalDeadline}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>External: Day {template.externalDeadline}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
            
            {(!templates[viewingService] || templates[viewingService].length === 0) && <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-muted-foreground">
                    No templates created yet for this service
                  </div>
                  <Button onClick={() => {
                setTemplatesViewOpen(false);
                openDialog(viewingService);
              }} className="mt-4" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Create Job Template
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <div>
              <Label htmlFor="service" className="text-sm font-medium">Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(service => (
                    <SelectItem key={service.key} value={service.key}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Job Name */}
            <div>
              <Label htmlFor="jobName" className="text-sm font-medium">Job Name</Label>
              <Input 
                {...register('jobName', { required: true })} 
                id="jobName" 
                className="mt-1"
                placeholder="Enter job name"
              />
            </div>

            {/* Apply Period To Job Name */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="applyPeriodToJobName" 
                checked={watch('applyPeriodToJobName')} 
                onCheckedChange={checked => setValue('applyPeriodToJobName', checked as boolean)} 
              />
              <Label htmlFor="applyPeriodToJobName" className="text-sm">
                Apply Period To Job Name
              </Label>
            </div>

            {/* Internal Deadline */}
            <div>
              <Label className="text-sm font-medium">Internal Deadline (Day Number)</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input 
                  {...register('internalDeadline', {
                    required: !watch('skip'),
                    valueAsNumber: true
                  })} 
                  type="number" 
                  min="1" 
                  defaultValue="1"
                  disabled={watch('skip')} 
                  className={`flex-1 ${watch('skip') ? "bg-muted text-muted-foreground" : ""}`} 
                />
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="skip" 
                    checked={watch('skip')} 
                    onCheckedChange={checked => setValue('skip', checked as boolean)} 
                  />
                  <Label htmlFor="skip" className="text-sm">N/A</Label>
                </div>
              </div>
            </div>

            {/* External Deadline */}
            <div>
              <Label className="text-sm font-medium">External Deadline (Day Number)</Label>
              <Input 
                {...register('externalDeadline', {
                  required: true,
                  valueAsNumber: true
                })} 
                type="number" 
                min="1" 
                defaultValue="1"
                className="mt-1"
              />
            </div>

            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Tasks</h3>
                <Button type="button" onClick={addNewTask} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Task Title</TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider w-28">Priority</TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider w-36">Team Member</TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider w-20">Hours</TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider w-16">Day #</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskFields.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tasks added yet. Click "Add Task" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      taskFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Input 
                              {...register(`tasks.${index}.title`)} 
                              placeholder="Enter task title" 
                              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0" 
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              onValueChange={value => setValue(`tasks.${index}.priority`, value as Priority)} 
                              defaultValue={watch(`tasks.${index}.priority`)}
                            >
                              <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0">
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              onValueChange={value => setValue(`tasks.${index}.teamMember`, value)} 
                              defaultValue={watch(`tasks.${index}.teamMember`)}
                            >
                              <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0">
                                <SelectValue placeholder="Select member" />
                              </SelectTrigger>
                              <SelectContent>
                                {TEAM_MEMBER_NAMES.map(name => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              {...register(`tasks.${index}.allocatedTime`, {
                                valueAsNumber: true
                              })} 
                              type="number" 
                              step="0.5" 
                              min="0" 
                              placeholder="0" 
                              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0" 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              {...register(`tasks.${index}.dayNumber`, {
                                valueAsNumber: true
                              })} 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0" 
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              type="button" 
                              onClick={() => removeTask(index)} 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-auto p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4">
              <Select 
                onValueChange={value => setValue('status', value as TemplateStatus)} 
                defaultValue={watch('status')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Template
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog open={templateDetailOpen} onOpenChange={setTemplateDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <DialogTitle className="text-xl font-semibold">
              {selectedTemplate?.jobName}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
              if (selectedTemplate) {
                setTemplateDetailOpen(false);
                openDialog(viewingService, selectedTemplate);
              }
            }}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
              if (selectedTemplate) {
                deleteTemplate(viewingService, selectedTemplate.id);
                setTemplateDetailOpen(false);
              }
            }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogHeader>
          
          {selectedTemplate && <div className="space-y-6">
              {/* Template Info Section with Header */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Template Details</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedTemplate.status === 'active' ? 'bg-green-500' : selectedTemplate.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                    <span className="text-sm font-medium capitalize text-muted-foreground">{selectedTemplate.status}</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Job Name</Label>
                      <div className="text-sm font-medium">{selectedTemplate.jobName}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Apply Period To Job Name</Label>
                      <div className="text-sm font-medium">{selectedTemplate.applyPeriodToJobName ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Starting Period</Label>
                      <div className="text-sm">{selectedTemplate.startingPeriod || 'Not specified'}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Internal Deadline</Label>
                      <div className="text-sm">Day {selectedTemplate.internalDeadline}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">External Deadline</Label>
                      <div className="text-sm">Day {selectedTemplate.externalDeadline}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Skip</Label>
                      <div className="text-sm font-medium">{selectedTemplate.skip ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tasks ({selectedTemplate.tasks.length})</h3>
                
                {selectedTemplate.tasks.length > 0 ? <div className="space-y-3">
                    {selectedTemplate.tasks.map((task, index) => <Card key={task.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{task.title}</h4>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Day {task.dayNumber}</span>
                                <span>{task.allocatedTime}h allocated</span>
                                <span>{task.teamMember}</span>
                              </div>
                            </div>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </Card>)}
                  </div> : <div className="text-center py-8 text-muted-foreground">
                    No tasks defined for this template
                  </div>}
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </div>;
};
export default JobTemplatesTab;