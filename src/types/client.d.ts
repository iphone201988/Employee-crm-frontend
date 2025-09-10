interface ClientData {
    clientRef: string;
    clientName: string;
    businessTypeId: string;
    taxNumber: string;
    croNumber?: string;
    address: string;
    contactName: string;
    email: string;
    emailNote?: string;
    phone: string;
    phoneNote?: string;
    onboardedDate: Date;
    amlCompliant: boolean;
    audit: boolean;
}

interface IAddClient {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    onClientAdd?: (client: ClientData) => void;
}


interface IAddClientResponse {
    success: boolean;
    message: string;
    data?: ClientData;
}

interface BusinessType {
    _id: string;
    name: string;
    __v: number;
}

interface Client {
    status: string;
    _id: string;
    clientRef: string;
    clientName: string;
    businessTypeId: BusinessType | null;
    taxNumber: string;
    croNumber: string;
    address: string;
    contactName: string;
    email: string;
    emailNote: string;
    phone: string;
    phoneNote: string;
    onboardedDate: string;
    amlCompliant: boolean;
    audit: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalClients: number;
    limit: number;
}

interface Breakdown {
    totalClients: number;
    [key: string]: number;
}

interface ClientsData {
    clients: Client[];
    pagination: Pagination;
    breakdown: Breakdown;
}

interface GetClientsResponse {
    success: boolean;
    message: string;
    data: ClientsData;
}

interface ClientInfo {
  _id: string;
  clientRef: string;
  clientName: string;
  businessTypeId: {
    _id: string;
    name: string;
    __v: number;
  } | null;
  taxNumber: string;
  croNumber: string;
  address: string;
  contactName: string;
  email: string;
  emailNote: string;
  phone: string;
  phoneNote: string;
  onboardedDate: string;
  amlCompliant: boolean;
  audit: boolean;
  createdAt: string;
  updatedAt: string;
}