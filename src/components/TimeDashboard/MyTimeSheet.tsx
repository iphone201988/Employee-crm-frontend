
import { useState } from "react";
import { Search, Filter, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, RotateCcw, RefreshCw, ArrowLeft, Plus, X, Trash2, Edit2 } from "lucide-react";
import { StatusBadge, FilterBadge } from "@/components/StatusBadge";
import { WeekNavigation } from "@/components/WeekNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { DashboardCard, DashboardGrid } from "@/components/ui/dashboard-card";

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
export const MyTimeSheet = () => {
    const [hideWeekend, setHideWeekend] = useState(false);
    const clients = ["John Kelly", "David Owens", "Jakob Rogers", "Mary Duffy"];
    const jobs = ["VAT (01/01/2025 - 28/02/2025)", "Annual Returns - 2024", "Payroll - W5 2025", "Audit - 2024"];
    const categories = ["Client Work", "Admin", "Training", "Meeting"];
    const rates = ["€100.00", "€75.00", "€50.00", "€125.00"];
    const [timesheetSortField, setTimesheetSortField] = useState<'ref' | 'client' | 'job' | 'category' | 'description' | 'rate' | null>(null);
    const [timesheetSortDirection, setTimesheetSortDirection] = useState<'asc' | 'desc' | null>(null);
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
    const handleTimesheetSort = (field: 'ref' | 'client' | 'job' | 'category' | 'description' | 'rate') => {
        if (timesheetSortField === field) {
            if (timesheetSortDirection === 'asc') {
                setTimesheetSortDirection('desc');
            } else if (timesheetSortDirection === 'desc') {
                setTimesheetSortField(null);
                setTimesheetSortDirection(null);
            } else {
                setTimesheetSortDirection('asc');
            }
        } else {
            setTimesheetSortField(field);
            setTimesheetSortDirection('asc');
        }
    };

    const getTimesheetSortIcon = (field: 'ref' | 'client' | 'job' | 'category' | 'description' | 'rate') => {
        if (timesheetSortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-50" />;
        if (timesheetSortDirection === 'asc') return <ArrowUp className="w-3 h-3" />;
        if (timesheetSortDirection === 'desc') return <ArrowDown className="w-3 h-3" />;
        return <ArrowUpDown className="w-3 h-3 opacity-50" />;
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
    const formatHours = (hours: number) => {
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };
    const totals = calculateTotals();
    return (
        <div className="space-y-6">
            {/* Header with Profile and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-card rounded-lg border gap-4">
                <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                        <AvatarImage src="/lovable-uploads/69927594-4747-4d86-a60e-64c607e67d1f.png" />
                        <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">John Smith</h2>
                    </div>
                </div>
                <div className="flex items-center justify-center flex-1">
                    <p className="text-sm sm:text-base text-muted-foreground font-medium text-center sm:text-left">23/06/2025 to 29/06/2025 - Week 26</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 flex-1 sm:flex-none text-sm" onClick={() => {
                        alert('Timesheet submitted for approval!');
                    }}>
                        Submit for Approval
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <DashboardGrid columns={4}>
                <DashboardCard
                    title="Billable"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.billable.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.billable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Non-Billable"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.nonBillable.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({totals.logged.total > 0 ? (totals.nonBillable.total / totals.logged.total * 100).toFixed(1) : 0}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Total Logged"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(totals.logged.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({(totals.logged.total / 40 * 100).toFixed(1)}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
                <DashboardCard
                    title="Variance"
                    value={
                        <div className="flex items-center gap-2">
                            <span>{formatHours(40 - totals.logged.total)}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                                ({((40 - totals.logged.total) / 40 * 100).toFixed(1)}%)
                            </span>
                        </div>
                    }
                    valueColor="text-[#381980]"
                />
            </DashboardGrid>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 h-9 text-sm">
                        Approve
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 h-9 text-sm">
                        Reject
                    </Button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="text-sm text-muted-foreground">Hide Weekend</span>
                        <Switch checked={hideWeekend} onCheckedChange={setHideWeekend} />
                    </div>
                    <Button variant="outline" className="flex items-center justify-center gap-2 text-primary border-primary hover:bg-primary/10 h-9 text-sm" onClick={() => {
                        const newId = Math.max(...timesheetRows.map(r => r.id)) + 1;
                        const generateClientRef = (clientName: string) => {
                            const firstThreeLetters = clientName.substring(0, 3).toUpperCase();
                            const year = new Date().getFullYear().toString().slice(-2);
                            return `${firstThreeLetters}-${year}`;
                        };
                        setTimesheetRows([...timesheetRows, {
                            id: newId,
                            ref: generateClientRef(clients[0]),
                            client: clients[0],
                            job: jobs[0],
                            category: categories[0],
                            description: "",
                            billable: true,
                            rate: rates[0],
                            hours: {
                                mon: 0,
                                tue: 0,
                                wed: 0,
                                thu: 0,
                                fri: 0,
                                sat: 0,
                                sun: 0
                            }
                        }]);
                    }}>
                        <Plus className="w-4 h-4" />
                        New Row
                    </Button>
                </div>
            </div>

            {/* Detailed Timesheet Table */}
            <div className="bg-card rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('ref')}>
                                        <span className="hidden sm:inline">CLIENT REF</span>
                                        <span className="sm:hidden">REF</span>
                                        {getTimesheetSortIcon('ref')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-24 sm:w-32">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('client')}>
                                        <span className="hidden sm:inline">CLIENT NAME</span>
                                        <span className="sm:hidden">CLIENT</span>
                                        {getTimesheetSortIcon('client')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-32 sm:w-40">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('job')}>
                                        <span className="hidden sm:inline">JOB NAME</span>
                                        <span className="sm:hidden">JOB</span>
                                        {getTimesheetSortIcon('job')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-20 sm:w-24">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('category')}>
                                        <span className="hidden sm:inline">CATEGORY</span>
                                        <span className="sm:hidden">CAT</span>
                                        {getTimesheetSortIcon('category')}
                                    </button>
                                </th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-32 sm:w-48">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('description')}>
                                        <span className="hidden sm:inline">DESCRIPTION</span>
                                        <span className="sm:hidden">DESC</span>
                                        {getTimesheetSortIcon('description')}
                                    </button>
                                </th>
                                <th className="text-center px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-16 sm:w-20">BILLABLE</th>
                                <th className="text-left px-2 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">
                                    <button className="flex items-center gap-1 sm:gap-2 hover:text-foreground transition-colors" onClick={() => handleTimesheetSort('rate')}>
                                        RATE
                                        {getTimesheetSortIcon('rate')}
                                    </button>
                                </th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">MON 23</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">TUE 24</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">WED 25</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">THU 26</th>
                                <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">FRI 27</th>
                                {!hideWeekend && <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">SAT 28</th>}
                                {!hideWeekend && <th className="text-center px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-12 sm:w-16">SUN 29</th>}
                                <th className="text-right px-1 sm:px-3 py-2 text-xs font-medium text-muted-foreground w-8 sm:w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {timesheetRows.sort((a, b) => {
                                if (!timesheetSortField || !timesheetSortDirection) return 0;
                                let aValue = a[timesheetSortField];
                                let bValue = b[timesheetSortField];

                                if (typeof aValue === 'string' && typeof bValue === 'string') {
                                    aValue = aValue.toLowerCase();
                                    bValue = bValue.toLowerCase();
                                }

                                if (timesheetSortDirection === 'asc') {
                                    return aValue > bValue ? 1 : -1;
                                } else {
                                    return aValue < bValue ? 1 : -1;
                                }
                            }).map(row => <tr key={row.id} className="border-t border-border hover:bg-muted/25">
                                <td className="px-3 py-2 text-sm text-left text-muted-foreground">{row.ref}</td>
                                <td className="px-3 py-2 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start">
                                                {row.client} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {clients.map(client => <DropdownMenuItem key={client} onClick={() => {
                                                const generateClientRef = (clientName: string) => {
                                                    const firstThreeLetters = clientName.substring(0, 3).toUpperCase();
                                                    const year = new Date().getFullYear().toString().slice(-2);
                                                    return `${firstThreeLetters}-${year}`;
                                                };
                                                setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                    ...r,
                                                    client,
                                                    ref: generateClientRef(client)
                                                } : r));
                                            }}>
                                                {client}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal w-full justify-start">
                                                {row.job} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {jobs.map(job => <DropdownMenuItem key={job} onClick={() => {
                                                setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                    ...r,
                                                    job
                                                } : r));
                                            }}>
                                                {job}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal">
                                                <span className={`px-2 py-1 text-xs rounded whitespace-nowrap flex items-center ${row.category === 'Client Work' ? 'bg-blue-100 text-blue-800' : row.category === 'Admin' ? 'bg-green-100 text-green-800' : row.category === 'Training' ? 'bg-orange-100 text-orange-800' : row.category === 'Meeting' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {row.category} <ChevronDown className="ml-1 w-3 h-3" />
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {categories.map(category => <DropdownMenuItem key={category} onClick={() => {
                                                setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                    ...r,
                                                    category
                                                } : r));
                                            }}>
                                                {category}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    <Input value={row.description} onChange={e => {
                                        setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                            ...r,
                                            description: e.target.value
                                        } : r));
                                    }} className="border border-input p-1 h-8 bg-background text-sm rounded" placeholder="Add description..." />
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <Switch checked={row.billable} onCheckedChange={checked => {
                                        setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                            ...r,
                                            billable: checked
                                        } : r));
                                    }} />
                                </td>
                                <td className="px-3 py-2 text-sm">
                                    {row.billable ? <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-left p-0 h-8 font-normal">
                                                {row.rate} <ChevronDown className="ml-1 w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            {rates.map(rate => <DropdownMenuItem key={rate} onClick={() => {
                                                setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                    ...r,
                                                    rate
                                                } : r));
                                            }}>
                                                {rate}
                                            </DropdownMenuItem>)}
                                        </DropdownMenuContent>
                                    </DropdownMenu> : null}
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.mon === 0 ? "" : formatHours(row.hours.mon)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    mon: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    mon: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    mon: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.tue === 0 ? "" : formatHours(row.hours.tue)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    tue: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    tue: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    tue: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.wed === 0 ? "" : formatHours(row.hours.wed)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    wed: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    wed: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    wed: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.thu === 0 ? "" : formatHours(row.hours.thu)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    thu: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    thu: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    thu: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.fri === 0 ? "" : formatHours(row.hours.fri)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    fri: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    fri: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    fri: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sat === 0 ? "" : formatHours(row.hours.sat)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sat: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sat: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sat: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm">
                                    <Input type="text" value={row.hours.sun === 0 ? "" : formatHours(row.hours.sun)} onChange={e => {
                                        const timeStr = e.target.value;
                                        if (timeStr === "") {
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sun: 0
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                            const value = hours + minutes / 60;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sun: value
                                                }
                                            } : r));
                                        } else if (timeStr.match(/^\d*\.?\d*$/)) {
                                            const value = parseFloat(timeStr) || 0;
                                            setTimesheetRows(rows => rows.map(r => r.id === row.id ? {
                                                ...r,
                                                hours: {
                                                    ...r.hours,
                                                    sun: value
                                                }
                                            } : r));
                                        }
                                    }} placeholder="" className="w-16 text-center border border-input p-1 h-8 bg-background text-sm rounded" />
                                </td>}
                                <td className="px-3 py-2 text-right">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => {
                                        setTimesheetRows(rows => rows.filter(r => r.id !== row.id));
                                    }}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>)}
                        </tbody>
                        {/* Summary rows */}
                        <tbody className="border-t-2 border-border">
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">BILLABLE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.mon)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.tue)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.wed)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.thu)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.fri)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.sat)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.sun)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.billable.total)}</td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">NON BILLABLE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.mon)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.tue)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.wed)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.thu)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.fri)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.sat)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.sun)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.nonBillable.total)}</td>
                            </tr>
                            <tr className="bg-blue-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">LOGGED</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.mon)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.tue)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.wed)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.thu)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.fri)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.sat)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.sun)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(totals.logged.total)}</td>
                            </tr>
                            <tr className="bg-gray-100">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">CAPACITY</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">08:00</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">08:00</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">08:00</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">08:00</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">08:00</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">00:00</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">00:00</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">40:00</td>
                            </tr>
                            <tr className="bg-red-50">
                                <td colSpan={7} className="px-3 py-2 text-sm font-normal text-right">VARIANCE</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(8 - totals.logged.mon)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(8 - totals.logged.tue)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(8 - totals.logged.wed)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(8 - totals.logged.thu)}</td>
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(8 - totals.logged.fri)}</td>
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(0 - totals.logged.sat)}</td>}
                                {!hideWeekend && <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(0 - totals.logged.sun)}</td>}
                                <td className="px-3 py-2 text-center text-sm font-normal">{formatHours(40 - totals.logged.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
