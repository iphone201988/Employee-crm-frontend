import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status on mount
    const token = localStorage.getItem('userToken');
    const user = localStorage.getItem('userInfo');
    
    if (token) {
      setIsAuthenticated(true);
      setUserInfo(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  const setCredentials = (user: User = null, token: any, superAdminToken?: any) => {
    localStorage.setItem('userToken', token);
    localStorage.setItem('userInfo', JSON.stringify(user));
    localStorage.setItem('adminToken', superAdminToken);
    setUserInfo(user);
    setIsAuthenticated(true);
  };

  const clearCredentials = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    userInfo,
    loading,
    setCredentials,
    clearCredentials,
  };
};
