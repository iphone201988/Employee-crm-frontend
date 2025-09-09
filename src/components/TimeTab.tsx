import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTimeTabData } from '@/hooks/useTimeTabData';
import { DashboardCards } from './TimeTab/DashboardCards';
import { TimeTable } from './TimeTab/TimeTable';
import { days, dailyCapacity } from '@/constants/timeTabConstants';

const TimeTab = () => {
  const [currentWeek, setCurrentWeek] = useState(26);
  const [currentDate, setCurrentDate] = useState('23/06/2025 to 29/06/2025');

  const {
    // State
    timeEntries,
    editingCell,
    hideWeekend,
    showMonetary,
    isSubmitted,
    
    // Calculated values
    chargeableTotals,
    nonChargeableTotals,
    chargeableMonetaryTotals,
    totalChargeable,
    totalChargeableMoney,
    grandTotal,
    chargeablePercentage,
    categoryBreakdown,
    
    // Actions
    setHideWeekend,
    setShowMonetary,
    addNewRow,
    removeRow,
    togglePass,
    toggleBillable,
    updateField,
    handleCellClick,
    handleCellBlur,
    approveAll,
    unapproveAll,
    submitForApproval,
    updateWeekData
  } = useTimeTabData(currentWeek);

  const staffMember = 'John Smith';

  const weeks = [
    { week: 25, date: '16/06/2025 to 22/06/2025' },
    { week: 26, date: '23/06/2025 to 29/06/2025' },
    { week: 27, date: '30/06/2025 to 06/07/2025' },
    { week: 28, date: '07/07/2025 to 13/07/2025' },
  ];

  const handlePreviousWeek = () => {
    const currentIndex = weeks.findIndex(w => w.week === currentWeek);
    if (currentIndex > 0) {
      const prevWeek = weeks[currentIndex - 1];
      setCurrentWeek(prevWeek.week);
      setCurrentDate(prevWeek.date);
      updateWeekData(prevWeek.week);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = weeks.findIndex(w => w.week === currentWeek);
    if (currentIndex < weeks.length - 1) {
      const nextWeek = weeks[currentIndex + 1];
      setCurrentWeek(nextWeek.week);
      setCurrentDate(nextWeek.date);
      updateWeekData(nextWeek.week);
    }
  };
  
  const visibleDays = hideWeekend ? days.slice(0, 5) : days;
  const visibleCapacity = hideWeekend ? dailyCapacity.slice(0, 5) : dailyCapacity;

  return (
    <div className="space-y-6 font-['Inter']">
      <Card>
        <CardHeader>
          <div className="space-y-6">
            {/* Single row with all elements aligned */}
            <div className="flex justify-between items-center">
              {/* Staff Member */}
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/2a629138-9746-40f3-ad13-33c9c4d4b180.png" 
                  alt="Profile" 
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="font-medium text-lg">{staffMember}</div>
              </div>
              
              {/* Date Range with Navigation - centered */}
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={handlePreviousWeek}
                  disabled={currentWeek === weeks[0].week}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="font-medium font-inter">{currentDate} - Week {currentWeek}</div>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={handleNextWeek}
                  disabled={currentWeek === weeks[weeks.length - 1].week}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button 
                  onClick={approveAll}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Approve
                </Button>
                <Button 
                  onClick={unapproveAll}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 transition-colors"
                >
                  Reject
                </Button>
              </div>
            </div>
            
            {/* Dashboard Cards */}
            <DashboardCards
              showMonetary={showMonetary}
              visibleCapacity={visibleCapacity}
              totalChargeable={totalChargeable}
              totalChargeableMoney={totalChargeableMoney}
              chargeablePercentage={chargeablePercentage}
              grandTotal={grandTotal}
              categoryBreakdown={categoryBreakdown}
              timeEntries={timeEntries}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/?tab=sheets">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Button 
                onClick={addNewRow}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Row
              </Button>
            </div>
            
            <div className="flex items-center gap-6">
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="hideWeekend" 
                  checked={hideWeekend}
                  onChange={(e) => setHideWeekend(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="hideWeekend" className="text-sm font-inter">Hide Weekend</label>
              </div>
              
              <Button 
                variant="default" 
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={submitForApproval}
                disabled={isSubmitted}
              >
                {isSubmitted ? 'Submitted' : 'Submit for Approval'}
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <TimeTable
              timeEntries={timeEntries}
              editingCell={editingCell}
              hideWeekend={hideWeekend}
              showMonetary={showMonetary}
              visibleDays={visibleDays}
              chargeableTotals={chargeableTotals}
              nonChargeableTotals={nonChargeableTotals}
              chargeableMonetaryTotals={chargeableMonetaryTotals}
              visibleCapacity={visibleCapacity}
              onCellClick={handleCellClick}
              onCellBlur={handleCellBlur}
              onUpdateField={updateField}
              onToggleBillable={toggleBillable}
              onTogglePass={togglePass}
              onRemoveRow={removeRow}
            />
            
            {isSubmitted && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">✓</div>
                    <p className="text-lg font-semibold mb-3">Submitted for Approval</p>
                    <p className="text-sm text-muted-foreground">Your timesheet has been submitted and is now frozen until it is reviewed</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTab;