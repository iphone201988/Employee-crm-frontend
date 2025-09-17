interface ClientData {
    clientRef: string;
    name: string;
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
    name: string;
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
  name: string;
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


interface ClientData {
    [key: string]: any; 
}

interface IAddClientResponse {
    [key: string]: any;
}

 interface GetClientsResponse {
    [key:string]: any;
}

interface GetClientServicesRequest {
    page: number;
    limit: number;
    search?: string;
    businessType?: string;
}


interface ServiceDetail {
    _id: string;
    name: string;
}

 interface ClientWithServiceStatus {
    _id: string;
    clientRef: string;
    name: string;
    businessTypeId: string;
    businessType: string;
    serviceDetails: ServiceDetail[];
    [key: string]: any;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalClients: number;
    limit: number;
}

interface ServiceBreakdown {
    serviceId: string;
    serviceName: string;
    count: number;
}

 interface GetClientServicesResponse {
    success: boolean;
    message: string;
    data: ClientWithServiceStatus[];
    pagination: Pagination;
    breakdown: ServiceBreakdown[];
}

interface UpdateClientServicesRequest {
    clientServices: ClientServiceUpdate[];
}

 interface IClient {
    _id: string;
    clientRef: string;
    name: string;
    businessTypeId: string;
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
    status: string;
    services: string[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    businessTypeInfo: {
        _id: string;
        name: string;
        __v: number;
    }[];
}
interface GetClientResponse {
    success: boolean;
    message: string;
    data: IClient;
}