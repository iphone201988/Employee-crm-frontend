import React from 'react';
import { Button } from "@/components/ui/button";
import { Edit, X } from 'lucide-react';
import { WIPData } from '@/types/wip';
import { useToast } from "@/hooks/use-toast";

interface WIPActionButtonsProps {
  job: WIPData;
  editingId: string | null;
  onEditToggle: (id: string | null) => void;
}

export const WIPActionButtons: React.FC<WIPActionButtonsProps> = ({
  job,
  editingId,
  onEditToggle
}) => {
  const { toast } = useToast();

  const handleInvoiceAction = (actionType: 'invoice' | 'invoice-ready' | 'review') => {
    if (actionType === 'invoice') {
      toast({
        title: "Invoice Generated",
        description: `Invoice created for ${job.clientName} - ${job.jobName}`,
      });
    } else if (actionType === 'invoice-ready') {
      toast({
        title: "Marked as Invoice Ready",
        description: `${job.clientName} - ${job.jobName} is ready for invoicing`,
      });
    } else {
      toast({
        title: "Marked for Review",
        description: `${job.clientName} - ${job.jobName} requires partner review`,
      });
    }
  };

  const getActionButton = () => {
    const actionStyles = {
      'invoice': 'bg-green-600 hover:bg-green-700 text-white',
      'invoice-ready': 'bg-blue-600 hover:bg-blue-700 text-white',
      'review': 'bg-gray-600 hover:bg-gray-700 text-white'
    };
    
    const actionLabels = {
      'invoice': 'Invoice',
      'invoice-ready': 'Invoice Ready',
      'review': 'Review'
    };

    if (job.action === 'invoice' || job.action === 'invoice-ready') {
      return (
        <Button 
          size="sm" 
          className={actionStyles[job.action]}
          onClick={() => handleInvoiceAction(job.action)}
        >
          {actionLabels[job.action]}
        </Button>
      );
    }

    return (
      <Button 
        size="sm" 
        className={actionStyles[job.action]}
        onClick={() => handleInvoiceAction(job.action)}
      >
        {actionLabels[job.action]}
      </Button>
    );
  };

  return (
    <div className="flex gap-2">
      {getActionButton()}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEditToggle(editingId === job.id ? null : job.id)}
      >
        {editingId === job.id ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
      </Button>
    </div>
  );
};