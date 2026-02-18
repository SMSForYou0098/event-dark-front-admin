// TicketManager.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Modal, Form, Input, Select, Button, Space,
    Switch, DatePicker, InputNumber, Row, Col, Alert, message,
    Tag, Tooltip, Image, Card, Typography
} from 'antd';
import DataTable from 'views/events/common/DataTable';
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
import usePermission from 'utils/hooks/usePermission';

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

    // Check if user can view booking counts (Admin OR has "View Tickets Overview" permission)
    const canViewBookingCounts = usePermission('View Tickets Overview', 'Admin', 'OR');

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

    // Check if the event uses preprinted cards
    const usePreprintedCards = useMemo(() => {
        return tickets?.[0]?.event?.event_controls?.use_preprinted_cards === true;
    }, [tickets]);

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
            prefix: ticket.prefix || '',
            currency: ticket.currency || 'INR',
            selection_limit: ticket?.selection_limit,
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
            if (usePreprintedCards) {
                formData.append('ticket_quantity', editMode ? editingTicket?.ticket_quantity : 1);
                formData.append('selection_limit', 1);
                formData.append('prefix', values.prefix || '');
            } else {
                formData.append('ticket_quantity', values.quantity);
                formData.append('selection_limit', values.selection_limit);
            }
            formData.append('booking_per_customer', values.booking_per_customer);
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

            if (selectedMediaUrl) {
                formData.append('background_image', selectedMediaUrl);
            } else if (selectedFallbackTicket) {
                const fallbackImg = fallbackTickets.find(t => t.id === selectedFallbackTicket);
                if (fallbackImg?.image) {
                    formData.append('background_image', fallbackImg.image);
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

    // Get event date range from ticket object (works for both create and edit mode)
    const getEventDateRange = useCallback(() => {
        // For edit mode, get from editingTicket
        if (editMode && editingTicket?.event?.date_range) {
            return editingTicket.event.date_range;
        }
        // For create mode, get from first ticket in tickets array
        if (tickets.length > 0 && tickets[0]?.event?.date_range) {
            return tickets[0].event.date_range;
        }
        return null;
    }, [editMode, editingTicket, tickets]);

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

    // Booking count columns (only for Admin or users with "View Tickets Overview" permission)
    const bookingCountColumns = canViewBookingCounts ? [
        {
            title: 'T Booking',
            key: 'total_bookings',
            render: (_, record) => record.total_bookings_count ?? 0
        },
        {
            title: 'Online',
            key: 'online_bookings',
            render: (_, record) => record.online_bookings_count ?? 0
        },
        {
            title: 'Offline',
            key: 'offline_bookings',
            render: (_, record) => (record.pos_bookings_count ?? 0) + (record.agent_bookings_count ?? 0)
        },
        {
            title: 'Agent',
            key: 'agent_bookings',
            render: (_, record) => record.agent_bookings_count ?? 0
        },
        {
            title: 'POS',
            key: 'pos_bookings',
            render: (_, record) => record.pos_bookings_count ?? 0
        },
        {
            title: 'Sponsor',
            key: 'sponsor_bookings',
            render: (_, record) => record.sponsor_bookings_count ?? 0
        },
        // {
        //     title: 'Complimentary',
        //     key: 'complimentary_bookings',
        //     render: (_, record) => (record.complimentary_bookings_count ?? 0) + (record.complimentary_table_bookings_count ?? 0)
        // },
        // {
        //     title: 'Corporate',
        //     key: 'corporate_bookings',
        //     render: (_, record) => record.corporate_bookings_count ?? 0
        // },
        // {
        //     title: 'Pending',
        //     key: 'pending_bookings',
        //     render: (_, record) => (record.pending_bookings_count ?? 0) + (record.pending_registration_bookings_count ?? 0)
        // },
    ] : [];

    // Table columns
    const columns = [
        {
            title: 'Ticket',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            render: (text) => <span className="fw-semibold">{text}</span>
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            align: 'center',
            // render: (price, record) => `${getCurrencySymbol(record.currency)}${price}`
            render: (price, record) => `₹${price}`
        },
        { title: 'Quantity', dataIndex: 'ticket_quantity', key: 'ticket_quantity', align: 'center' },
        {
            title: 'Sold',
            key: 'sold',
            align: 'center',
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
            align: 'center',
            render: (_, record) => record.remaining_count ?? record.remaining_quantity
        },
        ...bookingCountColumns,
        {
            title: 'Sale',
            align: 'center',
            render: (_, record) => record.sale ? <Tag color="green">{getCurrencySymbol(record.currency)}{record.sale_price}</Tag> : <Tag>No Sale</Tag>
        },
        {
            title: 'Status',
            align: 'center',
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
            align: 'center',
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
            <DataTable
                title={showEventName ? `${eventName} - Tickets` : 'Tickets'}
                data={tickets}
                columns={columns}
                loading={ticketsLoading}
                showSearch={true}
                enableSearch={true}
                defaultPageSize={10}
                extraHeaderContent={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>New</Button>
                }
                tableProps={{
                    rowKey: 'id',
                    scroll: { x: 'max-content' },
                    size: 'small',
                    className: 'compact-ticket-table',
                }}
            />
            <style>{`
                .compact-ticket-table .ant-table-thead > tr > th {
                    font-size: 12px !important;
                    // padding: 8px !important;
                }
                .compact-ticket-table .ant-table-tbody > tr > td {
                    // padding: 8px !important;
                    font-size: 13px;
                }
                .compact-ticket-table .ant-table-thead > tr.ant-table-row-filter {
                    display: none;
                }
                .compact-ticket-table .ant-table-filter-trigger-container {
                    display: none !important;
                }
            `}</style>

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

                                {usePreprintedCards ? (
                                    <Col xs={24} md={6}>
                                        <Form.Item
                                            label="Card Prefix"
                                            name="prefix"
                                            rules={[{ required: true, message: 'Please enter card prefix' }]}
                                        >
                                            <Input placeholder="Enter card prefix" />
                                        </Form.Item>
                                    </Col>
                                ) : (
                                    <>

                                        <Col xs={24} md={6}>
                                            <Form.Item
                                                label="Total Quantity"
                                                name="quantity"
                                                rules={[
                                                    { required: true, message: 'Please enter total quantity' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            const selectionLimit = getFieldValue('selection_limit');
                                                            const bookingPerCustomer = getFieldValue('booking_per_customer');

                                                            if (!value) return Promise.resolve();

                                                            if (selectionLimit && value < selectionLimit) {
                                                                return Promise.reject(new Error(`Total quantity (${value}) must be greater than or equal to booking limit per user (${selectionLimit})`));
                                                            }

                                                            if (bookingPerCustomer && value < bookingPerCustomer) {
                                                                return Promise.reject(new Error(`Total quantity (${value}) must be greater than or equal to ticket selection limit (${bookingPerCustomer})`));
                                                            }

                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <InputNumber style={{ width: '100%' }} min={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Ticket Selection Limit"
                                                name="selection_limit"
                                                rules={[
                                                    { required: true, message: 'Please enter ticket selection limit' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            const bookingPerCustomer = getFieldValue('booking_per_customer');

                                                            if (!value) return Promise.resolve();

                                                            if (bookingPerCustomer && value > bookingPerCustomer) {
                                                                return Promise.reject(new Error(`Ticket selection limit (${value}) must be less than or equal to booking limit per user (${bookingPerCustomer})`));
                                                            }

                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                                dependencies={['booking_per_customer']}
                                            >
                                                <InputNumber style={{ width: '100%' }} min={1} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <Form.Item
                                                label="Booking Limit Per User"
                                                name="booking_per_customer"
                                                rules={[
                                                    { required: true, message: 'Please enter booking limit per user' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            const quantity = getFieldValue('quantity');
                                                            const selectionLimit = getFieldValue('selection_limit');

                                                            if (!value) return Promise.resolve();

                                                            if (quantity && value > quantity) {
                                                                return Promise.reject(new Error(`Booking limit per user (${value}) must be less than or equal to total quantity (${quantity})`));
                                                            }

                                                            if (selectionLimit && selectionLimit > value) {
                                                                return Promise.reject(new Error(`Booking limit per user (${value}) must be greater than or equal to ticket selection limit (${selectionLimit})`));
                                                            }

                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                                dependencies={['quantity', 'selection_limit']}
                                            >
                                                <InputNumber style={{ width: '100%' }} min={1} />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                                {
                                    usePreprintedCards && !editMode && <Col xs={24} md={8}>
                                        <Form.Item
                                            label="Booking Limit Per User"
                                            name="booking_per_customer"
                                            rules={[
                                                { required: true, message: 'Please enter booking limit per user' },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const quantity = getFieldValue('quantity');
                                                        const selectionLimit = getFieldValue('selection_limit');

                                                        if (!value) return Promise.resolve();

                                                        if (quantity && value > quantity) {
                                                            return Promise.reject(new Error(`Booking limit per user (${value}) must be less than or equal to total quantity (${quantity})`));
                                                        }

                                                        if (selectionLimit && selectionLimit > value) {
                                                            return Promise.reject(new Error(`Booking limit per user (${value}) must be greater than or equal to ticket selection limit (${selectionLimit})`));
                                                        }

                                                        return Promise.resolve();
                                                    },
                                                }),
                                            ]}
                                            dependencies={['quantity', 'selection_limit']}
                                        >
                                            <InputNumber style={{ width: '100%' }} min={1} />
                                        </Form.Item>
                                    </Col>
                                }

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
                                            <Form.Item
                                                label="Sale Period"
                                                name="sale_dates"
                                                rules={[
                                                    { required: saleEnabled, message: 'Please select sale period' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value || !value.length) {
                                                                return Promise.resolve();
                                                            }

                                                            const eventDateRange = getEventDateRange();
                                                            if (!eventDateRange) {
                                                                return Promise.resolve();
                                                            }

                                                            const [eventStartStr] = eventDateRange.split(',');
                                                            const eventStart = dayjs(eventStartStr.trim()).startOf('day');
                                                            const [saleStart, saleEnd] = value;

                                                            if (!saleStart || !saleEnd) {
                                                                return Promise.resolve();
                                                            }

                                                            const saleStartDate = dayjs(saleStart).startOf('day');
                                                            const saleEndDate = dayjs(saleEnd).startOf('day');

                                                            // Check if sale end date is on or after event start date
                                                            if (saleEndDate.isAfter(eventStart) || saleEndDate.isSame(eventStart)) {
                                                                return Promise.reject(new Error(`Sale period must end before event date (${eventStart.format('YYYY-MM-DD')})`));
                                                            }

                                                            // Check if sale start date is on or after event start date
                                                            if (saleStartDate.isAfter(eventStart) || saleStartDate.isSame(eventStart)) {
                                                                return Promise.reject(new Error(`Sale period must start before event date (${eventStart.format('YYYY-MM-DD')})`));
                                                            }

                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                            >
                                                <RangePicker
                                                    style={{ width: '100%' }}
                                                    disabledDate={(current) => {
                                                        if (!current) return false;

                                                        const eventDateRange = getEventDateRange();
                                                        if (!eventDateRange) return false;

                                                        const [startDate] = eventDateRange.split(',');
                                                        const eventStart = dayjs(startDate.trim()).startOf('day');
                                                        const currentDate = dayjs(current).startOf('day');

                                                        // Disable dates on or after event start date
                                                        // Sale period must be before the event starts
                                                        return currentDate.isAfter(eventStart) || currentDate.isSame(eventStart);
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Sale Price"
                                                name="sale_price"
                                                rules={[
                                                    { required: saleEnabled, message: 'Please enter sale price' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            const regularPrice = getFieldValue('price');

                                                            if (!value) return Promise.resolve();

                                                            if (regularPrice && parseFloat(value) > parseFloat(regularPrice)) {
                                                                return Promise.reject(new Error(`Sale price (${value}) cannot be greater than regular price (${regularPrice})`));
                                                            }

                                                            return Promise.resolve();
                                                        },
                                                    }),
                                                ]}
                                                dependencies={['price']}
                                            >
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