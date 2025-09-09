import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Info } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  yearlySalary: number;
  billableRate: number;
  billableHoursLogged: number;
  nonBillableHours: number;
  wroteOffHours: number;
}

const TeamPerformanceTab = () => {
  const [additionalHolidays, setAdditionalHolidays] = useState(0);
  
  // Sample data - in real app this would come from your data source
  const teamMembers: TeamMember[] = [
    { id: '1', name: 'John Smith', yearlySalary: 60000, billableRate: 125, billableHoursLogged: 1200, nonBillableHours: 80, wroteOffHours: 50 },
    { id: '2', name: 'Sarah Johnson', yearlySalary: 55000, billableRate: 115, billableHoursLogged: 1100, nonBillableHours: 70, wroteOffHours: 40 },
    { id: '3', name: 'Mike Wilson', yearlySalary: 50000, billableRate: 100, billableHoursLogged: 1000, nonBillableHours: 90, wroteOffHours: 30 },
    { id: '4', name: 'Emma Davis', yearlySalary: 65000, billableRate: 130, billableHoursLogged: 1300, nonBillableHours: 60, wroteOffHours: 60 },
  ];

  // Constants
  const WORKING_DAYS_PER_YEAR = 261; // Typical working days in a year (365 - 104 weekend days)
  const BANK_HOLIDAYS = 11;
  const STANDARD_HOLIDAYS = 20;
  const HOURS_PER_DAY = 8;

  const calculateMetrics = (member: TeamMember) => {
    const weeklyCost = member.yearlySalary / 52;
    
    // Calculate available working days
    const totalHolidayDays = BANK_HOLIDAYS + STANDARD_HOLIDAYS + additionalHolidays;
    const availableWorkingDays = WORKING_DAYS_PER_YEAR - totalHolidayDays;
    const totalCapacityHours = availableWorkingDays * HOURS_PER_DAY;
    
    // Calculate billable time metrics
    const billableTimeLeft = Math.max(0, totalCapacityHours - member.billableHoursLogged - member.nonBillableHours - member.wroteOffHours);
    const utilizationRate = (member.billableHoursLogged / totalCapacityHours) * 100;
    
    // Calculate financial metrics
    const totalRevenue = member.billableHoursLogged * member.billableRate;
    const wroteOffValue = member.wroteOffHours * member.billableRate;
    const nonBillableValue = member.nonBillableHours * member.billableRate;
    const wroteOffPercentage = (member.wroteOffHours / totalCapacityHours) * 100;
    const nonBillablePercentage = (member.nonBillableHours / totalCapacityHours) * 100;
    
    // Updated profit calculation: team hourly rate x capacity - billable value - wrote off value
    const teamHourlyRate = member.yearlySalary / (availableWorkingDays * HOURS_PER_DAY);
    const potentialRevenue = teamHourlyRate * totalCapacityHours;
    const profitContribution = potentialRevenue - totalRevenue - wroteOffValue;
    
    return {
      weeklyCost,
      totalCapacityHours,
      billableTimeLeft,
      utilizationRate,
      totalRevenue,
      wroteOffValue,
      wroteOffPercentage,
      nonBillableValue,
      nonBillablePercentage,
      profitContribution,
      teamHourlyRate,
      potentialRevenue
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Team Performance</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Holiday Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Holiday Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bank Holidays: {BANK_HOLIDAYS} days (fixed)</Label>
              </div>
              <div>
                <Label>Standard Holidays: {STANDARD_HOLIDAYS} days (fixed)</Label>
              </div>
              <div>
                <Label htmlFor="additional-holidays">Additional Holidays</Label>
                <Input
                  id="additional-holidays"
                  type="number"
                  value={additionalHolidays}
                  onChange={(e) => setAdditionalHolidays(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Total Holiday Days: {BANK_HOLIDAYS + STANDARD_HOLIDAYS + additionalHolidays}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Logged</TableHead>
                  <TableHead className="text-center">Billable</TableHead>
                  <TableHead className="text-center">Non-Billable</TableHead>
                  <TableHead className="text-center">Wrote Off</TableHead>
                  <TableHead className="text-right">Resource Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const metrics = calculateMetrics(member);
                  const loggedHours = member.billableHoursLogged + member.nonBillableHours + member.wroteOffHours;
                  const loggedPercentage = (loggedHours / metrics.totalCapacityHours) * 100;
                  const billablePercentage = (member.billableHoursLogged / metrics.totalCapacityHours) * 100;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {member.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{metrics.totalCapacityHours.toFixed(0)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{loggedHours.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">{loggedPercentage.toFixed(1)}%</div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(loggedPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{member.billableHoursLogged}</div>
                          <div className="text-xs text-muted-foreground">{billablePercentage.toFixed(1)}%</div>
                          <div className="text-xs text-green-600 font-medium">€{metrics.totalRevenue.toLocaleString()}</div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${Math.min(billablePercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{member.nonBillableHours}</div>
                          <div className="text-xs text-muted-foreground">{metrics.nonBillablePercentage.toFixed(1)}%</div>
                          <div className="flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{member.wroteOffHours}</div>
                          <div className="text-xs text-muted-foreground">{metrics.wroteOffPercentage.toFixed(1)}%</div>
                          <div className="flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium text-red-600">€{member.yearlySalary.toLocaleString()}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`text-sm font-medium ${metrics.profitContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            €{metrics.profitContribution.toLocaleString()}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Profit Breakdown - {member.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Team Hourly Rate</Label>
                                    <p className="font-medium">€{metrics.teamHourlyRate.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Total Capacity Hours</Label>
                                    <p className="font-medium">{metrics.totalCapacityHours}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Potential Revenue</Label>
                                    <p className="font-medium text-green-600">€{metrics.potentialRevenue.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Billable Revenue</Label>
                                    <p className="font-medium text-red-600">-€{metrics.totalRevenue.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Wrote Off Value</Label>
                                    <p className="font-medium text-red-600">-€{metrics.wroteOffValue.toLocaleString()}</p>
                                  </div>
                                  <div className="col-span-2 pt-2 border-t">
                                    <Label className="text-sm text-muted-foreground">Net Profit</Label>
                                    <p className={`text-lg font-bold ${metrics.profitContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      €{metrics.profitContribution.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Formula: (€{metrics.teamHourlyRate.toFixed(2)} × {metrics.totalCapacityHours}) - €{metrics.totalRevenue.toLocaleString()} - €{metrics.wroteOffValue.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Team Salary Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              €{teamMembers.reduce((sum, member) => sum + member.yearlySalary, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              €{teamMembers.reduce((sum, member) => {
                const metrics = calculateMetrics(member);
                return sum + metrics.totalRevenue;
              }, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Profit Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              €{teamMembers.reduce((sum, member) => {
                const metrics = calculateMetrics(member);
                return sum + metrics.profitContribution;
              }, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamPerformanceTab;