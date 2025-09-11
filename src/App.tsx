import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider } from './context/AuthContext';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { WipDebtors } from "./pages/WipDebtors";
import ClientInformationTab from "./pages/ClientInformationTab";
import { Layout } from "./components/Layout";
import Jobs from "./pages/Jobs";
import ExpensesLogTab from "./pages/ExpensesLogTab";
import ReportsTab from "./components/ReportsTab";
import TeamTab from "./pages/TeamTab";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import SetPassword from "./pages/SetPassword";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/set-password" 
                element={
                  <PublicRoute>
                    <SetPassword />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/wip-debtors" element={<WipDebtors />} />
                      <Route path="/clients" element={<ClientInformationTab />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/expenses" element={<ExpensesLogTab />} />
                      <Route path="/reports" element={<ReportsTab />} />
                      <Route path="/team" element={<TeamTab />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </Provider>
);

export default App;
