interface ClientData {
    clientRef: string;
    clientName: string;
    businessType: string;
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
    auditCompliant: boolean;
}

interface IAddClient {
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    onClientAdd?: (client: ClientData) => void;
}