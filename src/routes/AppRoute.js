// AppRoute.jsx
import React, { useEffect } from 'react';
import { onBlankLayout } from 'store/slices/themeSlice';
import { useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useMyContext } from 'Context/MyContextProvider';
import { hasRouteAccess } from 'utils/hooks/useNavAccess';

const AppRoute = ({ component: Component, routeKey, blankLayout, roles, permissions,excludeRoles, ...props }) => {
  const dispatch = useDispatch();
  const { userRole, UserPermissions } = useMyContext();

  useEffect(() => {
    dispatch(onBlankLayout(!!blankLayout));
  }, [blankLayout, dispatch]);

  // ⛔ If no access, kick to 403 (or use your error page component)
  const canAccess = hasRouteAccess(
    { meta: { roles, permissions, excludeRoles } },
    UserPermissions,
    userRole
  );

  if (!canAccess) {
    return <Navigate to="/unauthorise" replace />;
  }

  return <Component {...props} />;
};

export default AppRoute;
