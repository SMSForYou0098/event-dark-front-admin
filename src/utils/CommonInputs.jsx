import { Alert, Form, Select } from "antd"
import { useMyContext } from "Context/MyContextProvider";
import apiClient from "auth/FetchInterceptor";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ORGANIZER_ALLOWED_ROLES } from "./consts";

// Common dropdown renderer to prevent clipping at the bottom
export const renderDropdownWithPadding = (menu) => (
    <>
        {menu}
        <div style={{ paddingBottom: '1px' }} />
    </>
);

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
                dropdownRender={renderDropdownWithPadding}
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
                    dropdownRender={renderDropdownWithPadding}
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

/**
 * OrgEventList – reusable event selector driven by an organizer ID.
 *
 * Props:
 *  orgId          – organizer / reporting-user ID (enables the fetch)
 *  onChange       – called with raw Select value(s)
 *  onEventsLoaded – called with full event objects when data arrives
 *                   shape: [{ value, label, tickets }]
 *  value          – controlled value
 *  mode           – "multiple" | undefined  (default = single)
 *  label          – Form.Item label (pass null to hide)
 *  name           – Form.Item name  (default "event_id")
 *  rules          – Form.Item validation rules
 *  disabled       – disables the Select
 *  selectProps    – extra props forwarded to <Select />
 *  formItemProps  – extra props forwarded to <Form.Item />
 */
export const OrgEventList = ({
    orgId,
    onChange,
    onEventsLoaded,
    value,
    mode,
    label = "Event",
    name = "event_id",
    rules,
    disabled,
    selectProps = {},
    type = "Organizer",
    formItemProps = {},
}) => {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ["org-events", orgId],
        enabled: Boolean(orgId),
        queryFn: async () => {
            const res = await apiClient.get(`org-event/${orgId}?role=${type}`);
            const list = Array.isArray(res?.data) ? res.data
                : Array.isArray(res?.events) ? res.events : [];
            return list.map(event => ({
                value: event.id,
                label: event.name,
                tickets: event.tickets || [],
            }));
        },
        staleTime: 5 * 60 * 1000,
    });

    // Notify parent with full event objects whenever the list loads/changes
    useMemo(() => {
        if (onEventsLoaded && events.length > 0) {
            onEventsLoaded(events);
        }
    }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <Form.Item
            label={label}
            name={name}
            rules={rules}
            {...formItemProps}
        >
            <Select
                mode={mode}
                disabled={disabled || !orgId}
                loading={isLoading}
                showSearch
                placeholder={orgId ? `Select event` : `Select organizer first`}
                options={events}
                optionFilterProp="label"
                onChange={onChange}
                value={value}
                dropdownRender={renderDropdownWithPadding}
                {...selectProps}
            />
        </Form.Item>
    );
};
