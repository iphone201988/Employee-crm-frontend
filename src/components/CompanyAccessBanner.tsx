import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSuperAdminContext } from '@/context/SuperAdminContext';
import { useNavigate } from 'react-router-dom';


const CompanyAccessBanner: React.FC = () => {
  const { switchBackToSuperAdmin }: any = useSuperAdminContext();
  const navigate = useNavigate();
  const superAdminToken = localStorage.getItem('superAdminToken');
  const userToken = localStorage.getItem('userToken');

  // If either token is missing, do not render the banner.
  if (!superAdminToken || !userToken) {
    return null;
  }

  const handleGoBack = () => {
    navigate('/business-accounts');
    switchBackToSuperAdmin();
  };


  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-800">
            You are currently accessing a company account as a Super Admin.
          </span>
          <span className="text-sm text-blue-600">
            Click "Go Back" to return to your Super Admin dashboard.
          </span>
        </div>
        <Button
          onClick={handleGoBack}
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back to Super Admin
        </Button>
      </AlertDescription>
    </Alert>
  );
};


export default CompanyAccessBanner;
