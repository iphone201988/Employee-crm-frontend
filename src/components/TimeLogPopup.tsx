import { useMemo, useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { X } from 'lucide-react';
import { useGetDropdownOptionsQuery } from "@/store/teamApi";
import { useAddTimeLogMutation } from "@/store/timesheetApi";
import { secondsToTime, timeToSeconds } from "@/utils/timesheetUtils";
import { toast } from "sonner";

type TimeLogPopupProps = {
  onClose?: () => void;
};

const TimeLogPopup = ({ onClose }: TimeLogPopupProps) => {
  const [clientInput, setClientInput] = useState("");
  const [jobNameInput, setJobNameInput] = useState("");
  const [jobTypeInput, setJobTypeInput] = useState("");
  const [teamInput, setTeamInput] = useState("");
  const [purposeInput, setPurposeInput] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [billable, setBillable] = useState(true);
  const [rate, setRate] = useState('');
  const [dateISO, setDateISO] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'notInvoiced' | 'invoiced' | 'paid'>('notInvoiced');
  const [clientOpen, setClientOpen] = useState(false);
  const [jobNameOpen, setJobNameOpen] = useState(false);
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [purposeOpen, setPurposeOpen] = useState(false);

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

  const filterOpts = (opts: Array<{ id: string; name: string }>, q: string) => {
    const query = (q || '').toLowerCase().trim();
    if (!query) return opts.slice(0, 8);
    return opts.filter(o => (o.name || '').toLowerCase().includes(query)).slice(0, 8);
  };

  const [addTimeLog, { isLoading: isSaving }] = useAddTimeLogMutation();
  const resolveIdByName = (opts: Array<{ id: string; name: string }>, name: string) => {
    const exact = opts.find(o => (o.name || '').toLowerCase() === (name || '').toLowerCase());
    if (exact) return exact.id;
    const partial = opts.find(o => (o.name || '').toLowerCase().includes((name || '').toLowerCase()));
    return partial ? partial.id : '';
  };

  const handleSubmit = async () => {
    try {
      const clientId = resolveIdByName(clientOptions, clientInput);
      const jobId = resolveIdByName(jobNameOptions, jobNameInput);
      const jobTypeId = resolveIdByName(jobTypeOptions, jobTypeInput);
      const timeCategoryId = resolveIdByName(timePurposeOptions, purposeInput);
      const userId = resolveIdByName(teamOptions, teamInput);

      const payload = {
        date: dateISO || new Date().toISOString(),
        status: status,
        clientId,
        jobId,
        jobTypeId,
        timeCategoryId,
        description: description,
        billable: billable,
        rate: Number(rate) || 0,
        userId,
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
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative" htmlFor="">
                Client Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={clientInput} onChange={(e) => { const v = e.target.value; setClientInput(v); setClientOpen(v.trim().length > 0); }} placeholder="Search client..." />
                {clientOpen && clientInput.trim().length > 0 && filterOpts(clientOptions, clientInput).length > 0 && (
                  <div className="absolute left-0 right-0 top-[70px] bg-white border border-[#eee] rounded-sm max-h-48 overflow-auto z-[100]">
                    {filterOpts(clientOptions, clientInput).map(opt => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-[#F5F3F9] text-[#666666]" onClick={() => { setClientInput(opt.name); setClientOpen(false); }}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
            </label>
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative" htmlFor="">
                Job Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={jobNameInput} onChange={(e) => { const v = e.target.value; setJobNameInput(v); setJobNameOpen(v.trim().length > 0); }} placeholder="Search job name..." />
                {jobNameOpen && jobNameInput.trim().length > 0 && filterOpts(jobNameOptions, jobNameInput).length > 0 && (
                  <div className="absolute left-0 right-0 top-[70px] bg-white border border-[#eee] rounded-sm max-h-48 overflow-auto z-[100]">
                    {filterOpts(jobNameOptions, jobNameInput).map(opt => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-[#F5F3F9] text-[#666666]" onClick={() => { setJobNameInput(opt.name); setJobNameOpen(false); }}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative" htmlFor="">
                Job Type
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={jobTypeInput} onChange={(e) => { const v = e.target.value; setJobTypeInput(v); setJobTypeOpen(v.trim().length > 0); }} placeholder="Search job type..." />
                {jobTypeOpen && jobTypeInput.trim().length > 0 && filterOpts(jobTypeOptions, jobTypeInput).length > 0 && (
                  <div className="absolute left-0 right-0 top-[70px] bg-white border border-[#eee] rounded-sm max-h-48 overflow-auto z-[100]">
                    {filterOpts(jobTypeOptions, jobTypeInput).map(opt => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-[#F5F3F9] text-[#666666]" onClick={() => { setJobTypeInput(opt.name); setJobTypeOpen(false); }}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
            </label>
          </div>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[48%] max-sm:w-full relative" htmlFor="">
                Team Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={teamInput} onChange={(e) => { const v = e.target.value; setTeamInput(v); setTeamOpen(v.trim().length > 0); }} placeholder="Search team..." />
                {teamOpen && teamInput.trim().length > 0 && filterOpts(teamOptions, teamInput).length > 0 && (
                  <div className="absolute left-0 right-0 top-[70px] bg-white border border-[#eee] rounded-sm max-h-48 overflow-auto z-[100]">
                    {filterOpts(teamOptions, teamInput).map(opt => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-[#F5F3F9] text-[#666666]" onClick={() => { setTeamInput(opt.name); setTeamOpen(false); }}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
            </label>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Description
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
             <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full relative" htmlFor="">
                Time Purpose
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" value={purposeInput} onChange={(e) => { const v = e.target.value; setPurposeInput(v); setPurposeOpen(v.trim().length > 0); }} placeholder="Search purpose..." />
                {purposeOpen && purposeInput.trim().length > 0 && filterOpts(timePurposeOptions, purposeInput).length > 0 && (
                  <div className="absolute left-0 right-0 top-[70px] bg-white border border-[#eee] rounded-sm max-h-48 overflow-auto z-[100]">
                    {filterOpts(timePurposeOptions, purposeInput).map(opt => (
                      <button key={opt.id} type="button" className="w-full text-left px-3 py-2 hover:bg-[#F5F3F9] text-[#666666]" onClick={() => { setPurposeInput(opt.name); setPurposeOpen(false); }}>
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
            </label>
              <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Billable
                <Switch checked={billable} onCheckedChange={setBillable} />
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
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Billable Rate
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Status
                <div className="bg-white border border-[#eee] text-[#666666] rounded-sm flex">
                    <button type="button" onClick={() => setStatus('notInvoiced')} className={`${status==='notInvoiced' ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto`}>Not Invoiced</button>
                    <button type="button" onClick={() => setStatus('invoiced')} className={`${status==='invoiced' ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto`}>Invoiced</button>
                    <button type="button" onClick={() => setStatus('paid')} className={`${status==='paid' ? 'bg-[#017DB9] text-white' : 'text-[#017DB9]'} px-[12px] py-[8px] text-[12px] text-center w-auto`}>Paid</button>
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
