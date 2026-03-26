import { Alert, Form, Select } from "antd"
import { useMyContext } from "Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ORGANIZER_ALLOWED_ROLES } from "./consts";

export const OrganisationList = ({ onChange, disabled, label = "Organization", name = "org_id", rules, value, selectProps = {}, formItemProps = {} }) => {
    const { data: users = [], isLoading } = useQuery({
        queryKey: ["users-list"],
        queryFn: async () => {
            const res = await apiClient.get(`users/list`);
            return res?.data || [];
        },
        staleTime: 5 * 60 * 1000,
    });

    const labelText = typeof label === 'string' ? label.toLowerCase() : 'organization';

    return (
        <Form.Item
            label={label}
            name={name}
            rules={rules || [{ required: true, message: `Please select ${labelText}` }]}
            {...formItemProps}
        >
            <Select
                disabled={disabled}
                loading={isLoading}
                showSearch
                placeholder={`Select ${labelText}`}
                options={users?.map(org => ({
                    value: String(org.id),
                    label: org.organisation ? `${org.organisation} (${org.name})` : org.name,
                }))}
                optionFilterProp="label"
                onChange={onChange}
                value={value}
                {...selectProps}
            />
        </Form.Item>
    )
}

export const RoleSelect = ({
    onChange,
    required = true,
    label = "User Role",
    placeholder = "Select role",
    name = "roleId",
    disabled = false,
    allowedRoles = null,
    showAlert = true,
    value,
    formItemProps = {},
    selectProps = {},
}) => {
    const { userRole } = useMyContext();

    // Fetch roles from API
    const { data: roles = [], isLoading } = useQuery({
        queryKey: ["roles"],
        queryFn: async () => {
            const res = await apiClient.get(`role-list`);
            return (res?.role || []).slice().reverse();
        },
        staleTime: 5 * 60 * 1000,
    });

    // Filter roles based on user permissions or custom allowed roles
    const filteredRoles = useMemo(() => {
        // If custom allowed roles are provided, use them
        if (allowedRoles && Array.isArray(allowedRoles)) {
            return roles.filter(role => allowedRoles.includes(role.name));
        }

        // Default filtering based on user role
        if (userRole === 'Admin') {
            return roles;
        } else if (userRole === 'Organizer') {
            return roles.filter(role => ORGANIZER_ALLOWED_ROLES.includes(role.name));
        }

        return [];
    }, [roles, userRole, allowedRoles]);

    // Handle role change
    const handleChange = (roleId) => {
        const selectedRole = filteredRoles.find(r => r.id === Number(roleId));

        if (onChange) {
            onChange(roleId, selectedRole?.name, selectedRole);
        }
    };

    // Prepare options for Select
    const options = useMemo(() =>
        filteredRoles.map(role => ({
            value: role.id,
            label: role.name,
        })),
        [filteredRoles]
    );

    return (
        <>
            <Form.Item
                label={label}
                name={name}
                rules={[
                    { required, message: `Please select ${label.toLowerCase()}` }
                ]}
                {...formItemProps}
            >
                <Select
                    placeholder={placeholder}
                    onChange={handleChange}
                    options={options}
                    loading={isLoading}
                    disabled={disabled || isLoading}
                    value={value}
                    showSearch
                    optionFilterProp="label"
                    {...selectProps}
                />
            </Form.Item>

            {/* Show info message for Organizers */}
            {showAlert && userRole === 'Organizer' && !allowedRoles && (
                <Alert
                    message="Role Restriction"
                    description="As an Organizer, you can only create users with specific roles: POS, Agent, Scanner, Shop Keeper, Box Office Manager, Sponsor, and Accreditation."
                    type="info"
                    showIcon
                    style={{ marginTop: -8, marginBottom: 16 }}
                />
            )}
        </>
    );
};
