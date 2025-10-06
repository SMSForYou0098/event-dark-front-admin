import { useSelector } from "react-redux";

const usePermission = (requiredPermission, requiredRole, matchType = 'AND') => {
    const user = useSelector((state) => state?.auth?.user);
    const userPermissions = user?.permissions || [];
    const userRole = user?.role;

    // Check permission
    const hasPermission = requiredPermission 
        ? Array.isArray(requiredPermission)
            ? requiredPermission.some(permission => userPermissions.includes(permission))
            : userPermissions.includes(requiredPermission)
        : null;

    // Check role
    const hasRole = requiredRole
        ? Array.isArray(requiredRole)
            ? requiredRole.includes(userRole)
            : userRole === requiredRole
        : null;

    // If both permission and role are provided
    if (requiredPermission && requiredRole) {
        if (matchType === 'OR') {
            return hasPermission || hasRole; // Either one is enough
        } else {
            return hasPermission && hasRole; // Both are required (AND - default)
        }
    }

    // If only permission is provided
    if (requiredPermission) {
        return hasPermission;
    }

    // If only role is provided
    if (requiredRole) {
        return hasRole;
    }

    // If neither is provided
    return false;
};

export default usePermission;



// use cases

// Check permission OR role (either one is enough)
// const canAccess = usePermission('edit_posts', 'admin', 'OR');

// Check permission AND role (both required) - default behavior
// const canAccessStrict = usePermission('edit_posts', 'admin'); // or 'AND'

// Only permission
// const canEdit = usePermission('edit_posts');

// Only role
// const isAdmin = usePermission(null, 'admin');