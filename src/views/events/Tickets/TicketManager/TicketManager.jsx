// TicketManager.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Modal, Form, Input, Select, Button, Table, Space,
    Switch, DatePicker, InputNumber, Row, Col, Alert, message,
    Tag, Tooltip, Image, Card, Typography
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    CheckOutlined, PictureOutlined, CloseOutlined
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import axios from 'axios';
import dayjs from 'dayjs';
import PermissionChecker from 'layouts/PermissionChecker';
import { useQuery } from '@tanstack/react-query';
import { MediaGalleryPickerModal } from 'components/shared-components/MediaGalleryPicker';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const TAX_TYPES = [
    { value: 'Inclusive', label: 'Inclusive' },
    { value: 'Exclusive', label: 'Exclusive' },
];

const TicketManager = ({ eventId, eventName, showEventName = true }) => {
    const { UserData, getCurrencySymbol } = useMyContext();
    const [form] = Form.useForm();

    // State management
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);

    // Media handling
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [selectedMediaUrl, setSelectedMediaUrl] = useState('');

    // Fallback handling
    const [selectedFallbackTicket, setSelectedFallbackTicket] = useState(null);

    const [convertedPrice, setConvertedPrice] = useState('');
    const [saleEnabled, setSaleEnabled] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('INR');
    const [priceValue, setPriceValue] = useState('');
    const saleSectionRef = useRef(null);
    const [submitting, setSubmitting] = useState(false);


    // Fetch tickets using TanStack Query
    const {
        data: tickets = [],
        isLoading: ticketsLoading,
        refetch: refetchTickets,
    } = useQuery({
        queryKey: ['tickets', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const response = await apiClient.get(`tickets/${eventId}`, {
                headers: { "X-Request-Source": "GTX025U" }
            });
            return response.status ? (response.tickets || []) : [];
        },
        enabled: !!eventId,
        staleTime: 2 * 60 * 1000,
    });

    // Fetch fallback tickets for the event category
    const {
        data: fallbackTickets = [],
        isLoading: fallbackLoading,
    } = useQuery({
        queryKey: ['fallback-tickets', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const res = await apiClient.get(`fallback-tickets/category/${eventId}`);
            if (res?.data) {
                return Array.isArray(res.data) ? res.data : [res.data];
            }
            return [];
        },
        enabled: !!eventId,
        staleTime: 2 * 60 * 1000,
    });

    // Fetch access areas
    const { data: areas = [] } = useQuery({
        queryKey: ['access-areas', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const response = await apiClient.get(`accessarea-list/${eventId}`);
            return (response.data || []).map(area => ({
                value: area.id,
                label: area.title
            }));
        },
        enabled: !!eventId,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch promocodes
    const { data: promocodes = [] } = useQuery({
        queryKey: ['promocodes', UserData?.id],
        queryFn: async () => {
            if (!UserData?.id) return [];
            const response = await apiClient.get(`promo-list/${UserData?.id}`);
            return (response?.promoCodes || []).map(promo => ({
                value: promo.id,
                label: promo.code
            }));
        },
        enabled: !!UserData?.id,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch currencies
    const { data: currencies = [] } = useQuery({
        queryKey: ['currencies'],
        queryFn: async () => {
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
            return Object.keys(response.data.rates).map(cur => ({
                value: cur,
                label: cur
            }));
        },
        staleTime: 30 * 60 * 1000,
    });

    // Currency conversion
    useEffect(() => {
        if (priceValue && selectedCurrency !== 'INR') {
            axios.get(`https://open.er-api.com/v6/latest/${selectedCurrency}`)
                .then(response => {
                    const rate = response.data.rates.INR;
                    setConvertedPrice((priceValue * rate).toFixed(2));
                })
                .catch(() => setConvertedPrice(''));
        } else {
            setConvertedPrice('');
        }
    }, [priceValue, selectedCurrency]);

    const handlePriceChange = (e) => {
        const value = e.target.value;
        setPriceValue(value);
    };

    // Handle Create
    const handleCreate = () => {
        setEditMode(false);
        setEditingTicket(null);
        form.resetFields();
        setSelectedMediaUrl('');
        setSaleEnabled(false);
        setPriceValue('');
        setConvertedPrice('');

        // Auto-select default fallback ticket
        const defaultFallback = fallbackTickets.find(t => t.default);
        setSelectedFallbackTicket(defaultFallback?.id || fallbackTickets[0]?.id || null);

        setModalVisible(true);
    };

    // Handle Edit
    const handleEdit = useCallback((ticket) => {
        setEditMode(true);
        setEditingTicket(ticket);
        setModalVisible(true);

        // Dates
        let saleDates = null;
        if (ticket.sale_date) {
            const [startDate, endDate] = ticket.sale_date.split(',');
            if (startDate && endDate) {
                saleDates = [dayjs(startDate.trim()), dayjs(endDate.trim())];
            }
        }

        const hasSaleData = ticket.sale === 1 || ticket.sale === true;
        setSaleEnabled(hasSaleData);

        form.setFieldsValue({
            ticket_title: ticket.name,
            price: ticket.price,
            quantity: ticket.ticket_quantity,
            currency: ticket.currency || 'INR',
            user_booking_limit: ticket?.user_booking_limit,
            booking_per_customer: ticket?.booking_per_customer,
            ticket_description: ticket.ticket_description || ticket?.description,
            taxes: ticket.taxes,
            access_area: ticket.access_area_ids || [],
            promocode_codes: ticket.promocode_ids ? JSON.parse(ticket.promocode_ids) : [],
            sale: hasSaleData,
            sold_out: ticket.sold_out,
            allow_pos: ticket.allow_pos,
            allow_agent: ticket.allow_agent,
            booking_not_open: ticket.booking_not_open,
            fast_filling: ticket.fast_filling,
            modify_access_area: ticket.modify_access_area,
            status: ticket.status,
            sale_dates: saleDates,
            sale_price: ticket.sale_price || null,
        });

        // Initialize media state
        // If ticket has custom image, use that. Else if fallback, select it? 
        // We might not know if it was fallback unless we match URL strings.
        const imageUrl = ticket.background_image || ticket.ticket_image;

        // Check if this image matches any fallback
        const matchingFallback = fallbackTickets.find(ft => ft.image === imageUrl);

        if (matchingFallback) {
            setSelectedFallbackTicket(matchingFallback.id);
            setSelectedMediaUrl(''); // Not a custom upload/gallery selection
        } else if (imageUrl) {
            setSelectedMediaUrl(imageUrl);
            setSelectedFallbackTicket(null); // Custom image overrides fallback
        } else {
            setSelectedMediaUrl('');
            // Default fallback
            const defaultFallback = fallbackTickets.find(t => t.default);
            setSelectedFallbackTicket(defaultFallback?.id || null);
        }

        setSelectedCurrency(ticket.currency || 'INR');
        setPriceValue(ticket.price);
    }, [form, fallbackTickets]);

    // Handle Delete
    const handleDelete = async (ticketId) => {
        Modal.confirm({
            title: 'Delete Ticket?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            onOk: async () => {
                try {
                    await apiClient.delete(`ticket-delete/${ticketId}`);
                    message.success('Ticket deleted successfully');
                    refetchTickets();
                } catch (error) {
                    message.error('Failed to delete ticket');
                }
            },
        });
    };

    // Media Selection Handler
    const handleMediaSelect = (url) => {
        console.log('Media selected:', url);
        setSelectedMediaUrl(url);
        setMediaPickerOpen(false);
        // Clear fallback selection when custom media is chosen
        if (url) {
            setSelectedFallbackTicket(null);
        }
    };

    // Fallback Selection Handler
    const handleFallbackSelect = (id) => {
        setSelectedFallbackTicket(id);
        // Clear custom media when fallback is chosen
        if (id) {
            setSelectedMediaUrl('');
        }
    };

    // Handle Submit
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('ticket_title', values.ticket_title);
            formData.append('price', values.price);
            formData.append('currency', values.currency);
            formData.append('ticket_quantity', values.quantity);
            formData.append('booking_per_customer', values.booking_per_customer);
            formData.append('user_booking_limit', values.user_booking_limit);
            formData.append('ticket_description', values.ticket_description || '');
            formData.append('taxes', values.taxes);

            formData.append('access_area', JSON.stringify(values.access_area || []));
            if (values.promocode_codes && values.promocode_codes.length > 0) {
                formData.append('promocode_codes', JSON.stringify(values.promocode_codes));
            }

            formData.append('sold_out', values.sold_out);
            formData.append('allow_pos', values.allow_pos);
            formData.append('allow_agent', values.allow_agent);
            formData.append('booking_not_open', values.booking_not_open);
            formData.append('fast_filling', values.fast_filling);
            formData.append('modify_access_area', values.modify_access_area);
            formData.append('status', values.status);
            formData.append('sale', saleEnabled);

            if (saleEnabled && values.sale_dates) {
                const [start, end] = values.sale_dates;
                formData.append('sale_date', [
                    start.format('YYYY-MM-DD'),
                    end.format('YYYY-MM-DD')
                ].join(','));
                formData.append('sale_price', values.sale_price);
            }

            // Image Logic: Custom URL OR Fallback
            console.log('Submit - selectedMediaUrl:', selectedMediaUrl);
            console.log('Submit - selectedFallbackTicket:', selectedFallbackTicket);

            if (selectedMediaUrl) {
                formData.append('background_image', selectedMediaUrl);
                console.log('Appending custom background_image:', selectedMediaUrl);
            } else if (selectedFallbackTicket) {
                const fallbackImg = fallbackTickets.find(t => t.id === selectedFallbackTicket);
                if (fallbackImg?.image) {
                    formData.append('background_image', fallbackImg.image);
                    console.log('Appending fallback background_image:', fallbackImg.image);
                }
            }

            const endpoint = editMode
                ? `update-ticket/${editingTicket.id}`
                : `create-ticket/${eventId}`;

            const response = await apiClient.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status) {
                message.success(`Ticket ${editMode ? 'updated' : 'created'} successfully`);
                setModalVisible(false);
                refetchTickets();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save ticket');
        } finally {
            setSubmitting(false);
        }
    };

    // Determine current preview image
    const getCurrentPreviewImage = () => {
        if (selectedMediaUrl) return selectedMediaUrl;
        if (selectedFallbackTicket) {
            return fallbackTickets.find(t => t.id === selectedFallbackTicket)?.image;
        }
        return 'https://placehold.co/300x750';
    };

    const switchesConfig = [
        { label: 'Sale', name: 'sale' },
        {
            label: 'Sold Out',
            name: 'sold_out',
            onChange: (checked) => {
                if (checked) form.setFieldsValue({ booking_not_open: false, fast_filling: false });
            }
        },
        // ... (rest same as before)
        {
            label: 'Not Open',
            name: 'booking_not_open',
            onChange: (checked) => {
                if (checked) form.setFieldsValue({ sold_out: false, fast_filling: false });
            }
        },
        {
            label: 'Fast Filling',
            name: 'fast_filling',
            onChange: (checked) => {
                if (checked) form.setFieldsValue({ sold_out: false, booking_not_open: false });
            }
        },
        { label: 'Modify Area', name: 'modify_access_area' },
        { label: 'Active', name: 'status' },
        { label: 'Allow Agent', name: 'allow_agent' },
        { label: 'Allow POS', name: 'allow_pos' },
    ];

    // Check sale value change
    const saleValue = Form.useWatch('sale', form);
    useEffect(() => {
        if (saleValue !== undefined) {
            setSaleEnabled(saleValue);
            if (saleValue) {
                setTimeout(() => saleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
            }
        }
    }, [saleValue]);

    // Table columns (same as before)
    const columns = [
        {
            title: 'Ticket',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="fw-semibold">{text}</span>
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            // render: (price, record) => `${getCurrencySymbol(record.currency)}${price}`
            render: (price, record) => `₹${price}`
        },
        { title: 'Quantity', dataIndex: 'ticket_quantity', key: 'ticket_quantity' },
        {
            title: 'Sold',
            key: 'sold',
            render: (_, record) => {
                const soldExplicit = record.sold_count ?? record.sold_tickets ?? record.sold ?? null;
                if (soldExplicit !== null) return soldExplicit;
                const total = Number(record.ticket_quantity || 0);
                const remaining = Number(record.remaining_count ?? 0);
                return Math.max(0, total - remaining);
            }
        },
        {
            title: 'Remaining',
            key: 'remaining',
            render: (_, record) => record.remaining_count ?? record.remaining_quantity
        },
        {
            title: 'Sale',
            render: (_, record) => record.sale ? <Tag color="green">{getCurrencySymbol(record.currency)}{record.sale_price}</Tag> : <Tag>No Sale</Tag>
        },
        {
            title: 'Status',
            render: (_, record) => (
                <Space>
                    {record.sold_out && <Tag color="red">Sold Out</Tag>}
                    {record.booking_not_open && <Tag color="blue">Not Open</Tag>}
                    {record.status ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />}
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
                    </Tooltip>
                    <PermissionChecker permissions="Delete Ticket">
                        <Tooltip title="Delete">
                            <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} size="small" />
                        </Tooltip>
                    </PermissionChecker>
                </Space>
            ),
        }
    ];

    return (
        <>
            <Row justify="space-between" align="middle" className="mb-3">
                <Col>{showEventName && <h4 className="mb-0">Tickets for {eventName}</h4>}</Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New Ticket</Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={tickets}
                loading={ticketsLoading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editMode ? 'Edit Ticket' : 'Create New Ticket'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={submitting}
                width={'80%'}
                okText={editMode ? 'Update' : 'Create'}
                style={{ top: 20 }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={20} xl={20} style={{ maxHeight: '65vh', overflow: 'auto' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{ currency: 'INR', status: true, taxes: 'Inclusive' }}
                        >
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item label="Ticket Title" name="ticket_title" rules={[{ required: true }]}>
                                        <Input />
                                    </Form.Item>
                                </Col>
                                {/* <Col xs={24} md={6}>
                                    <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
                                        <Select options={currencies} />
                                    </Form.Item>
                                </Col> */}
                                <Col xs={24} md={6}>
                                    <Form.Item label="Price" name="price" rules={[{ required: true }]}>
                                        <Input type='number' min={0} onChange={handlePriceChange} />
                                    </Form.Item>
                                </Col>

                                {selectedCurrency !== 'INR' && convertedPrice && (
                                    <Col xs={24}><Alert message={`~ ₹${convertedPrice}`} type="info" showIcon /></Col>
                                )}

                                <Col xs={24} md={6}>
                                    <Form.Item label="Total Quantity" name="quantity" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Booking Limit Per User" name="user_booking_limit" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item label="Ticket Selection Limit" name="booking_per_customer" rules={[{ required: true }]}>
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item label="Description" name="ticket_description">
                                        <TextArea rows={2} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item label="Tax Type" name="taxes" rules={[{ required: true }]}>
                                        <Select options={TAX_TYPES} />
                                    </Form.Item>
                                </Col>
                                {/* <Col xs={24} md={8}>
                                    <Form.Item label="Access Areas" name="access_area">
                                        <Select mode="multiple" options={areas} />
                                    </Form.Item>
                                </Col> */}
                                <Col xs={24} md={8}>
                                    <Form.Item label="Promocodes" name="promocode_codes">
                                        <Select mode="multiple" options={promocodes} />
                                    </Form.Item>
                                </Col>

                                {/* Ticket Background Image Section */}
                                <Col xs={24} md={8}>
                                    <Form.Item label="Ticket Background Image">
                                        <Card size="small" style={{ textAlign: 'center', borderColor: selectedMediaUrl ? '#1890ff' : '#d9d9d9' }}>
                                            {selectedMediaUrl ? (
                                                <div style={{ position: 'relative' }}>
                                                    <Image src={selectedMediaUrl} height={100} style={{ objectFit: 'contain' }} />
                                                    <div style={{ marginTop: 8 }}>
                                                        <Space>
                                                            <Button size="small" icon={<PictureOutlined />} onClick={() => setMediaPickerOpen(true)}>Change</Button>
                                                            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setSelectedMediaUrl('')}>Remove</Button>
                                                        </Space>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: 10 }}>
                                                    <Button onClick={() => setMediaPickerOpen(true)} icon={<PictureOutlined />}>Select from Gallery</Button>
                                                </div>
                                            )}
                                        </Card>
                                    </Form.Item>
                                </Col>

                                {/* Fallback Ticket Selection */}
                                <Col xs={24} md={16}>
                                    <Form.Item label="Or Select Fallback Image">
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', opacity: selectedMediaUrl ? 0.5 : 1, transition: '0.3s' }}>
                                            {fallbackTickets.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    onClick={() => !selectedMediaUrl && handleFallbackSelect(ticket.id)}
                                                    style={{
                                                        cursor: selectedMediaUrl ? 'not-allowed' : 'pointer',
                                                        border: selectedFallbackTicket === ticket.id
                                                            ? '3px solid #1890ff'
                                                            : '2px solid #f0f0f0',
                                                        borderRadius: 8,
                                                        padding: 2,
                                                        position: 'relative',
                                                        opacity: selectedFallbackTicket === ticket.id ? 1 : 0.7,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {ticket.default && <Tag color="green" style={{ position: 'absolute', top: 4, right: 4, zIndex: 1, fontSize: 10, lineHeight: '14px', height: 16, padding: '0 4px' }}>Default</Tag>}
                                                    {selectedFallbackTicket === ticket.id && (
                                                        <div style={{ position: 'absolute', bottom: -6, right: -6, background: '#1890ff', borderRadius: '50%', padding: 2, color: 'white', zIndex: 2 }}>
                                                            <CheckOutlined style={{ fontSize: 10 }} />
                                                        </div>
                                                    )}
                                                    <Image
                                                        src={ticket.image}
                                                        width={60}
                                                        height={100}
                                                        style={{ objectFit: 'cover', borderRadius: 4 }}
                                                        preview={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {selectedMediaUrl && <Text type="secondary" style={{ fontSize: 12 }}>* Disable custom image to select fallback</Text>}
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Space size="large" wrap>
                                        {switchesConfig.map(config => (
                                            <Form.Item key={config.name} label={config.label} name={config.name} valuePropName="checked" style={{ marginBottom: 0 }}>
                                                <Switch onChange={config.onChange} />
                                            </Form.Item>
                                        ))}
                                    </Space>
                                </Col>

                                <Col xs={24} className='py-2' ref={saleSectionRef} hidden={!saleEnabled}>
                                    <Alert message="Sale Pricing Active" type="info" showIcon />
                                </Col>

                                {saleEnabled && (
                                    <>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Sale Period" name="sale_dates" rules={[{ required: saleEnabled }]}>
                                                <RangePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item label="Sale Price" name="sale_price" rules={[{ required: saleEnabled }]}>
                                                <Input type='number' min={0} />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Form>
                    </Col>

                    {/* Preview Panel */}
                    <Col xs={24} md={4} xl={4} className="d-none d-sm-block">
                        <div className="bg-light p-3 rounded text-center">
                            <h6 className="mb-3">Preview</h6>
                            <Image
                                src={getCurrentPreviewImage()}
                                alt="Preview"
                                width={'100%'}
                                style={{ borderRadius: 8, maxWidth: 300, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <div className="mt-2 text-muted small">300x750 px</div>
                        </div>
                    </Col>
                </Row>
            </Modal>

            <MediaGalleryPickerModal
                open={mediaPickerOpen}
                onCancel={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={false}
                title="Select Ticket Background"
                dimensionValidation={{ width: 300, height: 750, strict: true }}
                value={selectedMediaUrl}
            />
        </>
    );
};

export default TicketManager;