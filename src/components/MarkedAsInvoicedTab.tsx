import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getProfileImage, getUserInitials } from "@/utils/profiles";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface MarkedAsInvoicedTabProps {
  invoicedEntries: any[];
}

const MarkedAsInvoicedTab = ({ invoicedEntries }: MarkedAsInvoicedTabProps) => {
  const formatDuration = (hours: string) => {
    return hours; // Already in 00:00:00 format
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'billable':
        return 'bg-green-100 text-green-800';
      case 'non-billable':
        return 'bg-red-100 text-red-800';
      case 'unknown':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPurposeColor = (purpose: string) => {
    switch (purpose) {
      case 'client work':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'phone call':
        return 'bg-yellow-100 text-yellow-800';
      case 'research':
        return 'bg-indigo-100 text-indigo-800';
      case 'training':
        return 'bg-orange-100 text-orange-800';
      case 'event':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Marked as Invoiced</CardTitle>
          <p className="text-sm text-gray-600">
            Time logs that have been marked for invoicing
          </p>
        </CardHeader>
        <CardContent>
          {invoicedEntries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No time logs marked as invoiced yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Select approved time logs and mark them as invoiced to see them here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Logged</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Rate (€)</TableHead>
                    <TableHead>Amount (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicedEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.client}</TableCell>
                      <TableCell className="font-medium">{entry.jobName}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPurposeColor(entry.purpose)}>
                          {entry.purpose}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={getProfileImage(entry.logged)} alt={entry.logged} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(entry.logged)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{entry.logged}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDuration(entry.duration)}</TableCell>
                      <TableCell>€{entry.rate}</TableCell>
                      <TableCell className="font-medium">€{entry.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkedAsInvoicedTab;