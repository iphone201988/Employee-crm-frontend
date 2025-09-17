import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Minus } from "lucide-react";
import { TEAM_MEMBER_NAMES } from "@/constants/teamConstants";
import { getProfileImage, getUserInitials } from "@/utils/profiles";


const JobBuilderTab = () => {
  const [activeTab, setActiveTab] = useState("loaded");
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [jobData, setJobData] = useState([
    {
      clientName: "Acme Consulting",
      jobCount: 3,
      jobs: [
        { id: 1, type: "Income Tax", recurring: "Yearly", recurringLogic: "1st Jan every Y", template: "IT-100", status: "loaded", manager: "John Smith" },
        { id: 2, type: "VAT", recurring: "2 Months", recurringLogic: "1st D every 2M", template: "VT-100", status: "loaded", manager: "Sarah Johnson" },
        { id: 3, type: "Payroll", recurring: "Weekly", recurringLogic: "Wed every W", template: "PR-100", status: "loaded", manager: "Michael Brown" }
      ]
    },
    {
      clientName: "Property Solutions",
      jobCount: 1,
      jobs: [
        { id: 4, type: "Income Tax", recurring: "Yearly", recurringLogic: "1st Jan every Y", template: "IT-100", status: "for-review", manager: "Emma Wilson" }
      ]
    },
    {
      clientName: "Finance Experts",
      jobCount: 3,
      jobs: [
        { id: 5, type: "Income Tax", recurring: "Yearly", recurringLogic: "1st Jan every Y", template: "IT-100", status: "loaded", manager: "David Wilson" },
        { id: 6, type: "VAT", recurring: "2 Months", recurringLogic: "1st D every 2M", template: "VT-100", status: "for-review", manager: "Lisa Anderson" },
        { id: 7, type: "Payroll", recurring: "Monthly", recurringLogic: "1st day of M", template: "PR-101", status: "built", manager: "James Taylor" }
      ]
    },
    {
      clientName: "Tech Solutions Limited",
      jobCount: 2,
      jobs: [
        { id: 8, type: "Annual Returns", recurring: "Yearly", recurringLogic: "365 before", template: "CT-100", status: "built", manager: "Jennifer White" },
        { id: 9, type: "Payroll", recurring: "Monthly", recurringLogic: "1st D of M", template: "PR-102", status: "built", manager: "Robert Thomas" }
      ]
    },
    {
      clientName: "Water Savers Limited",
      jobCount: 3,
      jobs: [
        { id: 10, type: "Annual Returns", recurring: "Yearly", recurringLogic: "365 before FYE", template: "CT-100", status: "loaded", manager: "Jessica Hall" },
        { id: 11, type: "VAT", recurring: "2 Months", recurringLogic: "1st day every 2M", template: "VT-100", status: "for-review", manager: "Christopher Rodriguez" },
        { id: 12, type: "Payroll", recurring: "Fortnightly", recurringLogic: "Wed every 2W", template: "PR-102", status: "loaded", manager: "Amanda Lewis" }
      ]
    }
  ]);


  const getFilteredData = () => {
    return jobData.map(client => ({
      ...client,
      jobs: client.jobs.filter(job => job.status === activeTab),
      jobCount: client.jobs.filter(job => job.status === activeTab).length
    })).filter(client => client.jobs.length > 0);
  };


  const addJob = (clientIndex: number) => {
    const newJobData = [...jobData];
    const newJob = {
      id: Date.now(),
      type: "",
      recurring: "",
      recurringLogic: "",
      template: "",
      status: activeTab,
      manager: ""
    };
    newJobData[clientIndex].jobs.push(newJob);
    newJobData[clientIndex].jobCount = newJobData[clientIndex].jobs.length;
    setJobData(newJobData);
  };


  const removeJob = (clientIndex: number, jobId: number) => {
    const newJobData = [...jobData];
    newJobData[clientIndex].jobs = newJobData[clientIndex].jobs.filter(job => job.id !== jobId);
    newJobData[clientIndex].jobCount = newJobData[clientIndex].jobs.length;
    setJobData(newJobData);
  };


  const moveJobToNextStage = (clientIndex: number, jobId: number) => {
    const newJobData = [...jobData];
    const job = newJobData[clientIndex].jobs.find(j => j.id === jobId);
    if (job) {
      if (job.status === "loaded") job.status = "for-review";
      else if (job.status === "for-review") job.status = "built";
    }
    setJobData(newJobData);
  };


  const getTabCounts = () => {
    const counts = { loaded: 0, "for-review": 0, built: 0 };
    jobData.forEach(client => {
      client.jobs.forEach(job => {
        counts[job.status as keyof typeof counts]++;
      });
    });
    return counts;
  };


  const getButtonText = () => {
    switch (activeTab) {
      case "loaded":
        return "Move To For Review";
      case "for-review":
        return "Build Job";
      case "built":
        return "Edit Job";
      default:
        return "Build";
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case "loaded":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">●</Badge>;
      case "for-review":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">●</Badge>;
      case "built":
        return <Badge className="bg-green-100 text-green-800 border-green-200">●</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">●</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 pt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="loaded">Loaded ({getTabCounts().loaded})</TabsTrigger>
              <TabsTrigger value="for-review">For Review ({getTabCounts()["for-review"]})</TabsTrigger>
              <TabsTrigger value="built">Built ({getTabCounts().built})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4 pt-6">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[15%]">Client Name</TableHead>
                    <TableHead className="w-[5%] text-center">Job Count</TableHead>
                    <TableHead className="w-[10%]">Job Type</TableHead>
                    <TableHead className="w-[15%]">Job Manager</TableHead>
                    <TableHead className="w-[10%]">Job Fee</TableHead>
                    <TableHead className="w-[10%]">Recurring</TableHead>
                    <TableHead className="w-[10%]">Recurring Logic</TableHead>
                    <TableHead className="w-[10%]">Kick-off Date</TableHead>
                    <TableHead className="w-[10%]">Apply Template</TableHead>
                    <TableHead className="w-[15%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredData().map((client, clientIndex) => {
                    const originalClientIndex = jobData.findIndex(c => c.clientName === client.clientName);
                    return client.jobs.map((job, jobIndex) => {
                      const isEditing = editingJobId === job.id;
                      const isRowDisabled = activeTab === "built" && !isEditing;
                      
                      return (
                        <TableRow 
                          key={`${originalClientIndex}-${job.id}`}
                          className={isRowDisabled ? "opacity-50" : ""}
                        >
                          {jobIndex === 0 && (
                            <TableCell rowSpan={client.jobCount} className="font-medium border-r align-top pt-4">
                              {client.clientName}
                            </TableCell>
                          )}
                          {jobIndex === 0 && (
                            <TableCell rowSpan={client.jobCount} className="text-center border-r align-top pt-4">
                              {client.jobCount}
                            </TableCell>
                          )}
                           <TableCell>{job.type}</TableCell>
                           <TableCell>
                             {activeTab === "loaded" ? (
                               <Select defaultValue={job.manager} disabled={isRowDisabled}>
                                 <SelectTrigger className="w-full h-9">
                                   <SelectValue>
                                     <div className="flex items-center gap-2">
                                       <Avatar className="h-6 w-6">
                                         <AvatarImage src={getProfileImage(job.manager)} alt={job.manager} />
                                         <AvatarFallback className="text-xs">{getUserInitials(job.manager)}</AvatarFallback>
                                       </Avatar>
                                       <span className="text-sm truncate">{job.manager}</span>
                                     </div>
                                   </SelectValue>
                                 </SelectTrigger>
                                 <SelectContent>
                                   {TEAM_MEMBER_NAMES.map((member) => (
                                     <SelectItem key={member} value={member}>
                                       <div className="flex items-center gap-2">
                                         <Avatar className="h-6 w-6">
                                           <AvatarImage src={getProfileImage(member)} alt={member} />
                                           <AvatarFallback className="text-xs">{getUserInitials(member)}</AvatarFallback>
                                         </Avatar>
                                         <span>{member}</span>
                                       </div>
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <Avatar className="h-6 w-6">
                                   <AvatarImage src={getProfileImage(job.manager)} alt={job.manager} />
                                   <AvatarFallback className="text-xs">{getUserInitials(job.manager)}</AvatarFallback>
                                 </Avatar>
                                 <span className="text-sm truncate">{job.manager}</span>
                               </div>
                             )}
                           </TableCell>
                            <TableCell>
                              <input 
                                type="number" 
                                placeholder="€0.00"
                                className="w-full h-9 px-2 border border-input rounded-md text-sm disabled:opacity-50"
                                disabled={isRowDisabled}
                                defaultValue=""
                                step="0.01"
                                min="0"
                                onBlur={(e) => {
                                  if (e.target.value && !isNaN(Number(e.target.value))) {
                                    e.target.value = `€${Number(e.target.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                  }
                                }}
                                onFocus={(e) => {
                                  if (e.target.value.startsWith('€')) {
                                    e.target.value = e.target.value.replace(/[€,]/g, '');
                                  }
                                }}
                              />
                            </TableCell>
                          <TableCell>
                          <Select defaultValue={job.recurring} disabled={isRowDisabled}>
                            <SelectTrigger className="w-full h-9">
                              <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Weekly">Weekly</SelectItem>
                                <SelectItem value="Fortnightly">Fortnightly</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="2 Months">2 Months</SelectItem>
                                <SelectItem value="Yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                          <Select defaultValue={job.recurringLogic} disabled={isRowDisabled}>
                            <SelectTrigger className="w-full h-9">
                              <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st Jan every Y">1st Jan every Y</SelectItem>
                                <SelectItem value="1st D every 2M">1st D every 2M</SelectItem>
                                <SelectItem value="Wed every W">Wed every W</SelectItem>
                                <SelectItem value="1st day of M">1st day of M</SelectItem>
                                <SelectItem value="365 before">365 before</SelectItem>
                                <SelectItem value="365 before FYE">365 before FYE</SelectItem>
                                <SelectItem value="1st D of M">1st D of M</SelectItem>
                                <SelectItem value="1st day every 2M">1st day every 2M</SelectItem>
                                <SelectItem value="Wed every 2W">Wed every 2W</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                           <TableCell>
                           <input 
                             type="date" 
                             className="w-full h-9 px-2 border border-input rounded-md text-sm disabled:opacity-50"
                             disabled={isRowDisabled}
                             defaultValue="2024-01-01"
                           />
                           </TableCell>
                          <TableCell>
                          <Select defaultValue={job.template} disabled={isRowDisabled}>
                            <SelectTrigger className="w-full h-9">
                              <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IT-100">IT-100</SelectItem>
                                <SelectItem value="VT-100">VT-100</SelectItem>
                                <SelectItem value="PR-100">PR-100</SelectItem>
                                <SelectItem value="PR-101">PR-101</SelectItem>
                                <SelectItem value="PR-102">PR-102</SelectItem>
                                <SelectItem value="CT-100">CT-100</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {jobIndex === 0 && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => addJob(originalClientIndex)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeJob(originalClientIndex, job.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm" 
                                className={`h-8 px-2 ${activeTab === "built" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                onClick={() => {
                                  if (activeTab === "built") {
                                    if (isEditing) {
                                      setEditingJobId(null);
                                    } else {
                                      setEditingJobId(job.id);
                                    }
                                  } else {
                                    moveJobToNextStage(originalClientIndex, job.id);
                                  }
                                }}
                              >
                                {activeTab === "built" ? (isEditing ? "Save" : "Edit Job") : getButtonText()}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};


export default JobBuilderTab;
