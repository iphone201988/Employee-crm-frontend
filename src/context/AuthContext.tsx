import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// Add the 'role' property to the User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string; // Add role here
}

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: User | null;
  loading: boolean;
  setCredentials: (user: User, token: any, superAdminToken?: any) => void;
  clearCredentials: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth:any = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
