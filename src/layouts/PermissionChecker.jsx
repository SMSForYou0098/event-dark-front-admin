// PermissionChecker.jsx
import React from 'react';
import { useMyContext } from 'Context/MyContextProvider';

/**
 * PermissionChecker
 *
 * ✅ Shows children only if user has required permission/role.
 * ✅ If logged-in user's role === "admin", all checks are skipped (full access).
 *
 * Props:
 * - permission: string | string[]
 * - role: string | string[]
 * - matchType: 'AND' | 'OR' (default 'AND')
 * - fallback: ReactNode (rendered when unauthorized)
 */
const PermissionChecker = ({
  permission,
  role,
  matchType = 'AND',
  fallback = null,
  children,
}) => {
  // --- 1️⃣ Get user info from context ---
  const { UserPermissions, userRole } = useMyContext();

  // --- 2️⃣ Normalize helper ---
  const toArray = (val) =>
    Array.isArray(val) ? val : val != null ? [val] : [];

  const norm = (v) => String(v ?? '').trim().toLowerCase();

  // --- 3️⃣ Normalize user data ---
  const userPermissions = toArray(UserPermissions).map(norm);
  const userRoles = toArray(userRole).map(norm);

  // --- 4️⃣ ✅ ADMIN BYPASS ---
  // If logged-in user has role "admin", give full access immediately
  if (userRoles.includes('admin')) {
    return <>{children}</>;
  }

  // --- 5️⃣ Normalize required permissions/roles ---
  const requiredPermissions = toArray(permission).map(norm);
  const requiredRoles = toArray(role).map(norm);

  // If nothing is required, deny by default (explicit > implicit)
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return fallback;
  }

  // --- 6️⃣ Check permissions and roles ---
  const hasPermission =
    requiredPermissions.length === 0
      ? null
      : requiredPermissions.some((p) => userPermissions.includes(p));

  const hasRole =
    requiredRoles.length === 0
      ? null
      : requiredRoles.some((r) => userRoles.includes(r));

  // --- 7️⃣ Combine logic based on matchType ---
  let isAuthorized = false;

  if (requiredPermissions.length > 0 && requiredRoles.length > 0) {
    isAuthorized =
      matchType === 'OR'
        ? Boolean(hasPermission) || Boolean(hasRole)
        : Boolean(hasPermission) && Boolean(hasRole);
  } else if (requiredPermissions.length > 0) {
    isAuthorized = Boolean(hasPermission);
  } else if (requiredRoles.length > 0) {
    isAuthorized = Boolean(hasRole);
  }

  return isAuthorized ? <>{children}</> : fallback;
};

export default PermissionChecker;
