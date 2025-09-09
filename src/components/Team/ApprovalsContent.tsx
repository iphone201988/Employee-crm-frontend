import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit3, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { TEAM_MEMBER_NAMES, DEFAULT_SERVICE_RATES } from '@/constants/teamConstants';
import { getProfileImage, getUserInitials } from '@/utils/profiles';
import AddTeamMemberDialog from '../AddTeamMemberDialog';
import CustomTabs from '../Tabs';

  const ApprovalsContent = () => {
    const [permissionStates, setPermissionStates] = useState<{ [key: string]: { [key: string]: boolean } }>(() => {
      return TEAM_MEMBER_NAMES.reduce((acc, member) => {
        acc[member] = {
          'Approve Timesheets': Math.random() > 0.5,
          'Edit Services': Math.random() > 0.5,
          'Edit Job Builder': Math.random() > 0.5,
          'Edit Job Templates': Math.random() > 0.5,
        };
        return acc;
      }, {} as { [key: string]: { [key: string]: boolean } });
    });

    const handlePermissionChange = (member: string, permission: string, checked: boolean) => {
      setPermissionStates(prev => ({
        ...prev,
        [member]: {
          ...prev[member],
          [permission]: checked
        }
      }));
    };

    const handleSelectAllForMember = (member: string) => {
      const allChecked = Object.values(permissionStates[member] || {}).every(value => value);
      setPermissionStates(prev => ({
        ...prev,
        [member]: {
          'Approve Timesheets': !allChecked,
          'Edit Services': !allChecked,
          'Edit Job Builder': !allChecked,
          'Edit Job Templates': !allChecked,
        }
      }));
    };

    const permissions = ['Approve Timesheets', 'Edit Services', 'Edit Job Builder', 'Edit Job Templates'];

    return (
      <div className="space-y-6">
        <div className="flex justify-end mb-4 pt-4">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Save Changes
          </Button>
        </div>

        <div className="w-full">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px] p-4 font-medium text-base text-left border-r">
                      Team Member
                    </TableHead>
                    {permissions.map((permission) => (
                      <TableHead key={permission} className="p-4 font-medium text-base text-left border-r flex-1">
                        {permission}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TEAM_MEMBER_NAMES.slice(0, 6).map((member) => (
                    <TableRow key={member}>
                      <TableCell className="p-4 border-r">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getProfileImage(member)} alt={member} />
                            <AvatarFallback className="text-xs">{getUserInitials(member)}</AvatarFallback>
                          </Avatar>
                          <span className="text-base">{member}</span>
                          <Checkbox
                            checked={Object.values(permissionStates[member] || {}).every(value => value)}
                            onCheckedChange={() => handleSelectAllForMember(member)}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableCell>
                      {permissions.map((permission) => (
                        <TableCell key={permission} className="p-4 border-r">
                          <div className="flex justify-start">
                            <Checkbox
                              id={`${member}-${permission}`}
                              checked={permissionStates[member]?.[permission] || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(member, permission, !!checked)
                              }
                              className="h-4 w-4"
                            />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

export default ApprovalsContent