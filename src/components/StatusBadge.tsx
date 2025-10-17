import { cn } from "@/lib/utils";

type StatusType = "approved" | "review" | "rejected" | "not-submitted" | "Auto Approved";

interface StatusBadgeProps {
  status: StatusType;
  children: React.ReactNode;
}

const statusStyles: Record<StatusType, string> = {
  approved: "bg-green-50 text-green-700 border border-green-200",
  review: "bg-orange-50 text-orange-700 border border-orange-200", 
  rejected: "bg-red-50 text-red-700 border border-red-200",
  "not-submitted": "bg-slate-50 text-slate-700 border border-slate-200",
  "Auto Approved": "bg-green-50 text-green-700 border border-green-200",
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium",
        statusStyles[status]
      )}
    >
      {children}
    </span>
  );
}

export function FilterBadge({ 
  children, 
  count, 
  active = false 
}: { 
  children: React.ReactNode; 
  count: number; 
  active?: boolean; 
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {children}
      <span className="text-xs">{count}</span>
    </button>
  );
}