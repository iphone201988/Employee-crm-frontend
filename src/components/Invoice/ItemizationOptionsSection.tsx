import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ItemizationOptionsSectionProps {
  includeTimeAmount: boolean;
  onIncludeTimeAmountChange: (value: boolean) => void;
  includeValueAmount: boolean;
  onIncludeValueAmountChange: (value: boolean) => void;
  includeBillableRate: boolean;
  onIncludeBillableRateChange: (value: boolean) => void;
}

export const ItemizationOptionsSection = ({
  includeTimeAmount,
  onIncludeTimeAmountChange,
  includeValueAmount,
  onIncludeValueAmountChange,
  includeBillableRate,
  onIncludeBillableRateChange,
}: ItemizationOptionsSectionProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
      <Label className="text-sm font-medium">Options:</Label>
      
      <Button
        size="sm"
        variant={includeTimeAmount ? "default" : "outline"}
        onClick={() => onIncludeTimeAmountChange(!includeTimeAmount)}
        className={includeTimeAmount ? "bg-green-600 hover:bg-green-700" : "border-green-600 text-green-600 hover:bg-green-50"}
      >
        Include time amount
      </Button>

      <Button
        size="sm"
        variant={includeBillableRate ? "default" : "outline"}
        onClick={() => onIncludeBillableRateChange(!includeBillableRate)}
        className={includeBillableRate ? "bg-purple-600 hover:bg-purple-700" : "border-purple-600 text-purple-600 hover:bg-purple-50"}
      >
        Include billable rate
      </Button>

      <Button
        size="sm"
        variant={includeValueAmount ? "default" : "outline"}
        onClick={() => onIncludeValueAmountChange(!includeValueAmount)}
        className={includeValueAmount ? "bg-blue-600 hover:bg-blue-700" : "border-blue-600 text-blue-600 hover:bg-blue-50"}
      >
        Include value amount
      </Button>
    </div>
  );
};