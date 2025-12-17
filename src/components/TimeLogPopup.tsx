import { useMemo, useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from 'lucide-react';
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { useAddTimeLogMutation, useUpdateTimeLogMutation } from "@/store/timesheetApi";
import { secondsToTime, timeToSeconds } from "@/utils/timesheetUtils";
import { validateTimeLogForm, validateSingleField, TimeLogFormData } from "@/utils/validation/timeLogValidation";
import { toast } from "sonner";

export type TimeLog = {
  id: string;
  date: string;
  teamMember: string;
  clientName: string;
  clientId?: string;
  clientRef: string;
  jobName: string;
  jobId?: string;
  jobType: string;
  category: 'client work' | 'meeting' | 'phone call' | 'event' | 'training' | 'other';
  description: string;
  hours: number;
  rate: number;
  amount: number;
  billable: boolean;
  status: 'notInvoiced' | 'invoiced' | 'paid';
  timePurpose?: string;
};

type TimeLogPopupProps = {
  onClose?: () => void;
  editingLog?: TimeLog | null;
};

const TimeLogPopup = ({ onClose, editingLog }: TimeLogPopupProps) => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJobTypeId, setSelectedJobTypeId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPurposeId, setSelectedPurposeId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [durationInput, setDurationInput] = useState<string | undefined>(undefined); // Track raw input for flexible editing
  const [billable, setBillable] = useState(false);
  const [rate, setRate] = useState('100');
  const [dateISO, setDateISO] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'notInvoiced' | 'invoiced' | 'paid'>('notInvoiced');

  const { data: clientResp } = useGetDropdownOptionsQuery('client');
  const { data: jobListResp } = useGetDropdownOptionsQuery('jobList');
  const { data: jobTypeResp } = useGetDropdownOptionsQuery('job');
  const { data: teamResp } = useGetDropdownOptionsQuery('team');
  const { data: timeResp } = useGetDropdownOptionsQuery('time');

  const clientOptions = useMemo(() => (clientResp?.data?.clients || []).map((c: any) => ({ id: c._id, name: c.name })), [clientResp]);
  const allJobOptions = useMemo(() => (jobListResp?.data?.jobs || []).map((j: any) => ({ id: j._id, name: j.name, clientId: j.clientId })), [jobListResp]);
  const jobNameOptions = useMemo(() => {
    if (!selectedClientId) return allJobOptions;
    return allJobOptions.filter(job => job.clientId === selectedClientId);
  }, [allJobOptions, selectedClientId]);
  const jobTypeOptions = useMemo(() => ((jobTypeResp?.data?.jobCategories || jobTypeResp?.data?.jobs || []) as any[]).map((j: any) => ({ id: j._id, name: j.name })), [jobTypeResp]);
  const teamOptions = useMemo(() => (teamResp?.data?.teams || []).map((t: any) => ({ id: t._id, name: t.name })), [teamResp]);
  const timePurposeOptions = useMemo(() => (timeResp?.data?.times || timeResp?.data?.time || []).map((p: any) => ({ id: p._id, name: p.name || p.title || '' })), [timeResp]);

  const [addTimeLog, { isLoading: isSaving }] = useAddTimeLogMutation();
  const [updateTimeLog, { isLoading: isUpdating }] = useUpdateTimeLogMutation();
  
  // Validation state
  const [errors, setErrors] = useState<Partial<Record<keyof TimeLogFormData, string>>>({});
  const [submitError, setSubmitError] = useState("");

  // Initialize form with editing log data
  useEffect(() => {
    if (editingLog) {
      // Find the actual IDs by matching names
      const client = clientOptions.find(c => c.name === editingLog.clientName);
      const job = allJobOptions.find(j => j.name === editingLog.jobName);
      const jobType = jobTypeOptions.find(jt => jt.name === editingLog.jobType);
      const team = teamOptions.find(t => t.name === editingLog.teamMember);
      const purpose = timePurposeOptions.find(p => p.name === editingLog.timePurpose);
      
      setSelectedClientId(client?.id || '');
      setSelectedJobId(job?.id || '');
      setSelectedJobTypeId(jobType?.id || '');
      setSelectedTeamId(team?.id || '');
      setSelectedPurposeId(purpose?.id || '');
      const durationSec = Math.round(editingLog.hours * 3600);
      setDurationSeconds(durationSec);
      setDurationInput(undefined); // Clear raw input when editing - will be formatted on focus
      setBillable(editingLog.billable);
      setRate(editingLog.rate.toString());
      setDateISO(editingLog.date);
      setDescription(editingLog.description);
      setStatus(editingLog.status);
    } else {
      // Reset form when not editing
      setDurationInput(undefined);
    }
  }, [editingLog, clientOptions, allJobOptions, jobTypeOptions, teamOptions, timePurposeOptions]);

  // Handle client selection and reset job selection
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    // Reset job selection when client changes
    setSelectedJobId("");
    // Clear client validation error
    if (errors.clientId) {
      setErrors(prev => ({ ...prev, clientId: undefined }));
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const formData: TimeLogFormData = {
      date: dateISO || new Date().toISOString(),
      clientId: selectedClientId,
      jobId: selectedJobId,
      jobTypeId: selectedJobTypeId,
      teamId: selectedTeamId,
      purposeId: selectedPurposeId,
      description: description,
      duration: durationSeconds,
      billable: billable,
      rate: rate,
      status: status,
    };

    const validationResult = validateTimeLogForm(formData);
    setErrors(validationResult.errors);
    return validationResult.isValid;
  };

  // Handle field validation on change
  const handleFieldChange = (field: keyof TimeLogFormData, value: any) => {
    // Clear the error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Helper functions for flexible duration input editing (matching MyTimeSheet pattern)
  const getDurationInputValue = (): string => {
    // If there's raw input, use it; otherwise format the value
    if (durationInput !== undefined) {
      return durationInput;
    }
    // Format the stored value
    if (durationSeconds === 0) return "";
    return secondsToTime(durationSeconds).replace(/-/g, ':'); // Convert dashes to colons for display
  };

  const handleDurationFocus = () => {
    // If no raw input exists, initialize it with formatted value
    if (durationInput === undefined) {
      const formatted = durationSeconds === 0 ? "" : secondsToTime(durationSeconds).replace(/-/g, ':');
      setDurationInput(formatted);
    }
  };

  const handleDurationChange = (value: string) => {
    // Store the raw input string
    setDurationInput(value);
    
    // Parse and update the duration value in real-time
    let parsedSeconds = 0;
    if (value.trim() !== "") {
      // Handle various formats: "3", "3:00", "03:00:00", "3:30", etc.
      // timeToSeconds handles colon-separated formats
      parsedSeconds = timeToSeconds(value);
    }
    
    // Update the duration seconds immediately
    setDurationSeconds(parsedSeconds);
    handleFieldChange('duration', parsedSeconds);
  };

  const handleDurationBlur = () => {
    // Get current raw value from state and parse it
    const rawValue = durationInput || "";
    let parsedSeconds = 0;
    if (rawValue.trim() !== "") {
      // Handle various formats: "3", "3:00", "03:00:00", "3:30", etc.
      // timeToSeconds handles colon-separated formats
      parsedSeconds = timeToSeconds(rawValue);
    }
    
    // Update the duration seconds
    setDurationSeconds(parsedSeconds);
    handleFieldChange('duration', parsedSeconds);
    
    // Clear the raw input so it will be formatted on next render
    setDurationInput(undefined);
  };

  const handleSubmit = async () => {
    setSubmitError("");
    
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        date: dateISO || new Date().toISOString(),
        status: status,
        clientId: selectedClientId,
        jobId: selectedJobId,
        jobTypeId: selectedJobTypeId,
        timeCategoryId: selectedPurposeId,
        description: description,
        billable: billable,
        rate: Number(rate) || 0,
        userId: selectedTeamId,
        duration: durationSeconds,
      };

      if (editingLog) {
        await updateTimeLog({ id: editingLog.id, data: payload }).unwrap();
        toast.success('Time log updated successfully');
      } else {
        await addTimeLog(payload).unwrap();
        toast.success('Time log added successfully');
      }
      onClose?.();
    } catch (e) {
      console.error('Failed to save time log', e);
      setSubmitError(`Failed to ${editingLog ? 'update' : 'add'} time log`);
      toast.error(`Failed to ${editingLog ? 'update' : 'add'} time log`);
    }
  };
  return (
    <div className="w-full min-h-[100vh] bg-[#000000a6] absolute z-[9999999] left-0 top-0 flex items-center justify-center p-[16px] m-0">
      <div className="p-[0px] bg-white w-full max-w-2xl">
        <div className="bg-[#381980] py-[14px] relative">
            <h5 className=" font-semibold text-white text-center">{editingLog ? 'Edit Time Log' : '+ Time Log'}</h5>
            <button onClick={onClose} className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"><X size={16}/></button>
        </div>
        <div className="bg-[#F5F3F9] py-[20px] px-[14px] flex flex-col gap-[12px]">
          <div className="flex gap-[15px] max-sm:flex-wrap">
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative">
                <Label htmlFor="date" className="text-[14px] font-semibold text-[#381980]">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm ${errors.date ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}
                  value={dateISO ? new Date(dateISO).toISOString().slice(0,10) : ''}
                  onChange={(e) => { 
                    const d = new Date(e.target.value + 'T00:00:00.000Z'); 
                    setDateISO(d.toISOString());
                    handleFieldChange('date', e.target.value);
                  }}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
            </div>
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="client" className="text-[14px] font-semibold text-[#381980]">
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedClientId || undefined} onValueChange={handleClientChange}>
                  <SelectTrigger className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer ${errors.clientId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}>
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {clientOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
                )}
            </div>
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="job" className="text-[14px] font-semibold text-[#381980]">
                  Job Name <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedJobId || undefined} onValueChange={(value) => {
                  setSelectedJobId(value);
                  handleFieldChange('jobId', value);
                }}>
                  <SelectTrigger className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer ${errors.jobId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}>
                    <SelectValue placeholder="Select job..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {jobNameOptions.length > 0 ? (
                      jobNameOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                          {opt.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {selectedClientId ? 'No jobs available for selected client' : 'Please select a client first'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {errors.jobId && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobId}</p>
                )}
            </div>
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="jobType" className="text-[14px] font-semibold text-[#381980]">
                  Job Type <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedJobTypeId || undefined} onValueChange={(value) => {
                  setSelectedJobTypeId(value);
                  handleFieldChange('jobTypeId', value);
                }}>
                  <SelectTrigger className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer ${errors.jobTypeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}>
                    <SelectValue placeholder="Select job type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {jobTypeOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jobTypeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.jobTypeId}</p>
                )}
            </div>
          </div>
          <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[48%] max-sm:w-full">
                <Label htmlFor="team" className="text-[14px] font-semibold text-[#381980]">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedTeamId || undefined} onValueChange={(value) => {
                  setSelectedTeamId(value);
                  handleFieldChange('teamId', value);
                }}>
                  <SelectTrigger className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer ${errors.teamId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}>
                    <SelectValue placeholder="Select team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {teamOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamId && (
                  <p className="mt-1 text-sm text-red-600">{errors.teamId}</p>
                )}
            </div>
          <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="description" className="text-[14px] font-semibold text-[#381980]">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  type="text"
                  className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    handleFieldChange('description', e.target.value);
                  }}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
            </div>
             <div className="flex gap-[15px] max-sm:flex-wrap ">
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="purpose" className="text-[14px] font-semibold text-[#381980]">
                  Time Purpose <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedPurposeId || undefined} onValueChange={(value) => {
                  setSelectedPurposeId(value);
                  handleFieldChange('purposeId', value);
                }}>
                  <SelectTrigger className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer ${errors.purposeId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}>
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {timePurposeOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.purposeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.purposeId}</p>
                )}
            </div>
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full">
                <Label htmlFor="duration" className="text-[14px] font-semibold text-[#381980]">
                  Duration <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="text"
                  className={`bg-white border text-[#666666] px-[12px] py-[8px] rounded-sm ${errors.duration ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}
                  value={getDurationInputValue()}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  onFocus={handleDurationFocus}
                  onBlur={handleDurationBlur}
                  placeholder="hh:mm:ss"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
            </div>
          
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[20%] max-sm:w-full" htmlFor="">
                Billable
                <div className="flex items-center gap-2 rounded-sm px-[10px] py-[6px] bg-transparent">
                  <div className="scale-90 origin-left">
                    <Switch checked={billable} onCheckedChange={setBillable} />
                  </div>
                </div>
            </label>
            <div className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[33%] max-sm:w-full">
                <Label htmlFor="rate" className="text-[14px] font-semibold text-[#381980]">
                  Billable Rate {billable && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="rate"
                  type="number"
                  className={`bg-white border px-[12px] py-[8px] rounded-sm ${billable ? 'text-[#666666]' : 'text-[#9ca3af]'} ${errors.rate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#eee]'}`}
                  value={rate}
                  onChange={(e) => {
                    setRate(e.target.value);
                    handleFieldChange('rate', e.target.value);
                  }}
                  disabled={!billable}
                />
                {errors.rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
                )}
            </div>
            {/* <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[50%] max-sm:w-full" htmlFor="">
                Status
                <div className={`bg-white border border-[#eee] ${billable ? 'text-[#666666]' : 'text-[#9ca3af]'} rounded-sm flex justify-between`}>
                    <button type="button" onClick={() => billable && setStatus('notInvoiced')} disabled={!billable} className={`${status==='notInvoiced' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Not Invoiced</button>
                    <button type="button" onClick={() => billable && setStatus('invoiced')} disabled={!billable} className={`${status==='invoiced' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Invoiced</button>
                    <button type="button" onClick={() => billable && setStatus('paid')} disabled={!billable} className={`${status==='paid' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Paid</button>
                </div>
            </label> */}
          </div>
        </div>
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mx-[14px] mb-2">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}
        <div className="bg-[#381980] py-[14px] px-[14px] flex justify-end gap-[8px]">
           <button onClick={onClose} className="text-[#017DB9] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-white rounded-md font-semibold">Cancel</button>
           <button onClick={handleSubmit} disabled={isSaving || isUpdating} className="text-[#fff] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-[#017DB9] rounded-md font-semibold">{(isSaving || isUpdating) ? 'Saving...' : (editingLog ? 'Update' : 'Submit')}</button>
        </div>
      </div>
    </div>
  )
}

export default TimeLogPopup
