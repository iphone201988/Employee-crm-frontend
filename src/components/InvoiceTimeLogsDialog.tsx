import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Mail } from 'lucide-react';

interface TimeLogEntry {
  date: string;
  teamMember: string;
  client: string;
  job: string;
  jobType: string;
  category: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  billable: string;
}

interface InvoiceTimeLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  client: string;
  invoiceTotal: number;
  timeLogsCount: number;
  timeLogs: TimeLogEntry[];
}

const InvoiceTimeLogsDialog = ({ 
  open, 
  onOpenChange, 
  invoiceNumber, 
  client, 
  invoiceTotal, 
  timeLogsCount, 
  timeLogs 
}: InvoiceTimeLogsDialogProps) => {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  const handleEmailClick = () => {
    setShowEmailInput(!showEmailInput);
  };

  const handleSendEmail = () => {
    if (emailAddress) {
      const subject = `Time Logs for Invoice ${invoiceNumber}`;
      const body = `Please find attached the time logs breakdown for Invoice ${invoiceNumber} for ${client}.`;
      window.open(`mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      setShowEmailInput(false);
      setEmailAddress('');
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'Client work': 'bg-blue-100 text-blue-800',
      'Meeting': 'bg-green-100 text-green-800',
      'Admin': 'bg-gray-100 text-gray-800',
      'Travel': 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={`text-xs ${categoryColors[category] || 'bg-gray-100 text-gray-800'}`}>
        {category}
      </Badge>
    );
  };

  const getBillableBadge = (billable: string) => {
    if (billable === 'Yes') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Yes</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800 text-xs">No</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold">
                Time Logs for Invoice {invoiceNumber}
              </DialogTitle>
              <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Client:</span> {client}
                </div>
                <div>
                  <span className="font-medium">Invoice Total:</span> €{invoiceTotal.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Time Logs Count:</span> {timeLogsCount}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEmailClick}
                className="h-8 px-3"
              >
                <Mail className="w-4 h-4 mr-1" />
                Email To Client
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {showEmailInput && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="email"
                placeholder="Enter client email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <Button
                size="sm"
                onClick={handleSendEmail}
                disabled={!emailAddress}
                className="h-8 px-3"
              >
                Send
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmailInput(false)}
                className="h-8 px-3"
              >
                Cancel
              </Button>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-white border-b">
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600 border-r">DATE</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">TEAM MEMBER</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">CLIENT</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">JOB</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">JOB TYPE</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">CATEGORY</th>
                  <th className="text-left p-3 font-medium text-gray-600 border-r">DESCRIPTION</th>
                  <th className="text-right p-3 font-medium text-gray-600 border-r">HOURS</th>
                  <th className="text-right p-3 font-medium text-gray-600 border-r">RATE</th>
                  <th className="text-right p-3 font-medium text-gray-600 border-r">AMOUNT</th>
                  <th className="text-center p-3 font-medium text-gray-600">BILLABLE</th>
                </tr>
              </thead>
              <tbody>
                {timeLogs.map((entry, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 border-r">{entry.date}</td>
                    <td className="p-3 border-r">{entry.teamMember}</td>
                    <td className="p-3 border-r">{entry.client}</td>
                    <td className="p-3 border-r">{entry.job}</td>
                    <td className="p-3 border-r">{entry.jobType}</td>
                    <td className="p-3 border-r">{getCategoryBadge(entry.category)}</td>
                    <td className="p-3 border-r">{entry.description}</td>
                    <td className="p-3 text-right border-r">{entry.hours}</td>
                    <td className="p-3 text-right border-r">€{entry.rate.toFixed(2)}</td>
                    <td className="p-3 text-right border-r">€{entry.amount.toFixed(2)}</td>
                    <td className="p-3 text-center">{getBillableBadge(entry.billable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceTimeLogsDialog;