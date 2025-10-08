import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Modal,
    Button,
    Form,
    Input,
    Card,
    Checkbox,
    Row,
    Col,
    Collapse,
    Space,
    Spin,
    Empty,
    Tag,
    Alert
} from 'antd';
import { PlusOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useMyContext } from '../../../../Context/MyContextProvider';
import Flex from 'components/shared-components/Flex';

const { Panel } = Collapse;
const { Search } = Input;

const RolePermission = () => {
    const { api, successAlert, ErrorAlert, authToken } = useMyContext();
    const [form] = Form.useForm();
    const [permission, setPermission] = useState([]);
    const [initialPermission, setInitialPermission] = useState([]);
    const [filteredPermissions, setFilteredPermissions] = useState([]);
    const [existPermission, setExistPermission] = useState([]);
    const [initialExistPermission, setInitialExistPermission] = useState([]);
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const [selectAll, setSelectAll] = useState(false);
    const [roleName, setRoleName] = useState('');
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    // Modal state
    const [open, setOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState('');

    // Check if there are unsaved changes
    const hasChanges = useMemo(() => {
        const currentSet = new Set(existPermission);
        const initialSet = new Set(initialExistPermission);

        if (currentSet.size !== initialSet.size) return true;

        for (let item of currentSet) {
            if (!initialSet.has(item)) return true;
        }
        return false;
    }, [existPermission, initialExistPermission]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    const handlePermissionChange = (permissionId, isChecked) => {
        if (isChecked) {
            setExistPermission((prev) => [...(prev || []), parseInt(permissionId)]);
        } else {
            const newPermissions = existPermission?.filter(
                (id) => id !== parseInt(permissionId)
            );
            setExistPermission(newPermissions);
        }
    };

    const PermissionData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${api}role-permission/${id}`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            setPermission(response.data.AllPermission);
            setRoleName(response.data.roleName);
            setInitialPermission(response.data.AllPermission);
            setFilteredPermissions(response.data.AllPermission);
            setExistPermission(response.data.exist);
            setInitialExistPermission(response.data.exist);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            ErrorAlert('Failed to fetch permissions');
        } finally {
            setLoading(false);
        }
    }, [api, id, authToken, ErrorAlert]);

    useEffect(() => {
        PermissionData();
    }, [PermissionData]);

    useEffect(() => {
        setSelectAll(existPermission?.length === permission?.length);
    }, [existPermission, permission]);

    const handleMultiSelect = (e) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setSelectAll(true);
            // When searching, select all from filtered results, otherwise all permissions
            const permissionsToSelect = searchText ? filteredPermissions : permission;
            const allPermissionIds = permissionsToSelect.map((p) => p.id);
            setExistPermission(allPermissionIds);
        } else {
            setSelectAll(false);
            setExistPermission([]);
        }
    };

    const handleSave = useCallback(async () => {
        const uniquePermissions = [...new Set(existPermission)];

        if (uniquePermissions.length === 0) {
            ErrorAlert('You Have To Select At Least 1 Permission');
            return;
        }

        try {
            setConfirmLoading(true);
            await axios.post(
                `${api}role-permission/${id}`,
                {
                    id,
                    permission_id: uniquePermissions,
                },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            successAlert('Permission Assigned Successfully');
            setInitialExistPermission(uniquePermissions);
            scrollToTop();
        } catch (error) {
            console.error('Error assigning permissions:', error);
            ErrorAlert('Failed to assign permissions');
        } finally {
            setConfirmLoading(false);
        }
    }, [api, id, authToken, existPermission, successAlert, ErrorAlert]);

    const handleDiscard = useCallback(() => {
        if (hasChanges) {
            Modal.confirm({
                title: 'Discard Changes?',
                content: 'You have unsaved changes. Are you sure you want to discard them?',
                okText: 'Discard',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: () => {
                    navigate(-1);
                },
            });
        } else {
            navigate(-1);
        }
    }, [hasChanges, navigate]);

    const showModal = () => {
        setOpen(true);
        form.resetFields();
    };

    const handleOk = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setConfirmLoading(true);
            await axios.post(
                `${api}create-permission`,
                { name: values.name },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            await PermissionData();
            successAlert('Permission created successfully');
            handleCancel();
        } catch (error) {
            if (error.errorFields) return;
            console.error('Error creating permission:', error);
            ErrorAlert('Failed to create permission');
            handleCancel();
        } finally {
            setConfirmLoading(false);
        }
    }, [form, api, authToken, PermissionData, successAlert, ErrorAlert]);

    const UpdatePermission = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setConfirmLoading(true);
            await axios.post(
                `${api}permission-update`,
                { name: values.name, id: editId },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );
            await PermissionData();
            successAlert('Permission updated successfully');
            handleCancel();
        } catch (error) {
            if (error.errorFields) return;
            console.error('Error updating permission:', error);
            ErrorAlert('Failed to update permission');
            handleCancel();
        } finally {
            setConfirmLoading(false);
        }
    }, [form, api, authToken, editId, PermissionData, successAlert, ErrorAlert]);

    const handleCancel = () => {
        form.resetFields();
        setEditId('');
        setOpen(false);
        setIsEdit(false);
    };

    const handleSearch = useCallback((value) => {
        setSearchText(value);
        const searchValue = value.toLowerCase().trim();

        if (searchValue) {
            const filteredPermissions = initialPermission.filter((permission) =>
                permission.name.toLowerCase().includes(searchValue)
            );
            setFilteredPermissions(filteredPermissions);
        } else {
            setFilteredPermissions(initialPermission);
        }
    }, [initialPermission]);

    const handleSubmit = () => {
        if (isEdit) {
            UpdatePermission();
        } else {
            handleOk();
        }
    };

    const HandleEdit = (id) => {
        let data = permission?.find((item) => item?.id === id);
        form.setFieldsValue({ name: data?.name });
        setEditId(id);
        setIsEdit(true);
        setOpen(true);
    };

    const Category = [
        'User',
        'Event',
        'Setting',
        'Booking',
        'Scan',
        'POS',
        'Agent',
        'Role',
        'Permission',
        'Uncategorized',
    ];

    const getCategoryFromPermission = (permissionName) => {
        if (permissionName.includes('POS')) return 'POS';
        if (permissionName.includes('Profile')) return 'User';
        if (permissionName.includes('Agent')) return 'Agent';

        const matchedCategory = Category.find((cat) =>
            permissionName.includes(cat)
        );
        return matchedCategory || 'Uncategorized';
    };

    // Group permissions based on current filtered results
    const groupedPermissions = useMemo(() => {
        return filteredPermissions?.reduce((acc, permission) => {
            const category = getCategoryFromPermission(permission.name);
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(permission);
            return acc;
        }, {});
    }, [filteredPermissions]);

    // Get categories that have matching permissions
    const categoriesWithResults = useMemo(() => {
        return Category.filter(category => groupedPermissions[category]?.length > 0);
    }, [groupedPermissions]);

    // Search results info
    const searchResultsInfo = useMemo(() => {
        if (searchText) {
            const totalResults = filteredPermissions.length;
            const categoriesCount = categoriesWithResults.length;

            if (totalResults === 0) {
                return `No permissions found for "${searchText}"`;
            }

            return `Found ${totalResults} permission${totalResults !== 1 ? 's' : ''} in ${categoriesCount} categor${categoriesCount !== 1 ? 'ies' : 'y'} for "${searchText}"`;
        }
        return null;
    }, [searchText, filteredPermissions.length, categoriesWithResults.length]);

    // Action buttons component to reuse at top and bottom
    const ActionButtons = () => (
        <Flex gap={10}>
            <Button
                icon={<CloseOutlined />}
                onClick={handleDiscard}
            >
                Discard
            </Button>
            <Button
                type="primary"
                className='border-0'
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={confirmLoading}
                disabled={!hasChanges}
            >
                Save Changes
            </Button>
        </Flex>
    );

    return (
        <>
            <Modal
                title={isEdit ? 'Edit Permission' : 'Create New Permission'}
                open={open}
                onOk={handleSubmit}
                onCancel={handleCancel}
                style={{ top: 0 }}
                confirmLoading={confirmLoading}
                okText={isEdit ? 'Update Permission' : 'Create Permission'}
                cancelText="Cancel"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Permission name is required.' },
                            { whitespace: true, message: 'Permission name cannot be empty.' },
                        ]}
                    >
                        <Input
                            placeholder={
                                isEdit ? 'Edit permission name' : 'Permission name'
                            }
                            onPressEnter={handleSubmit}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Card
                title={`Role Permission - ${roleName}`}
                extra={
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={showModal}
                        >
                            New Permission
                        </Button>
                    </Space>
                }
            >
                <Space
                    direction="vertical"
                    size="middle"
                    className='mb-3 w-100'
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Checkbox onChange={handleMultiSelect} checked={selectAll}>
                                {selectAll ? 'Deselect All' : 'Select All'}
                                {searchText && ` (${filteredPermissions.length} filtered)`}
                            </Checkbox>
                        </Space>
                        <Search
                            placeholder="Search Permission"
                            allowClear
                            value={searchText}
                            onSearch={handleSearch}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 300 }}
                        />
                    </div>

                    {/* Search Results Info */}
                    {searchResultsInfo && (
                        <Alert
                            message={searchResultsInfo}
                            type={filteredPermissions.length === 0 ? 'error' : 'success'}
                            showIcon
                            style={{ marginBottom: '16px' }}
                        />
                    )}
                </Space>

                <Row gutter={[16, 16]} style={{ maxHeight: '25rem', overflow: 'auto' }}>
                    {searchText && filteredPermissions.length === 0 ? (
                        <Col span={24}>
                            <Empty
                                description={`No permissions found matching "${searchText}"`}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ textAlign: 'center', padding: '40px 0' }}
                            />
                        </Col>
                    ) : (
                        categoriesWithResults.map((category, catIndex) => (
                            <Col key={catIndex} xs={24} sm={12} md={8} lg={6}>
                                <Card size="small">
                                    <Collapse
                                        ghost
                                        defaultActiveKey={['1']}
                                        expandIconPosition="end"
                                    >
                                        <Panel
                                            header={
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong>{category}</strong>
                                                    {/* <Tag color='orange' className=''>
                                                        {groupedPermissions[category]?.length}
                                                    </Tag> */}
                                                </div>
                                            }
                                            key="1"
                                        >
                                            <Space direction="vertical" style={{ width: '100%' , maxHeight : '15rem' , overflow : 'auto' }}>
                                                {groupedPermissions[category]?.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Checkbox
                                                            onChange={(e) =>
                                                                handlePermissionChange(item.id, e.target.checked)
                                                            }
                                                            checked={
                                                                existPermission.includes(item.id) || selectAll
                                                            }
                                                        >
                                                            {item.name}
                                                        </Checkbox>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            onClick={() => HandleEdit(item?.id)}
                                                        />
                                                    </div>
                                                ))}
                                            </Space>
                                        </Panel>
                                    </Collapse>
                                </Card>
                            </Col>
                        ))
                    )}
                </Row>

                <Flex justifyContent="center" style={{ marginTop: 24 }}>
                    <ActionButtons />
                </Flex>
            </Card>
        </>
    );
};

export default RolePermission;