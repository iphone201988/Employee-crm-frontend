import { Switch } from "@/components/ui/switch";
import {X } from 'lucide-react';


const TimeLogPopup = () => {
  return (
    <div className="w-full min-h-[100vh] bg-[#000000a6] absolute z-[9999999] left-0 top-0 flex items-center justify-center p-[16px]">
      <div className="p-[0px] bg-white w-auto ">
        <div className="bg-[#381980] py-[14px] relative">
            <h5 className=" font-semibold text-white text-center">+ Time Log</h5>
            <button className=" bg-[#381980] text-white absolute right-[-35px] top-0 p-[6px] rounded-full max-sm:hidden"><X size={16}/></button>
        </div>
        <div className="bg-[#F5F3F9] py-[20px] px-[14px] flex flex-col gap-[12px]">
          <div className="flex gap-[15px] max-sm:flex-wrap">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Date
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="date" name="" id="" />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Client Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Job Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Job Type
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
          </div>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-[48%] max-sm:w-full" htmlFor="">
                Team Name
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
          <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Description
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
             <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Time Purpose
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
              <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Billable
                <Switch/>
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Duration
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
          
          </div>
          <div className="flex gap-[15px] max-sm:flex-wrap ">
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Billable Rate
                <input className="bg-white border border-[#eee] text-[#666666] px-[12px] py-[8px] rounded-sm" type="text" name="" id="" />
            </label>
            <label className="flex flex-col gap-[3px] text-[14px] font-semibold text-[#381980] w-full" htmlFor="">
                Status
                <div className="bg-white border border-[#eee] text-[#666666] rounded-sm flex">
                    <button className="text-[#017DB9] px-[12px] py-[8px] text-[12px] text-center w-auto">Not Invoiced</button>
                    <button className="bg-[#017DB9] text-white px-[12px] py-[8px] text-[12px] text-center w-auto">Invoiced</button>
                    <button className="text-[#017DB9] px-[12px] py-[8px] text-[12px] text-center w-auto">Paid</button>
                </div>
            </label>
          </div>
        </div>
        <div className="bg-[#381980] py-[14px] px-[14px] flex justify-end gap-[8px]">
           <button className="text-[#017DB9] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-white rounded-md font-semibold">Cancel</button>
           <button className="text-[#fff] px-[14px] py-[8px] text-[14px] text-center w-[90px] bg-[#017DB9] rounded-md font-semibold">Submit</button>
        </div>
      </div>
    </div>
  )
}

export default TimeLogPopup
