import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

type DateRangeType = 'day' | 'week' | 'month' | 'year';

interface WeekNavigationProps {
  onWeekChange?: (weekStart: string, weekEnd: string) => void;
  initialDate?: Date;
}

export function WeekNavigation({ onWeekChange, initialDate }: WeekNavigationProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [rangeType, setRangeType] = useState<DateRangeType>('week');

  const getDateRange = (date: Date, type: DateRangeType) => {
    switch (type) {
      case 'day':
        return { start: date, end: date };
      case 'week':
        return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(date), end: endOfMonth(date) };
      case 'year':
        return { start: startOfYear(date), end: endOfYear(date) };
      default:
        return { start: date, end: date };
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate = currentDate;
    
    switch (rangeType) {
      case 'day':
        newDate = direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1);
        break;
      case 'week':
        newDate = direction === 'next' ? addWeeks(currentDate, 1) : addWeeks(currentDate, -1);
        break;
      case 'month':
        newDate = direction === 'next' ? addMonths(currentDate, 1) : addMonths(currentDate, -1);
        break;
      case 'year':
        newDate = direction === 'next' ? addYears(currentDate, 1) : addYears(currentDate, -1);
        break;
    }
    
    setCurrentDate(newDate);
  };

  // Call onWeekChange when date changes
  useEffect(() => {
    if (onWeekChange && rangeType === 'week') {
      const { start, end } = getDateRange(currentDate, rangeType);
      onWeekChange(start.toISOString(), end.toISOString());
    }
  }, [currentDate, rangeType, onWeekChange]);

  const { start, end } = getDateRange(currentDate, rangeType);
  
  const formatDateRange = () => {
    if (rangeType === 'day') {
      return format(start, 'PPP');
    } else if (rangeType === 'year') {
      return format(start, 'yyyy');
    } else {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {/* Simple text button design matching the UI */}
        <button
          onClick={() => setRangeType('day')}
          className={`px-3 py-1 text-sm transition-colors ${
            rangeType === 'day'
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setRangeType('week')}
          className={`px-3 py-1 text-sm transition-colors ${
            rangeType === 'week'
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setRangeType('month')}
          className={`px-3 py-1 text-sm transition-colors ${
            rangeType === 'month'
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setRangeType('year')}
          className={`px-3 py-1 text-sm transition-colors ${
            rangeType === 'year'
              ? 'text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Yearly
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigateDate('prev')}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <span className="font-medium min-w-0 whitespace-nowrap">
          {formatDateRange()}
        </span>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigateDate('next')}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}