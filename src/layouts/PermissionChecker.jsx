import { useMyContext } from 'Context/MyContextProvider';
const PermissionChecker = ({ permission, children }) => {
    const { UserPermissions } = useMyContext();
    const hasPermission = () => {
        return UserPermissions?.includes(permission);
    }
    
    if (hasPermission()) {
        return children;
    }
    
    return null;
}
 
export default PermissionChecker