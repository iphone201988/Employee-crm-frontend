import { useMemo, useState, useEffect } from 'react';
import { useGetCurrentUserQuery } from '@/store/authApi';


interface TabConfig {
  id: string;
  label: string;
}

interface Features {
  [key: string]: boolean;
}

export const usePermissionTabs = (allTabs: TabConfig[]) => {
  const { data: currentUserData, isLoading, isError }: any = useGetCurrentUserQuery();

  const visibleTabs = useMemo(() => {
    const features = currentUserData?.data?.features;
    if (!features) {
      return []; 
    }
    return allTabs.filter(tab => features[tab.id] === true);
  }, [currentUserData, allTabs]);
  
  return {
    visibleTabs,
    isLoading,
    isError,
  };
};
