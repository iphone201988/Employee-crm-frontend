import { useEffect } from "react";
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

interface AvatarsProps {
  activeTab: string;
  title: string;
}

const Avatars = ({ activeTab, title }: AvatarsProps) => {
  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery();

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
        <Select> 
                    <SelectTrigger className="w-32 bg-[#017DB9] text-[#fff] font-semibold">
                      <SelectValue placeholder="Create" />
                    </SelectTrigger>
                    <SelectContent className='sel-custom-dp bg-[#381980] text-white'>
                      {/* <SelectItem value="all-clients">Create</SelectItem> */}
                      <SelectItem value="1" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Time Log</SelectItem>
                      <SelectItem value="2" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Client</SelectItem>
                      <SelectItem value="3" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Job</SelectItem>
                      <SelectItem value="4" className="p-2 hover:!bg-[#017DB9] hover:!text-white">Expense</SelectItem>
                    </SelectContent>
                  </Select>
     </div>
    </div>
  );
};

export default Avatars;
