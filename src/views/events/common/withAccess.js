import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMyContext } from "Context/MyContextProvider";

/**
 * ✅ Higher-Order Component for Role & Permission Guard
 *
 * @param {Object} options
 * @param {string[]} [options.allowedRoles=[]]           - Allowed user roles
 * @param {string[]} [options.requiredPermissions=[]]    - Required permissions
 * @param {'all'|'any'} [options.mode='all']             - 'all' → all perms needed, 'any' → at least one
 * @param {string} [options.redirectTo='/dashboard']     - Redirect path on denial
 * @param {React.ReactNode|Function} [options.whenDenied=null] - Optional fallback UI before redirect
 */
export const withAccess =
  ({
    allowedRoles = [],
    requiredPermissions = [],
    mode = "all",
    redirectTo = "/dashboard",
    whenDenied = null,
  } = {}) =>
  (WrappedComponent) => {
    const AccessWrapper = (props) => {
      const navigate = useNavigate();
      const location = useLocation();
      const {
        UserPermissions = [], // from your context
        userRole,             // from your context
        isAuthLoading = false // optional flag
      } = useMyContext();

      // ✅ Check role
      const hasRole = useMemo(() => {
        if (!allowedRoles.length) return true;
        return allowedRoles.includes(userRole);
      }, [allowedRoles, userRole]);

      // ✅ Check permissions
      const hasPermissions = useMemo(() => {
        if (!requiredPermissions.length) return true;
        const has = (perm) => Array.isArray(UserPermissions) && UserPermissions.includes(perm);
        return mode === "any"
          ? requiredPermissions.some(has)
          : requiredPermissions.every(has);
      }, [requiredPermissions, UserPermissions, mode]);

      const isAllowed = hasRole && hasPermissions;

      // 🚦 Redirect if unauthorized
      useEffect(() => {
        if (isAuthLoading) return;
        if (!isAllowed) {
          navigate(redirectTo, { replace: true, state: { from: location } });
        }
      }, [isAllowed, isAuthLoading, navigate, redirectTo, location]);

      // 🕓 Optional loading / redirect placeholder
      if (isAuthLoading) return null;
      if (!isAllowed) {
        return typeof whenDenied === "function" ? whenDenied() : whenDenied;
      }

      // ✅ Render wrapped component
      return <WrappedComponent {...props} />;
    };

    AccessWrapper.displayName = `withAccess(${
      WrappedComponent.displayName || WrappedComponent.name || "Component"
    })`;

    return AccessWrapper;
  };
