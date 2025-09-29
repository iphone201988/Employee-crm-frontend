import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SuperAdminContextType {
    isSuperAdminMode: boolean;
    originalSuperAdminToken: string | null;
    switchToCompanyMode: (companyToken: string) => void;
    switchBackToSuperAdmin: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdminContext = () => {
    const context = useContext(SuperAdminContext);
    if (!context) {
        throw new Error('useSuperAdminContext must be used within a SuperAdminProvider');
    }
    return context;
};

interface SuperAdminProviderProps {
    children: ReactNode;
}

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({ children }) => {
    const [isSuperAdminMode, setIsSuperAdminMode] = useState(true);
    const [originalSuperAdminToken, setOriginalSuperAdminToken] = useState<string | null>(null);

    // This effect correctly sets the initial state based on what's in localStorage
    useEffect(() => {
        const superAdminToken = localStorage.getItem('superAdminToken');
        const userToken = localStorage.getItem('userToken');

        if (superAdminToken && userToken && superAdminToken !== userToken) {
            // We are in company mode
            setIsSuperAdminMode(false);
            setOriginalSuperAdminToken(superAdminToken);
        } else if (superAdminToken) {
            // We are in super admin mode
            setIsSuperAdminMode(true);
            setOriginalSuperAdminToken(superAdminToken);
        }
    }, []);

    const switchToCompanyMode = (companyToken: string) => {
        const currentUserToken = localStorage.getItem('userToken');
      
        // Store the original super admin token if it's not already stored
        if (currentUserToken) {
            localStorage.setItem('superAdminToken', currentUserToken);
            setOriginalSuperAdminToken(currentUserToken);
        }
        //  alert(companyToken);
        //  alert(currentUserToken);
        // Switch to the new company token
        localStorage.setItem('userToken', companyToken);
        setIsSuperAdminMode(false);
        // The calling component will handle navigation
    };

    const switchBackToSuperAdmin = () => {
        const storedSuperAdminToken = localStorage.getItem('superAdminToken');
        if (storedSuperAdminToken) {
            localStorage.setItem('userToken', storedSuperAdminToken);
            localStorage.removeItem('superAdminToken');
            setIsSuperAdminMode(true);
            setOriginalSuperAdminToken(null);
            // alert(isSuperAdminMode);
            // Reload to apply the new token context throughout the app
            window.location.href = '/'; 
        }
    };

    return (
        <SuperAdminContext.Provider
            value={{
                isSuperAdminMode,
                originalSuperAdminToken,
                switchToCompanyMode,
                switchBackToSuperAdmin,
            }}
        >
            {children}
        </SuperAdminContext.Provider>
    );
};
