import React, { useState } from 'react';
import ClientDetailsDialog from './ClientDetailsDialog';
import {useGetClientQuery} from "@/store/clientApi";
interface ClientNameLinkProps {
  name?: string;
  clientName?: string;
  className?: string;
  ciientId?: string
}

const ClientNameLink = ({ name, clientName, className = "", ciientId }: ClientNameLinkProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: client } = useGetClientQuery(ciientId as string, {
    skip: !ciientId || !isDialogOpen,
    refetchOnMountOrArgChange: false,
  });
  const displayName = name || clientName;

  if (!displayName) {
    return <span className={className}>N/A</span>;
  }

  // Generate mock client data - in a real app this would come from an API
  const generateClientData = (name: string) => {
    const clientRefMap: { [key: string]: string } = {
      'Water Savers Limited': 'WSL-001',
      'Green Gardens Limited': 'GGL-002', 
      'Smith & Associates': 'SAA-003',
      'Brown Enterprises': 'BEN-004',
      'Tech Solutions Inc.': 'TSI-005',
      'Tech Solutions Ltd': 'TSL-005',
      'Financial Advisors Co.': 'FAC-006',
      'Healthcare Systems Ltd.': 'HSL-007',
      'Marine Consulting Ltd.': 'MCL-008',
      'Digital Media Group': 'DMG-009',
      'Construction Pros Ltd.': 'CPL-010',
      'Energy Solutions Corp.': 'ESC-011',
      'Transport & Logistics': 'TAL-012',
      'Hospitality Group plc': 'HGP-013',
      'Marketing Pro': 'MAP-014',
      'Digital Media Co': 'DMC-015',
      'Retail Express': 'REX-016',
      'Construction Pros': 'CPR-017',
      'Finance First': 'FIF-018'
    };

    const customerNumberMap: { [key: string]: string } = {
      'Water Savers Limited': '1234567T',
      'Green Gardens Limited': '2345678U',
      'Smith & Associates': '3456789V',
      'Brown Enterprises': '4567890W',
      'Tech Solutions Inc.': '5678901X',
      'Tech Solutions Ltd': '6789012Y',
      'Financial Advisors Co.': '7890123Z',
      'Healthcare Systems Ltd.': '8901234A',
      'Marine Consulting Ltd.': '9012345B',
      'Digital Media Group': '0123456C',
      'Construction Pros Ltd.': '1234567D',
      'Energy Solutions Corp.': '2345678E',
      'Transport & Logistics': '3456789F',
      'Hospitality Group plc': '4567890G',
      'Marketing Pro': '5678901H',
      'Digital Media Co': '6789012I',
      'Retail Express': '7890123J',
      'Construction Pros': '8901234K',
      'Finance First': '9012345L'
    };

    const addressMap: { [key: string]: string } = {
      'Water Savers Limited': '123 Water Street, Dublin 2',
      'Green Gardens Limited': '456 Garden Lane, Cork',
      'Smith & Associates': '321 Professional Plaza, Limerick',
      'Brown Enterprises': '789 Business Park, Galway',
      'Tech Solutions Inc.': '654 Innovation Hub, Waterford',
      'Tech Solutions Ltd': '987 Tech District, Dublin 4',
      'Financial Advisors Co.': '555 Finance Row, Dublin 1',
      'Healthcare Systems Ltd.': '222 Medical Centre, Cork',
      'Marine Consulting Ltd.': '333 Port Avenue, Dublin 1',
      'Digital Media Group': '444 Creative Quarter, Galway',
      'Construction Pros Ltd.': '777 Industrial Estate, Limerick',
      'Energy Solutions Corp.': '888 Energy Park, Waterford',
      'Transport & Logistics': '999 Logistics Hub, Dublin 12',
      'Hospitality Group plc': '111 Tourism Plaza, Killarney',
      'Marketing Pro': '222 Marketing Square, Cork',
      'Digital Media Co': '333 Digital Way, Dublin 18',
      'Retail Express': '444 Retail Park, Galway',
      'Construction Pros': '555 Builder Street, Limerick',
      'Finance First': '666 Financial District, Dublin 4'
    };

    const contactMap: { [key: string]: string } = {
      'Water Savers Limited': 'John Smith',
      'Green Gardens Limited': 'Sarah Johnson',
      'Smith & Associates': 'Emily Smith',
      'Brown Enterprises': 'Michael Brown',
      'Tech Solutions Inc.': 'David Wilson',
      'Tech Solutions Ltd': 'James Wilson',
      'Financial Advisors Co.': 'Lisa Thompson',
      'Healthcare Systems Ltd.': 'Dr. Marie Kelly',
      'Marine Consulting Ltd.': 'Peter Murphy',
      'Digital Media Group': 'Anna Garcia',
      'Construction Pros Ltd.': 'Tom O\'Brien',
      'Energy Solutions Corp.': 'Paul McCarthy',
      'Transport & Logistics': 'Sean Connolly',
      'Hospitality Group plc': 'Claire O\'Sullivan',
      'Marketing Pro': 'Mark Davis',
      'Digital Media Co': 'Rachel Green',
      'Retail Express': 'Kevin Walsh',
      'Construction Pros': 'Brian Murphy',
      'Finance First': 'Jennifer Lynch'
    };

    const emailMap: { [key: string]: string } = {
      'Water Savers Limited': 'john@watersavers.ie',
      'Green Gardens Limited': 'sarah@greengardens.ie',
      'Smith & Associates': 'emily@smithassociates.ie',
      'Brown Enterprises': 'michael@brownenterprises.ie',
      'Tech Solutions Inc.': 'david@techsolutions.ie',
      'Tech Solutions Ltd': 'james@techsolutionsltd.ie',
      'Financial Advisors Co.': 'lisa@financialadvisors.ie',
      'Healthcare Systems Ltd.': 'marie@healthcaresystems.ie',
      'Marine Consulting Ltd.': 'peter@marineconsulting.ie',
      'Digital Media Group': 'anna@digitalmediagroup.ie',
      'Construction Pros Ltd.': 'tom@constructionpros.ie',
      'Energy Solutions Corp.': 'paul@energysolutions.ie',
      'Transport & Logistics': 'sean@transportlogistics.ie',
      'Hospitality Group plc': 'claire@hospitalitygroup.ie',
      'Marketing Pro': 'mark@marketingpro.ie',
      'Digital Media Co': 'rachel@digitalmedia.ie',
      'Retail Express': 'kevin@retailexpress.ie',
      'Construction Pros': 'brian@constructionpros.ie',
      'Finance First': 'jennifer@financefirst.ie'
    };

    const phoneMap: { [key: string]: string } = {
      'Water Savers Limited': '+353 1 234 5678',
      'Green Gardens Limited': '+353 21 987 6543',
      'Smith & Associates': '+353 61 444 7890',
      'Brown Enterprises': '+353 91 555 0123',
      'Tech Solutions Inc.': '+353 51 222 3456',
      'Tech Solutions Ltd': '+353 1 333 4567',
      'Financial Advisors Co.': '+353 1 777 8901',
      'Healthcare Systems Ltd.': '+353 21 555 6789',
      'Marine Consulting Ltd.': '+353 1 888 9999',
      'Digital Media Group': '+353 91 777 8888',
      'Construction Pros Ltd.': '+353 61 999 0000',
      'Energy Solutions Corp.': '+353 51 111 2222',
      'Transport & Logistics': '+353 1 444 5555',
      'Hospitality Group plc': '+353 64 333 4444',
      'Marketing Pro': '+353 21 666 7777',
      'Digital Media Co': '+353 1 222 3333',
      'Retail Express': '+353 91 888 9999',
      'Construction Pros': '+353 61 111 0000',
      'Finance First': '+353 1 555 6666'
    };

    const clientTypeMap: { [key: string]: string } = {
      'Water Savers Limited': 'Limited Company',
      'Green Gardens Limited': 'Limited Company',
      'Smith & Associates': 'Partnership',
      'Brown Enterprises': 'Sole Trader',
      'Tech Solutions Inc.': 'Limited Company',
      'Tech Solutions Ltd': 'Limited Company',
      'Financial Advisors Co.': 'Limited Company',
      'Healthcare Systems Ltd.': 'Limited Company',
      'Marine Consulting Ltd.': 'Limited Company',
      'Digital Media Group': 'Limited Company',
      'Construction Pros Ltd.': 'Limited Company',
      'Energy Solutions Corp.': 'Limited Company',
      'Transport & Logistics': 'Partnership',
      'Hospitality Group plc': 'Public Limited Company',
      'Marketing Pro': 'Sole Trader',
      'Digital Media Co': 'Limited Company',
      'Retail Express': 'Limited Company',
      'Construction Pros': 'Limited Company',
      'Finance First': 'Limited Company'
    };

    const clientTagsMap: { [key: string]: string[] } = {
      'Water Savers Limited': ['Audit', 'VAT', 'Payroll'],
      'Green Gardens Limited': ['Corporation Tax', 'VAT'],
      'Smith & Associates': ['Income Tax', 'Audit'],
      'Brown Enterprises': ['Sole Trader', 'Income Tax'],
      'Tech Solutions Inc.': ['Corporation Tax', 'VAT', 'PAYE-EMP'],
      'Tech Solutions Ltd': ['Corporation Tax', 'VAT'],
      'Financial Advisors Co.': ['Audit', 'Corporation Tax'],
      'Healthcare Systems Ltd.': ['PAYE-EMP', 'VAT'],
      'Marine Consulting Ltd.': ['Corporation Tax', 'VAT'],
      'Digital Media Group': ['Corporation Tax', 'Income Tax'],
      'Construction Pros Ltd.': ['RCT', 'Corporation Tax'],
      'Energy Solutions Corp.': ['Corporation Tax', 'VAT'],
      'Transport & Logistics': ['VAT', 'DWT'],
      'Hospitality Group plc': ['Corporation Tax', 'VAT', 'PAYE-EMP'],
      'Marketing Pro': ['Income Tax', 'VAT'],
      'Digital Media Co': ['Corporation Tax', 'VAT'],
      'Retail Express': ['Corporation Tax', 'VAT'],
      'Construction Pros': ['RCT', 'Corporation Tax'],
      'Finance First': ['Audit', 'Corporation Tax']
    };

    const taxesMap: { [key: string]: string[] } = {
      'Water Savers Limited': ['VAT', 'PAYE-EMP', 'CT'],
      'Green Gardens Limited': ['CT', 'VAT'],
      'Smith & Associates': ['IT', 'VAT'],
      'Brown Enterprises': ['IT'],
      'Tech Solutions Inc.': ['CT', 'VAT', 'PAYE-EMP'],
      'Tech Solutions Ltd': ['CT', 'VAT'],
      'Financial Advisors Co.': ['CT', 'VAT'],
      'Healthcare Systems Ltd.': ['PAYE-EMP', 'VAT'],
      'Marine Consulting Ltd.': ['CT', 'VAT'],
      'Digital Media Group': ['CT', 'VAT'],
      'Construction Pros Ltd.': ['RCT', 'CT'],
      'Energy Solutions Corp.': ['CT', 'VAT'],
      'Transport & Logistics': ['VAT', 'DWT'],
      'Hospitality Group plc': ['CT', 'VAT', 'PAYE-EMP'],
      'Marketing Pro': ['IT', 'VAT'],
      'Digital Media Co': ['CT', 'VAT'],
      'Retail Express': ['CT', 'VAT'],
      'Construction Pros': ['RCT', 'CT'],
      'Finance First': ['CT', 'VAT']
    };

    return {
      clientRef: clientRefMap[name] || `REF-${name?.charAt(0) || 'X'}${Math.floor(Math.random() * 1000)}`,
      name: name || 'Unknown Client',
      customerNumber: customerNumberMap[name] || `${Math.floor(Math.random() * 9000000) + 1000000}T`,
      clientType: clientTypeMap[name] || 'Limited Company',
      address: addressMap[name] || `${Math.floor(Math.random() * 999) + 1} Business Street, Dublin`,
      contactPerson: contactMap[name] || 'Contact Person',
      email: emailMap[name] || `contact@${(name || 'unknown').toLowerCase().replace(/[^a-z]/g, '')}.ie`,
      phone: phoneMap[name] || `+353 1 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
      takeOnDate: '2024-01-15',
      clientTags: clientTagsMap[name] || ['General'],
      taxes: taxesMap[name] || ['VAT']
    };
  };

  const clientData = generateClientData(displayName);

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={`text-primary hover:text-primary/80 hover:underline cursor-pointer font-medium text-left ${className}`}
      >
        {displayName}
      </button>
      
      <ClientDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        clientData={client?.data}
      />
    </>
  );
};

export default ClientNameLink;