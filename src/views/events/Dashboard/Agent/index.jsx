import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from '../components/DashboardLayout';
import { useMyContext } from 'Context/MyContextProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000,
        },
    },
});

const AgentDashboard = () => {
    const {userRole, UserData} = useMyContext()
    return (
        <QueryClientProvider client={queryClient}>
            <DashboardLayout
                userId={UserData?.id} 
                userRole={userRole}
                showUserManagement={true} // Hide user management for organizers
            />
        </QueryClientProvider>
    );
};

export default AgentDashboard;