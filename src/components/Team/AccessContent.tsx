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
const systemFeatures = {
    'Time': {
        features: ['My Timesheet', 'All Timesheets', 'Time Logs']
    },
    'WIP & Debtors': {
        features: ['WIP', 'Aged WIP', 'Invoices', 'Aged Debtors', 'Write Off']
    },
    'Clients': {
        features: ['Client List', 'Client Breakdown']
    },
    'Jobs': {
        features: ['Services', 'Job Templates', 'Job Builder', 'Job List']
    },
    'Expenses': {
        features: ['Client', 'Team']
    },
    'Reports': {
        features: ['Reports']
    },
    'Team': {
        features: ['Team List', 'Rates', 'Permissions', 'Access']
    },
    'Settings': {
        features: ['General', 'Invoicing', 'Tags', 'Client Import', 'Time Logs Import', 'Integrations']
    }
};
const AccessContent = () => {
    const [memberPermissions, setMemberPermissions] = useState<{ [key: string]: { [key: string]: { [key: string]: boolean } } }>(
        TEAM_MEMBER_NAMES.reduce((acc, member) => {
            acc[member] = Object.keys(systemFeatures).reduce((featureAcc, category) => {
                featureAcc[category] = systemFeatures[category as keyof typeof systemFeatures].features.reduce((subAcc, feature) => {
                    subAcc[feature] = Math.random() > 0.3; // Random initial state for demo
                    return subAcc;
                }, {} as { [key: string]: boolean });
                return featureAcc;
            }, {} as { [key: string]: { [key: string]: boolean } });
            return acc;
        }, {} as { [key: string]: { [key: string]: { [key: string]: boolean } } })
    );

    const handlePermissionChange = (member: string, category: string, feature: string, checked: boolean) => {
        setMemberPermissions(prev => ({
            ...prev,
            [member]: {
                ...prev[member],
                [category]: {
                    ...prev[member][category],
                    [feature]: checked
                }
            }
        }));
    };

    const handleSelectAllForMember = (member: string) => {
        const allChecked = Object.keys(systemFeatures).every(category =>
            systemFeatures[category as keyof typeof systemFeatures].features.every(feature =>
                memberPermissions[member]?.[category]?.[feature]
            )
        );

        setMemberPermissions(prev => ({
            ...prev,
            [member]: Object.keys(systemFeatures).reduce((categoryAcc, category) => {
                categoryAcc[category] = systemFeatures[category as keyof typeof systemFeatures].features.reduce((featureAcc, feature) => {
                    featureAcc[feature] = !allChecked;
                    return featureAcc;
                }, {} as { [key: string]: boolean });
                return categoryAcc;
            }, {} as { [key: string]: { [key: string]: boolean } })
        }));
    };

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
                                    <TableHead className="w-[200px] p-4 font-medium text-base text-left border-r">
                                        Team Member
                                    </TableHead>
                                    {Object.keys(systemFeatures).map((category) => (
                                        <TableHead key={category} className="p-4 font-medium text-base text-left border-r">
                                            {category}
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
                                                    checked={Object.keys(systemFeatures).every(category =>
                                                        systemFeatures[category as keyof typeof systemFeatures].features.every(feature =>
                                                            memberPermissions[member]?.[category]?.[feature]
                                                        )
                                                    )}
                                                    onCheckedChange={() => handleSelectAllForMember(member)}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                        </TableCell>
                                        {Object.keys(systemFeatures).map((category) => (
                                            <TableCell key={category} className="p-4 border-r">
                                                <div className="space-y-2">
                                                    {systemFeatures[category as keyof typeof systemFeatures].features.map((feature) => (
                                                        <div key={feature} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`${member}-${category}-${feature}`}
                                                                checked={memberPermissions[member]?.[category]?.[feature] || false}
                                                                onCheckedChange={(checked) =>
                                                                    handlePermissionChange(member, category, feature, !!checked)
                                                                }
                                                                className="h-4 w-4"
                                                            />
                                                            <Label
                                                                htmlFor={`${member}-${category}-${feature}`}
                                                                className="text-sm cursor-pointer flex-1 font-normal"
                                                            >
                                                                {feature}
                                                            </Label>
                                                        </div>
                                                    ))}
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

export default AccessContent