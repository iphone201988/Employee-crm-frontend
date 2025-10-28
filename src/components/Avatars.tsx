import { useEffect, useState } from "react";
import { useLazyGetTabAccessQuery } from "@/store/authApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TimeLogPopup from './TimeLogPopup';
import AddClient from '@/components/client/AddClient';
import { JobForm } from '@/components/JobForm';
import { ExpenseFormDialog } from './ExpenseFormDialog';

interface AvatarsProps {
  activeTab: string;
  title: string;
}

const Avatars = ({ activeTab, title }: AvatarsProps) => {
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery();
  const [showTimeLogPopup, setShowTimeLogPopup] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [showExpenseTypeDialog, setShowExpenseTypeDialog] = useState(false);
  const [showAddClientExpense, setShowAddClientExpense] = useState(false);
  const [showAddTeamExpense, setShowAddTeamExpense] = useState(false);

  useEffect(() => {
    if (activeTab) {
      getTabAccess(activeTab).unwrap();
    }
  }, [activeTab, getTabAccess]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {title}
        </h1>
        <div className="flex -space-x-2 overflow-x-auto pb-2 sm:pb-0">
          <TooltipProvider>
            {currentTabsUsers?.result &&
              currentTabsUsers.result.length > 0 &&
              currentTabsUsers.result.map((user: any, index) =>
                user?.role === "company" ? (
                  //   <div
                  //     key={user?.id || index}
                  //     className="flex items-center space-x-4 px-2 py-1 rounded-lg bg-gray-200 shadow-md"
                  //   >
                  //     <p className="text-lg sm:text-xl font-semibold text-foreground mr-6">{user?.name}</p>
                  //   </div>
                  <></>
                ) : (
                  <Tooltip key={user?.id || index} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Avatar className="border-2 border-background w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full">
                        <AvatarImage
                          src={
                            import.meta.env.VITE_BACKEND_BASE_URL +
                            user?.avatarUrl
                          }
                          className="rounded-full"
                        />
                        <AvatarFallback className="text-xs rounded-full bg-gray-400">
                          {user?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user?.name}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              )}
          </TooltipProvider>
        </div>
      </div>
      {/* <div className="bg-[#017DB9] pr-2 rounded">
        <select name="" id="" className="bg-[#017DB9] text-white p-[8px] rounded-[4px] font-semibold">
        <option value="">Create</option>
        <option value="">Time Log</option>
        <option value="">Client</option>
        <option value="">Job</option>
        <option value="">Expense</option>
      </select>
    </div> */}

     <div className="custom-dn">
        <Select onValueChange={(v) => {
          if (v === '1') setShowTimeLogPopup(true);
          if (v === '2') setShowAddClient(true);
          if (v === '3') setShowAddJob(true);
          if (v === '4') setShowExpenseTypeDialog(true);
        }}> 
                    <SelectTrigger className="bg-[#017DB9] w-[120px] text-[16px] text-white py-[8px] px-[12px] rounded-[4px] flex items-center gap-[4px] font-semibold h-auto">
                      <SelectValue placeholder="Create" />
                    </SelectTrigger>
                    <SelectContent className='sel-custom-dp bg-[#381980] text-white [&_div:focus]:bg-[#fff] [&_div:focus]:text-[#381980]'>
                      {/* <SelectItem value="all-clients">Create</SelectItem> */}
                      <SelectItem value="1" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Time Log</SelectItem>
                      <SelectItem value="2" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Client</SelectItem>
                      <SelectItem value="3" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Job</SelectItem>
                      <SelectItem value="4" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Expense</SelectItem>
                    </SelectContent>
                  </Select>
     </div>

     {/* Time Log Popup (render directly like in AllTimeLogsTab) */}
     {showTimeLogPopup && (
       <TimeLogPopup onClose={() => setShowTimeLogPopup(false)} />
     )}

     {/* Add Client Popup (reusing Clients page component) */}
     <AddClient dialogOpen={showAddClient} setDialogOpen={setShowAddClient} />

     {/* Add Job Popup (reuse JobForm inside a dialog) */}
     <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
       <DialogContent className="max-w-2xl">
         <DialogHeader>
           <DialogTitle>Add New Job</DialogTitle>
         </DialogHeader>
         <JobForm job={null} onSubmit={() => {}} onCancel={() => setShowAddJob(false)} />
       </DialogContent>
     </Dialog>

     {/* Expense Type Selection Dialog */}
     <Dialog open={showExpenseTypeDialog} onOpenChange={setShowExpenseTypeDialog}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Select Expense Type</DialogTitle>
         </DialogHeader>
         <div className="space-y-3">
           <button
             onClick={() => {
               setShowExpenseTypeDialog(false);
               setShowAddClientExpense(true);
             }}
             className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
           >
             <div className="font-semibold text-lg">Client Expense</div>
             <div className="text-sm text-gray-600">Create an expense for a client</div>
           </button>
           <button
             onClick={() => {
               setShowExpenseTypeDialog(false);
               setShowAddTeamExpense(true);
             }}
             className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
           >
             <div className="font-semibold text-lg">Team Expense</div>
             <div className="text-sm text-gray-600">Create an expense for a team member</div>
           </button>
         </div>
       </DialogContent>
     </Dialog>

     {/* Client Expense Form */}
     <ExpenseFormDialog 
       isOpen={showAddClientExpense} 
       onClose={() => setShowAddClientExpense(false)} 
       expenseType="client" 
     />

     {/* Team Expense Form */}
     <ExpenseFormDialog 
       isOpen={showAddTeamExpense} 
       onClose={() => setShowAddTeamExpense(false)} 
       expenseType="team" 
     />
    </div>
  );
};

export default Avatars;
