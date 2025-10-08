import React, { memo, Fragment, useState, useEffect, useCallback, useMemo } from "react";
import { Card, Modal, Button, Form, Input, Table, Space, Tooltip } from "antd";
import { PlusOutlined, EditOutlined, SafetyOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useMyContext } from "../../../../Context/MyContextProvider";

const { Search } = Input;

const Roles = memo(() => {
    const { api, formatDateTime, ErrorAlert, successAlert, authToken } = useMyContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState([]);
    const [filteredRoles, setFilteredRoles] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    // Role data fetch
    const RoleData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${api}role-list`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                }
            });
            if (response.data.role) {
                const rolesData = response.data.role.reverse();
                setRoles(rolesData);
                setFilteredRoles(rolesData);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            ErrorAlert('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    }, [api, authToken, ErrorAlert]);

    useEffect(() => {
        RoleData();
    }, [RoleData]);

    // Search functionality
    const handleSearch = useCallback((value) => {
        setSearchText(value);
        const searchValue = value.toLowerCase().trim();
        
        if (searchValue) {
            const filtered = roles.filter((role) =>
                role.name.toLowerCase().includes(searchValue) ||
                formatDateTime(role.created_at).toLowerCase().includes(searchValue)
            );
            setFilteredRoles(filtered);
        } else {
            setFilteredRoles(roles);
        }
    }, [roles, formatDateTime]);

    // Reset filtered roles when roles data changes
    useEffect(() => {
        if (searchText) {
            handleSearch(searchText);
        } else {
            setFilteredRoles(roles);
        }
    }, [roles, searchText, handleSearch]);

    // Modal state
    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState('');

    const showModal = () => {
        setOpen(true);
        form.resetFields();
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const response = await axios.post(`${api}create-role`, {
                name: values.name,
                guard_name: values.name
            }, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });
            if (response.data.status) {
                RoleData();
                handleCancel();
                successAlert('Role created successfully');
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error, don't close modal
                return;
            }
            handleCancel();
            console.log(error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setOpen(false);
        setIsEdit(false);
        setEditId('');
    };

    const HandleEdit = useCallback((id) => {
        const data = roles?.find((item) => item?.id === id);
        form.setFieldsValue({ name: data?.name });
        setEditId(id);
        setIsEdit(true);
        setOpen(true);
    }, [roles, form]);

    const UpdateRole = async () => {
        try {
            const values = await form.validateFields();
            const response = await axios.post(`${api}role-update`, {
                id: editId,
                name: values.name
            }, {
                headers: {
                    'Authorization': 'Bearer ' + authToken,
                }
            });
            if (response.data.status) {
                RoleData();
                handleCancel();
                successAlert('Role updated successfully');
            }
        } catch (error) {
            if (error.errorFields) {
                // Form validation error, don't close modal
                return;
            }
            handleCancel();
            console.log(error);
        }
    };

    const AssignPermission = useCallback((id , name) => {
        navigate(`${id}/${name}/permission`);
    }, [navigate]);

    const handleSubmit = async () => {
        if (isEdit) {
            await UpdateRole();
        } else {
            await handleOk();
        }
    };

    // Table columns
    const columns = useMemo(() => [
        {
            title: '#',
            key: 'index',
            width: 70,
            align: 'center',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Created At',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => formatDateTime(text),
            sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
        },
        {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Role">
                        <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => HandleEdit(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Assign Permission">
                        <Button
                            size="small"
                            icon={<SafetyOutlined />}
                            onClick={() => AssignPermission(record.id,record?.name)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ], [HandleEdit, AssignPermission, formatDateTime]);

    // Calculate search results info
    const searchResultsInfo = useMemo(() => {
        if (searchText && filteredRoles.length !== roles.length) {
            return `Found ${filteredRoles.length} of ${roles.length} roles`;
        }
        return `Total ${filteredRoles.length} roles`;
    }, [searchText, filteredRoles.length, roles.length]);

    return (
        <Fragment>
            {/* Modal */}
            <Modal
                title={`${isEdit ? 'Edit' : 'Create New'} Role`}
                open={open}
                style={{top : 0}}
                onOk={handleSubmit}
                onCancel={handleCancel}
                okText={isEdit ? "Update Role" : "Create Role"}
                cancelText="Cancel"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Role name is required.' },
                            { whitespace: true, message: 'Role name cannot be empty.' }
                        ]}
                    >
                        <Input
                            placeholder="Role name"
                            onPressEnter={handleSubmit}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Card with Table */}
            <Card
                title="Role"
                extra={
                    <Space>
                        <Search
                            placeholder="Search roles by name or date"
                            allowClear
                            value={searchText}
                            onChange={(e) => handleSearch(e.target.value)}
                            onSearch={handleSearch}
                            style={{ width: 250 }}
                            enterButton={false}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={showModal}
                        >
                            New Role
                        </Button>
                    </Space>
                }
            >

                <Table
                    columns={columns}
                    dataSource={filteredRoles}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => searchResultsInfo,
                    }}
                />
            </Card>
        </Fragment>
    );
});

Roles.displayName = "Roles";
export default Roles;