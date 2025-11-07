import React from 'react';
import { Navigate } from 'react-router-dom';
import { lowerCase } from 'lodash';
import { useSelector } from 'react-redux';

const DashboardRoute = ({ component: Component }) => {
  const userRole = useSelector((state) => state?.auth?.user?.role);
  
  // Check if user should be redirected
  if (!['Admin', 'Organizer'].includes(userRole)) {
    return <Navigate to={`/dashboard/${lowerCase(userRole)}`} replace />;
  }

  // Render dashboard component for Admin/Organizer
  return <Component />;
};

export default DashboardRoute;