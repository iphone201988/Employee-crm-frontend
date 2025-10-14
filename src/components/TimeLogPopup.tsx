import { useMemo, useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { useAddTimeLogMutation } from "@/store/timesheetApi";
import { secondsToTime, timeToSeconds } from "@/utils/timesheetUtils";
import { toast } from "sonner";

type TimeLogPopupProps = {
  onClose?: () => void;
};

const TimeLogPopup = ({ onClose }: TimeLogPopupProps) => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJobTypeId, setSelectedJobTypeId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedPurposeId, setSelectedPurposeId] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
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
  const jobNameOptions = useMemo(() => (jobListResp?.data?.jobs || []).map((j: any) => ({ id: j._id, name: j.name })), [jobListResp]);
  const jobTypeOptions = useMemo(() => ((jobTypeResp?.data?.jobCategories || jobTypeResp?.data?.jobs || []) as any[]).map((j: any) => ({ id: j._id, name: j.name })), [jobTypeResp]);
  const teamOptions = useMemo(() => (teamResp?.data?.teams || []).map((t: any) => ({ id: t._id, name: t.name })), [teamResp]);
  const timePurposeOptions = useMemo(() => (timeResp?.data?.times || timeResp?.data?.time || []).map((p: any) => ({ id: p._id, name: p.name || p.title || '' })), [timeResp]);

  const [addTimeLog, { isLoading: isSaving }] = useAddTimeLogMutation();

  const handleSubmit = async () => {
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
      await addTimeLog(payload).unwrap();
      toast.success('Time log added successfully');
      onClose?.();
    } catch (e) {
      console.error('Failed to add time log', e);
      toast.error('Failed to add time log');
    }
  };
  return (
    <div className="w-full min-h-[100vh] bg-[#000000a6] absolute z-[9999999] left-0 top-0 flex items-center justify-center p-[16px]">
      <div className="p-[0px] bg-white w-auto ">
        <div className="bg-[#381980] py-[14px] relative">
            <h5 className=" font-semibold text-white text-center">+ Time Log</h5>
            <button onClick={onClose} className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"><X size={16}/></button>
        </div>
        <div className="bg-[#F5F3F9] py-[20px] px-[14px] flex flex-col gap-[12px]">
          <div className="flex gap-[15px] max-sm:flex-wrap">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative" htmlFor="">
                Date
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="date" value={dateISO ? new Date(dateISO).toISOString().slice(0,10) : ''} onChange={(e) => { const d = new Date(e.target.value + 'T00:00:00.000Z'); setDateISO(d.toISOString()); }} />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Client Name
                <Select value={selectedClientId || undefined} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer">
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
            </label>
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Job Name
                <Select value={selectedJobId || undefined} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer">
                    <SelectValue placeholder="Select job..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#eee] z-[10000000] max-h-60 overflow-auto">
                    {jobNameOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id} className="text-[#666666] hover:bg-[#F5F3F9]">
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Job Type
                <Select value={selectedJobTypeId || undefined} onValueChange={setSelectedJobTypeId}>
                  <SelectTrigger className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer">
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
            </label>
          </div>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[48%] max-sm:w-full" htmlFor="">
                Team Name
                <Select value={selectedTeamId || undefined} onValueChange={setSelectedTeamId}>
                  <SelectTrigger className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer">
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
            </label>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Description
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
             <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Time Purpose
                <Select value={selectedPurposeId || undefined} onValueChange={setSelectedPurposeId}>
                  <SelectTrigger className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm cursor-pointer">
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
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Duration
                <input
                  className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm"
                  type="text"
                  value={durationSeconds === 0 ? "" : secondsToTime(durationSeconds)}
                  onChange={(e) => {
                    const sec = timeToSeconds(e.target.value);
                    setDurationSeconds(Number.isFinite(sec) ? sec : 0);
                  }}
                  placeholder="HH:mm:ss"
                />
            </label>
          
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[20%] max-sm:w-full" htmlFor="">
                Billable
                <div className="flex items-center gap-2 bg-white border border-[#eee] rounded-sm px-[10px] py-[6px]">
                  <div className="scale-90 origin-left">
                    <Switch checked={billable} onCheckedChange={setBillable} />
                  </div>
                </div>
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[33%] max-sm:w-full" htmlFor="">
                Billable Rate
                <input
                  className={`bg-white border border-[#eee] ${billable ? 'text-[#666666]' : 'text-[#9ca3af]'} px-[12px] py-[8px] rounded-sm`}
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  disabled={!billable}
                />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[40%] max-sm:w-full" htmlFor="">
                Status
                <div className={`bg-white border border-[#eee] ${billable ? 'text-[#666666]' : 'text-[#9ca3af]'} rounded-sm flex`}>
                    <button type="button" onClick={() => billable && setStatus('notInvoiced')} disabled={!billable} className={`${status==='notInvoiced' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Not Invoiced</button>
                    <button type="button" onClick={() => billable && setStatus('invoiced')} disabled={!billable} className={`${status==='invoiced' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Invoiced</button>
                    <button type="button" onClick={() => billable && setStatus('paid')} disabled={!billable} className={`${status==='paid' && billable ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto disabled:opacity-50`}>Paid</button>
                </div>
            </label>
          </div>
        </div>
        <div className="bg-[#381980] py-[14px] px-[14px] flex justify-end gap-[8px]">
           <button onClick={onClose} className="text-[#017DB9] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-white rounded-md font-semibold">Cancel</button>
           <button onClick={handleSubmit} disabled={isSaving} className="text-[#fff] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-[#017DB9] rounded-md font-semibold">{isSaving ? 'Saving...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}

export default TimeLogPopup
