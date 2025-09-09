import React from 'react';
import { formatHours, formatMoney } from '@/utils/timeTabUtils';
import { days, dailyCapacity } from '@/constants/timeTabConstants';

interface TimeTableFooterProps {
  chargeableTotals: number[];
  nonChargeableTotals: number[];
  chargeableMonetaryTotals: number[];
  hideWeekend: boolean;
  showMonetary: boolean;
  visibleCapacity: number[];
}

export const TimeTableFooter: React.FC<TimeTableFooterProps> = ({
  chargeableTotals,
  nonChargeableTotals,
  chargeableMonetaryTotals,
  hideWeekend,
  showMonetary,
  visibleCapacity
}) => {
  return (
    <>
      {/* Billable Hours Row */}
      <tr className="border-t-2 border-gray-400 h-10">
        <td className="border border-gray-300 p-2 text-xs text-right uppercase font-inter" colSpan={7}>
          BILLABLE
        </td>
        {(showMonetary ? chargeableMonetaryTotals : chargeableTotals).slice(0, hideWeekend ? 5 : 7).map((total, index) => (
          <td key={index} className="border border-gray-300 p-2 text-xs text-center font-inter">
            {showMonetary ? formatMoney(total) : formatHours(total)}
          </td>
        ))}
        <td className="border border-gray-300 p-2 text-xs text-center font-inter">
          {showMonetary 
            ? formatMoney(chargeableMonetaryTotals.reduce((sum, total) => sum + total, 0))
            : formatHours(chargeableTotals.reduce((sum, total) => sum + total, 0))
          }
        </td>
      </tr>
      
      {/* Non-Billable Hours Row */}
      <tr className="border-t border-gray-400 h-10">
        <td className="border border-gray-300 p-2 text-xs text-right uppercase font-inter" colSpan={7}>
          NON-BILLABLE
        </td>
        {(showMonetary ? [] : nonChargeableTotals).slice(0, hideWeekend ? 5 : 7).map((total, index) => (
          <td key={index} className="border border-gray-300 p-2 text-xs text-center font-inter">
            {showMonetary ? 'N/A' : formatHours(total)}
          </td>
        ))}
        {showMonetary && (hideWeekend ? Array(5) : Array(7)).fill(0).map((_, index) => (
          <td key={index} className="border border-gray-300 p-2 text-xs text-center font-inter">
            N/A
          </td>
        ))}
        <td className="border border-gray-300 p-2 text-xs text-center font-inter">
          {showMonetary 
            ? 'N/A'
            : formatHours(nonChargeableTotals.reduce((sum, total) => sum + total, 0))
          }
        </td>
      </tr>

      {/* Total Hours Row */}
      <tr className="border-t border-gray-400 h-10">
        <td className="border border-gray-300 p-2 text-xs text-right uppercase font-inter" colSpan={7}>
          LOGGED
        </td>
        {(hideWeekend ? days.slice(0, 5) : days).map((_, index) => {
          const dayTotal = chargeableTotals[index] + nonChargeableTotals[index];
          return (
            <td key={index} className="border border-gray-300 p-2 text-xs text-center font-inter">
              {formatHours(dayTotal)}
            </td>
          );
        })}
        <td className="border border-gray-300 p-2 text-xs text-center font-inter">
          {formatHours(chargeableTotals.reduce((sum, total) => sum + total, 0) + nonChargeableTotals.reduce((sum, total) => sum + total, 0))}
        </td>
      </tr>

      {/* Capacity Row */}
      <tr className="border-t border-gray-400 h-10">
        <td className="border border-gray-300 p-2 text-xs text-right uppercase font-inter" colSpan={7}>
          CAPACITY
        </td>
        {visibleCapacity.map((capacity, index) => (
          <td key={index} className="border border-gray-300 p-2 text-xs text-center font-inter">
            {capacity.toFixed(2)}
          </td>
        ))}
        <td className="border border-gray-300 p-2 text-xs text-center font-inter">
          {visibleCapacity.reduce((sum, cap) => sum + cap, 0).toFixed(2)}
        </td>
      </tr>

      {/* Variance Row */}
      <tr className="border-t border-gray-400 h-10">
        <td className="border border-gray-300 p-2 text-xs text-right uppercase font-inter" colSpan={7}>
          VARIANCE
        </td>
        {(hideWeekend ? days.slice(0, 5) : days).map((_, index) => {
          const capacity = visibleCapacity[index];
          const actual = chargeableTotals[index] + nonChargeableTotals[index];
          const variance = capacity - actual;
          const isOverCapacity = variance < 0;
          const isUnderCapacity = variance > 0;
          
          return (
            <td key={index} className={`border border-gray-300 p-2 text-xs text-center font-inter ${
              isOverCapacity ? 'bg-green-200' : isUnderCapacity ? 'bg-red-200' : ''
            }`}>
              {formatHours(Math.abs(variance))}
            </td>
          );
        })}
        <td className="border border-gray-300 p-2 text-xs text-center font-inter">
          {(() => {
            const totalCapacity = visibleCapacity.reduce((sum, cap) => sum + cap, 0);
            const totalActual = chargeableTotals.reduce((sum, total) => sum + total, 0) + nonChargeableTotals.reduce((sum, total) => sum + total, 0);
            const totalVariance = totalCapacity - totalActual;
            const isOverCapacity = totalVariance < 0;
            const isUnderCapacity = totalVariance > 0;
            
            return (
              <span className={`${isOverCapacity ? 'text-green-600' : isUnderCapacity ? 'text-red-600' : ''}`}>
                {formatHours(Math.abs(totalVariance))}
              </span>
            );
          })()}
        </td>
      </tr>
    </>
  );
};