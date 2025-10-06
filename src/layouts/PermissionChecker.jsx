// PermissionChecker.jsx
import React from 'react';
import { useSelector } from 'react-redux';

/**
 * PermissionChecker
 *
 * Renders children only if the current user satisfies the provided
 * permission/role requirements.
 *
 * Features:
 * - Accepts single or multiple required permissions: string | string[]
 * - Accepts single or multiple required roles: string | string[]
 * - Supports users with single role or multiple roles in state (string | string[])
 * - Combine role + permission checks with 'AND' (default) or 'OR'
 * - Optional `fallback` UI when access is denied
 *
 * Examples:
 *   <PermissionChecker permission="users.edit"><EditBtn /></PermissionChecker>
 *   <PermissionChecker role={['admin','manager']}><AdminStuff /></PermissionChecker>
 *   <PermissionChecker permission={['posts.create','posts.publish']} role="editor" matchType="OR">
 *     <PublishBtn />
 *   </PermissionChecker>
 *
 * @param {object} props
 * @param {string|string[]=} props.permission      - Required permission(s)
 * @param {string|string[]=} props.role            - Required role(s)
 * @param {'AND'|'OR'=}      props.matchType       - How to combine permission + role checks (default 'AND')
 * @param {React.ReactNode=} props.fallback        - What to render if not authorized (default: null)
 * @param {React.ReactNode}  props.children        - Content to render if authorized
 */
const PermissionChecker = ({
  permission,
  role,
  matchType = 'AND',
  fallback = null,
  children,
}) => {
  // ---- 1) Get user from store ----
  const user = useSelector((state) => state?.auth?.user);

  // Normalize user permissions to an array
  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions
    : Array.isArray(user?.scopes) // if your app sometimes calls them 'scopes'
      ? user.scopes
      : (user?.permissions ? [user.permissions] : []);

  // Normalize user role(s) to an array (supports both string or string[])
  const userRoles = Array.isArray(user?.role)
    ? user.role
    : (user?.role ? [user.role] : []);

  // ---- 2) Helper: normalize inputs to arrays for uniform checks ----
  const toArray = (val) => (Array.isArray(val) ? val : (val != null ? [val] : []));

  const requiredPermissions = toArray(permission);
  const requiredRoles = toArray(role);

  // If neither permission nor role is provided, treat as "no restriction" => deny by default (explicit is better)
  if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
    return fallback;
  }

  // ---- 3) Permission check ----
  // Policy: if multiple required permissions are given, we consider it as "any-of" (OR across the list).
  // If you need "all-of", you can switch to `.every(...)`.
  const hasPermission =
    requiredPermissions.length === 0
      ? null // not part of this check
      : requiredPermissions.some((p) => userPermissions.includes(p));

  // ---- 4) Role check ----
  // Works for: required role(s) array vs user roles array => check any overlap
  const hasRole =
    requiredRoles.length === 0
      ? null // not part of this check
      : requiredRoles.some((r) => userRoles.includes(r));

  // ---- 5) Combine according to matchType ----
  let isAuthorized = false;

  // Both provided: combine with AND/OR
  if (requiredPermissions.length > 0 && requiredRoles.length > 0) {
    isAuthorized = matchType === 'OR'
      ? Boolean(hasPermission) || Boolean(hasRole)
      : Boolean(hasPermission) && Boolean(hasRole);
  }
  // Only permission provided
  else if (requiredPermissions.length > 0) {
    isAuthorized = Boolean(hasPermission);
  }
  // Only role provided
  else if (requiredRoles.length > 0) {
    isAuthorized = Boolean(hasRole);
  }

  return isAuthorized ? <>{children}</> : fallback;
};

export default PermissionChecker;
