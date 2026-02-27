import React, { useState, useRef, useCallback, useEffect } from 'react';
import JoditEditor from 'jodit-react';
import { Form, Input, Modal, Row, Col, Radio, message, Button } from 'antd';
import { useCreateContentMaster, useUpdateContentMaster } from './useContentMaster';
import { useMyContext } from 'Context/MyContextProvider';
import { OrganisationList } from 'utils/CommonInputs';
import { joditConfig } from 'utils/consts';
import PermissionChecker from 'layouts/PermissionChecker';

/**
 * Reusable Content Form Modal
 * Can be used for creating/editing content from ContentMaster page or from ContentSelect dropdown
 * 
 * @param {boolean} open - Modal visibility
 * @param {Function} onClose - Callback when modal closes
 * @param {Object} editRecord - Record to edit (null for create mode)
 * @param {Function} onSuccess - Callback after successful create/update
 * @param {string} defaultType - Default type value ('note' or 'description')
 * @param {string|number} organizerId - Optional organizer ID (hides organizer selection when provided)
 */
const ContentFormModal = ({
    open = false,
    onClose,
    editRecord = null,
    onSuccess,
    defaultType = null,
    organizerId = null,
}) => {
    const { UserData } = useMyContext();
    const isUserOrganizer = UserData?.role?.toLowerCase() === 'organizer';

    // Hide organizer selection if organizerId is passed or user is organizer
    const hideOrganizerSelect = isUserOrganizer || !!organizerId;

    const [content, setContent] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const [form] = Form.useForm();
    const editor = useRef(null);

    // Mutations
    const createMutation = useCreateContentMaster({
        onSuccess: (data) => {
            handleClose();
            onSuccess?.(data);
        },
    });

    const updateMutation = useUpdateContentMaster({
        onSuccess: (data) => {
            handleClose();
            onSuccess?.(data);
        },
    });

    // Reset form when modal opens/closes or editRecord changes
    useEffect(() => {
        if (open) {
            if (editRecord) {
                // Edit mode - populate form with record data
                setContent(editRecord.content || '');
                setSelectedType(editRecord.type || null);
                form.setFieldsValue({
                    title: editRecord.title,
                    type: editRecord.type,
                    org_id: String(editRecord.user_id),
                });
            } else {
                // Create mode - reset form
                form.resetFields();
                setContent('');
                // Set default type if provided
                if (defaultType) {
                    setSelectedType(defaultType);
                    form.setFieldsValue({ type: defaultType });
                } else {
                    setSelectedType(null);
                }
            }
        }
    }, [open, editRecord, form, defaultType]);

    const handleClose = useCallback(() => {
        form.resetFields();
        setContent('');
        setSelectedType(null);
        onClose?.();
    }, [form, onClose]);

    const handleTypeChange = useCallback((e) => {
        const newType = e.target.value;
        setSelectedType(newType);
        // Clear content when switching types to avoid format issues
        setContent('');
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();

            // Validate content based on type
            const isContentEmpty = !content ||
                content.trim() === '' ||
                (selectedType === 'description' && content === '<p><br></p>');

            if (isContentEmpty) {
                message.error('Please enter content');
                return;
            }

            // Determine user_id: prioritize passed organizerId, then check if organizer, else use form value
            let userId;
            if (organizerId) {
                userId = organizerId;
            } else if (isUserOrganizer) {
                userId = UserData?.id;
            } else {
                userId = values.org_id;
            }

            const payload = {
                user_id: userId,
                title: values.title,
                type: values.type,
                contentData: content,
                status: 1,
            };

            if (editRecord) {
                updateMutation.mutate({ id: editRecord.id, payload });
            } else {
                createMutation.mutate(payload);
            }
        } catch (err) {
            // Form validation error - handled by antd
        }
    }, [form, content, selectedType, editRecord, createMutation, updateMutation, isUserOrganizer, UserData?.id, organizerId]);

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal
            open={open}
            title={editRecord ? 'Edit Content' : 'New Content'}
            onCancel={handleClose}
            width={900}
            confirmLoading={isSubmitting}
            destroyOnClose
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <PermissionChecker
                    key="save"
                    permission={editRecord ? "Update Content Master" : "Create Content Master"}
                >
                    <Button
                        type="primary"
                        loading={isSubmitting}
                        onClick={handleSubmit}
                    >
                        Save
                    </Button>
                </PermissionChecker>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <Row gutter={16}>
                    {!hideOrganizerSelect && (
                        <Col xs={24} md={12}>
                            <OrganisationList />
                        </Col>
                    )}
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Title"
                            name="title"
                            rules={[{ required: true, message: 'Title is required' }]}
                        >
                            <Input placeholder="Enter content title" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                        <Form.Item
                            label="Type"
                            name="type"
                            rules={[{ required: true, message: 'Please select a type' }]}
                        >
                            <Radio.Group onChange={handleTypeChange}>
                                <Radio value="note">Note</Radio>
                                <Radio value="description">Description</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Content"
                    required
                    help={!selectedType ? 'Please select a type first' : undefined}
                >
                    {selectedType === 'note' ? (
                        // Textarea for notes
                        <Input.TextArea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter your note content..."
                            rows={8}
                            style={{ width: '100%' }}
                            disabled={!selectedType}
                        />
                    ) : selectedType === 'description' ? (
                        // Jodit editor for descriptions
                        <JoditEditor
                            ref={editor}
                            value={content}
                            config={joditConfig}
                            tabIndex={1}
                            onBlur={(newContent) => setContent(newContent)}
                            onChange={() => { }}
                        />
                    ) : (
                        // Placeholder when no type selected
                        <Input.TextArea
                            placeholder="Please select a type first..."
                            rows={8}
                            disabled
                            style={{ width: '100%' }}
                        />
                    )}
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ContentFormModal;