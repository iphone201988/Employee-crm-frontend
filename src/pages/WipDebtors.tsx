import { useEffect, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { usePermissionTabs } from '@/hooks/usePermissionTabs';
type SortField = 'name' | 'department' | 'capacity' | 'logged' | 'variance' | 'submitted';
type SortDirection = 'asc' | 'desc' | null;
import WIPTableTab from "@/components/WIP/WIPTableTab";
import AgedWIPTab from "@/components/AgedWIPTab";
import AgedDebtorsTab from "@/components/AgedDebtorsTab";
import WriteOffMergedTab from "@/components/WriteOffMergedTab";
import InvoiceLogTab from "@/components/InvoiceLogTab";
import CustomTabs from "@/components/Tabs";
import { useGetTabAccessQuery, useLazyGetTabAccessQuery } from "@/store/authApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

const tabs = [{
  id: "WIP",
  label: "WIP"
}, {
  id: "agedWIP",
  label: "Aged WIP"
}, {
  id: "invoices",
  label: "Invoices"
},
{
  id: "agedDebtors",
  label: "Aged Debtors"
},
{
  id: "writeOff",
  label: "Write-off"
}
];
const generateRandomTime = () => {
  const hours = Math.floor(Math.random() * 10) + 30; // 30-39 hours
  const minutes = Math.floor(Math.random() * 60);
  return {
    hours,
    minutes,
    total: hours + minutes / 60
  };
};
const generateVariance = (capacity: number, logged: {
  total: number;
}) => {
  const varianceTotal = capacity - logged.total;
  const hours = Math.floor(Math.abs(varianceTotal));
  const minutes = Math.floor((Math.abs(varianceTotal) - hours) * 60);
  return {
    hours,
    minutes,
    total: varianceTotal
  };
};
const timesheetData = (() => {
  const data = [{
    id: 1,
    name: "Niall Kelly",
    department: "Tax",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "approved" as const,
    notes: 2,
    submitted: "01/01/25",
    avatar: "/lovable-uploads/faf9d4db-b73b-4771-9b8a-fbf1d0e1c69a.png"
  }, {
    id: 2,
    name: "Mary Donavan",
    department: "Payroll",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "review" as const,
    notes: 0,
    submitted: "04/01/25",
    avatar: "/lovable-uploads/4f26d575-4f3c-42d8-a83e-e7a97e2b7e70.png"
  }, {
    id: 3,
    name: "Joanne Carthy",
    department: "Tax",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "rejected" as const,
    notes: 0,
    submitted: "29/02/25",
    avatar: "/lovable-uploads/f713038f-661b-4859-829f-22567834d707.png"
  }, {
    id: 4,
    name: "James Taylor",
    department: "Admin",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "review" as const,
    notes: 1,
    submitted: "04/01/25",
    avatar: "/lovable-uploads/71cb7f14-f958-4960-a6ae-688e313603a5.png"
  }, {
    id: 5,
    name: "Jennifer White",
    department: "Tax",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "approved" as const,
    notes: 2,
    submitted: "01/01/25",
    avatar: "/lovable-uploads/3c214215-2945-4eb0-b253-52de50f12239.png"
  }, {
    id: 6,
    name: "Jessica Hall",
    department: "Management",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "rejected" as const,
    notes: 0,
    submitted: "29/02/25",
    avatar: "/lovable-uploads/c1b6c757-1457-46be-b74b-d870e28417ac.png"
  }, {
    id: 7,
    name: "John Smith",
    department: "Tax",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "not-submitted" as const,
    notes: 0,
    submitted: "-",
    avatar: "/lovable-uploads/69927594-4747-4d86-a60e-64c607e67d1f.png"
  }, {
    id: 8,
    name: "Lisa Anderson",
    department: "Audit",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "approved" as const,
    notes: 3,
    submitted: "04/01/25",
    avatar: "/lovable-uploads/229c8a34-da0e-4b64-bda9-444834d2242b.png"
  }, {
    id: 9,
    name: "Michael Brown",
    department: "Tax",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "not-submitted" as const,
    notes: 0,
    submitted: "-",
    avatar: "/lovable-uploads/c3af3651-3503-4a35-826d-dbf23695fd57.png"
  }, {
    id: 10,
    name: "Sarah Wilson",
    department: "Payroll",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "approved" as const,
    notes: 1,
    submitted: "03/01/25",
    avatar: "/lovable-uploads/f713038f-661b-4859-829f-22567834d707.png"
  }, {
    id: 11,
    name: "David Johnson",
    department: "Audit",
    capacity: 35.00,
    logged: generateRandomTime(),
    status: "review" as const,
    notes: 2,
    submitted: "05/01/25",
    avatar: "/lovable-uploads/229c8a34-da0e-4b64-bda9-444834d2242b.png"
  }];

  // Calculate variance for each item
  return data.map(item => ({
    ...item,
    variance: generateVariance(item.capacity, item.logged)
  }));
})();
const getStatusCounts = (data: typeof timesheetData) => {
  const approved = data.filter(item => item.status === 'approved').length;
  const review = data.filter(item => item.status === 'review').length;
  const rejected = data.filter(item => item.status === 'rejected').length;
  const notSubmitted = data.filter(item => item.status === 'not-submitted').length;
  return {
    total: data.length,
    forReview: review,
    rejected: rejected,
    approved: approved,
    allTimesheets: data.length,
    notSubmitted: notSubmitted
  };
};
export function WipDebtors() {
  const [activeTab, setActiveTab] = useState("");
  const [activeFilter, setActiveFilter] = useState("all-timesheets");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [hideWeekend, setHideWeekend] = useState(false);
  const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
  const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
  const { visibleTabs, isLoading, isError } = usePermissionTabs(tabs);
  const [timesheetRows, setTimesheetRows] = useState([{
    id: 1,
    ref: "JOH-23",
    client: "John Kelly",
    job: "VAT (01/01/2025 - 28/02/2025)",
    category: "Client Work",
    description: "Get info on employees",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0.15,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 2,
    ref: "DAY-22",
    client: "David Owens",
    job: "VAT (01/01/2025 - 28/02/2025)",
    category: "Client Work",
    description: "Phone call to discuss ac...",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0.15,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 3,
    ref: "JAK-21",
    client: "Jakob Rogers",
    job: "Annual Returns - 2024",
    category: "Client Work",
    description: "VAT calculations",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 1.00,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 4,
    ref: "MAR-24",
    client: "Mary Duffy",
    job: "Payroll - W5 2025",
    category: "Client Work",
    description: "Meeting with John",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 1.00,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }, {
    id: 5,
    ref: "DAV-18",
    client: "David Owens",
    job: "Audit - 2024",
    category: "Client Work",
    description: "Get info on employees",
    billable: true,
    rate: "€100.00",
    hours: {
      mon: 0,
      tue: 1.00,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0
    }
  }]);
  const clients = ["John Kelly", "David Owens", "Jakob Rogers", "Mary Duffy"];
  const jobs = ["VAT (01/01/2025 - 28/02/2025)", "Annual Returns - 2024", "Payroll - W5 2025", "Audit - 2024"];
  const categories = ["Client Work", "Admin", "Training", "Meeting"];
  const rates = ["€100.00", "€75.00", "€50.00", "€125.00"];
  const statusCounts = getStatusCounts(timesheetData);



  const [getTabAccess, { data: currentTabsUsers }] = useLazyGetTabAccessQuery()

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
    getTabAccess(activeTab).unwrap();
  }, [visibleTabs, activeTab]);
  // Filter and sort data
  const filteredData = timesheetData.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Department filter
    if (selectedDepartments.length > 0 && !selectedDepartments.includes(item.department)) {
      return false;
    }

    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(item.status)) {
      return false;
    }

    // Badge filter
    if (activeFilter === "not-submitted" && item.status !== "not-submitted") {
      return false;
    }
    if (activeFilter === "review" && item.status !== "review") {
      return false;
    }
    if (activeFilter === "rejected" && item.status !== "rejected") {
      return false;
    }
    if (activeFilter === "approved" && item.status !== "approved") {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle object comparison for logged/variance
    if (typeof aValue === 'object' && aValue !== null && 'total' in aValue) {
      aValue = aValue.total;
    }
    if (typeof bValue === 'object' && bValue !== null && 'total' in bValue) {
      bValue = bValue.total;
    }

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const departments = Array.from(new Set(timesheetData.map(item => item.department)));
  const statuses = ["approved", "review", "rejected", "not-submitted"];
  const formatTime = (timeObj: any) => {
    return `${timeObj.hours.toString().padStart(2, '0')}:${timeObj.minutes.toString().padStart(2, '0')}`;
  };
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  const calculateTotals = () => {
    const billable = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    const nonBillable = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    const logged = {
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0
    };
    timesheetRows.forEach(row => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      days.forEach(day => {
        const hours = row.hours[day] || 0;
        if (row.billable) {
          billable[day] += hours;
        } else {
          nonBillable[day] += hours;
        }
        logged[day] += hours;
      });
    });

    // Calculate totals
    billable.total = Object.values(billable).slice(0, -1).reduce((sum, val) => sum + val, 0);
    nonBillable.total = Object.values(nonBillable).slice(0, -1).reduce((sum, val) => sum + val, 0);
    logged.total = Object.values(logged).slice(0, -1).reduce((sum, val) => sum + val, 0);
    return {
      billable,
      nonBillable,
      logged
    };
  };
  const totals = calculateTotals();
  const formatVariance = (timeObj: any) => {
    const formattedTime = formatTime(timeObj);
    if (timeObj.total < 0) {
      return <span className="text-red-600">-{formattedTime}</span>;
    } else if (timeObj.total > 0) {
      return <span className="text-green-600">+{formattedTime}</span>;
    } else {
      return <span>{formattedTime}</span>;
    }
  };

  const handleWriteOff = (writeOffEntry: any) => {
    // setWriteOffEntries(prev => [...prev, writeOffEntry]);
    // setActiveTab('write-off-report');
  };
  const handleInvoiceCreate = (invoice: any) => {
    // setInvoices(prev => [...prev, invoice]);
    // setActiveTab('invoices');
  };
  return (

    <div className="flex-1 p-6 bg-background">


 <div className="mb-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">WIP & Debtors</h1>
          <div className="flex -space-x-2 overflow-x-auto pb-2 sm:pb-0">
            {/* Wrap the list of avatars in a single TooltipProvider */}
            <TooltipProvider>
              {currentTabsUsers?.result.length > 0 &&
                currentTabsUsers?.result.map((user: any, index) => (
                  <Tooltip key={user?.id || index} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Avatar
                        className="border-2 border-background w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full"
                      // The native `title` attribute is no longer needed
                      >
                        <AvatarImage
                          src={
                            import.meta.env.VITE_BACKEND_BASE_URL + user?.avatarUrl
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
                ))}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CustomTabs tabs={visibleTabs} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
      {activeTab === "WIP" &&
        <WIPTableTab onInvoiceCreate={handleInvoiceCreate} onWriteOff={handleWriteOff} />
      }

      {
        activeTab === "agedWIP" &&
        <AgedWIPTab />
      }
      {
        activeTab === "invoices" &&
        <InvoiceLogTab invoiceEntries={invoices} />
      }
      {
        activeTab == "agedDebtors" && <AgedDebtorsTab />
      }
      {
        activeTab == "writeOff" && <WriteOffMergedTab />
      }

      {activeTab === '' && <div>YOU HAVE NOT ACCESS</div>}


    </div>);
}