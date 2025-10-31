// utils/navAccess.js

/** Normalize to trimmed lowercase (used for role checks) */
const norm = (v) => String(v ?? '').trim().toLowerCase();

/** Convert any value (string or array) to a clean string array */
const toList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).map(s => s.trim()).filter(Boolean);
  return String(val)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

/** Convert and lowercase list (used for roles) */
const toListLower = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(norm).filter(Boolean);
  return String(val)
    .split(',')
    .map(norm)
    .filter(Boolean);
};

/** Roles that bypass all checks (e.g. Admin) */
const PRIVILEGED_ROLES = ['admin']; // Add more like 'super admin' if needed

/**
 * ✅ Check if user has access to a nav item
 * @param {Object} nav - The nav item
 * @param {string[]} userPermissions - Current user's permissions
 * @param {string} userRole - Current user's role
 */
export const hasAccess = (nav, userPermissions = [], userRole = '') => {
  const userRoleNorm = norm(userRole);
    console.log('user permissions',userPermissions)
  // ✅ Admin bypass
  if (PRIVILEGED_ROLES.includes(userRoleNorm)) {
    return true;
  }

  // Permissions (case-sensitive)
  const requiredPerms = toList(nav?.permissions);
  if (requiredPerms.length) {
    const userPermSet = new Set(userPermissions.map(String));
    const hasPerm = requiredPerms.some(p => userPermSet.has(p));
    if (!hasPerm) return false;
  }

  // Roles (case-insensitive)
  const requiredRoles = toListLower(nav?.roles);
  if (requiredRoles.length) {
    const hasRole = requiredRoles.includes(userRoleNorm);
    if (!hasRole) return false;
  }

  return true;
};

/**
 * ✅ Recursively filter navigation tree based on user access
 * @param {Array} items - Navigation items
 * @param {Array} userPermissions - User permissions
 * @param {string} userRole - User role
 */
export const filterNavByAccess = (items = [], userPermissions = [], userRole = '') => {
  const userRoleNorm = norm(userRole);

  // ✅ Admin bypass → return full tree
  if (PRIVILEGED_ROLES.includes(userRoleNorm)) {
    return items;
  }

  return items
    .map(item => {
      const children = Array.isArray(item?.submenu) ? item.submenu : [];
      const filteredChildren = filterNavByAccess(children, userPermissions, userRole);

      const itemPass = hasAccess(item, userPermissions, userRole);
      if (!itemPass && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        submenu: filteredChildren,
      };
    })
    .filter(Boolean);
};

/**
 * ✅ Flattened list for search/autocomplete (leaf items only)
 * @param {Array} navigationTree - The full navigation config
 * @param {Array} optionTree - Internal accumulator
 * @param {Array} userPermissions - User permissions
 * @param {string} userRole - User role
 */
export const getOptionList = (
  navigationTree = [],
  optionTree = [],
  userPermissions = [],
  userRole = ''
) => {
  const userRoleNorm = norm(userRole);

  // ✅ Admin bypass → push all leaves
  if (PRIVILEGED_ROLES.includes(userRoleNorm)) {
    for (const navItem of navigationTree) {
      const submenu = Array.isArray(navItem?.submenu) ? navItem.submenu : [];
      if (submenu.length === 0) {
        optionTree.push(navItem);
      } else {
        getOptionList(submenu, optionTree, userPermissions, userRole);
      }
    }
    return optionTree;
  }

  // Regular (non-admin) flow
  for (const navItem of navigationTree) {
    const submenu = Array.isArray(navItem?.submenu) ? navItem.submenu : [];

    // skip if no access and no children
    if (!hasAccess(navItem, userPermissions, userRole) && submenu.length === 0) {
      continue;
    }

    if (submenu.length === 0 && hasAccess(navItem, userPermissions, userRole)) {
      optionTree.push(navItem);
    } else if (submenu.length > 0) {
      getOptionList(submenu, optionTree, userPermissions, userRole);
    }
  }

  return optionTree;
};
