// components/TicketManager.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal, Form, Input, Select, Upload, Button, Table, Space,
    Switch, DatePicker, InputNumber, Row, Col, Alert, message,
    Tag, Tooltip, Image
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    CloseOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import axios from 'axios';
import dayjs from 'dayjs';
import PermissionChecker from 'layouts/PermissionChecker';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const TAX_TYPES = [
    { value: 'Inclusive', label: 'Inclusive' },
    { value: 'Exclusive', label: 'Exclusive' },
];

const TicketManager = ({ eventId, eventName, showEventName = true }) => {
    const { UserData, getCurrencySymbol } = useMyContext();
    const [form] = Form.useForm();

    // State management
    const [tickets, setTickets] = useState([]);
    const [areas, setAreas] = useState([]);
    const [promocodes, setPromocodes] = useState([]);
    const [currencies, setCurrencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingTicket, setEditingTicket] = useState(null);
    const [imageFileList, setImageFileList] = useState([]);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [convertedPrice, setConvertedPrice] = useState('');
    const [saleEnabled, setSaleEnabled] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('INR');
    const [imageValidationError, setImageValidationError] = useState('');
    const [priceValue, setPriceValue] = useState('');
    const saleSectionRef = useRef(null);

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const response = await apiClient.get(`tickets/${eventId}`);
            if (response.status) {
                setTickets(response.tickets || []);
            }
        } catch (error) {
            message.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    // Fetch access areas
    const fetchAreas = useCallback(async () => {
        if (!eventId) return;
        try {
            const response = await apiClient.get(`accessarea-list/${eventId}`);
            const areaOptions = (response.data || []).map(area => ({
                value: area.id,
                label: area.title
            }));
            setAreas(areaOptions);
        } catch (error) {
            console.error('Failed to fetch areas');
        }
    }, [eventId]);

    // Fetch promocodes
    const fetchPromocodes = useCallback(async () => {
        if (!UserData?.id) return;
        try {
            const response = await apiClient.get(`promo-list/${UserData?.id}`);
            const promoOptions = (response?.promoCodes || []).map(promo => ({
                value: promo.id,
                label: promo.code
            }));
            setPromocodes(promoOptions);
        } catch (error) {
            console.error('Failed to fetch promocodes');
        }
    }, [UserData?.id]);

    // Fetch currencies
    const fetchCurrencies = useCallback(async () => {
        try {
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
            const currencyOptions = Object.keys(response.data.rates).map(cur => ({
                value: cur,
                label: cur
            }));
            setCurrencies(currencyOptions);
        } catch (error) {
            console.error('Failed to fetch currencies');
        }
    }, []);

    // Initialize data
    useEffect(() => {
        if (eventId) {
            fetchTickets();
            fetchAreas();
            fetchPromocodes();
            fetchCurrencies();
        }
    }, [eventId, fetchTickets, fetchAreas, fetchPromocodes, fetchCurrencies]);

    // Currency conversion - triggered by priceValue and selectedCurrency changes
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

    // Handle price change
    const handlePriceChange = (e) => {
        const value = e.target.value;
        setPriceValue(value);
    };

    // Validate image dimensions
    const validateImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new window.Image();
                img.src = e.target.result;
                img.onload = () => {
                    const { width, height } = img;
                    if (width === 300 && height === 600) {
                        setImageValidationError('');
                        resolve(true);
                    } else {
                        setImageValidationError(`Image must be exactly 300x600 pixels. Current: ${width}x${height}`);
                        reject(new Error('Invalid dimensions'));
                    }
                };
                img.onerror = () => {
                    setImageValidationError('Failed to load image');
                    reject(new Error('Failed to load image'));
                };
            };
            reader.onerror = () => {
                setImageValidationError('Failed to read file');
                reject(new Error('Failed to read file'));
            };
        });
    };

    // Handle create new ticket
    const handleCreate = () => {
        setEditMode(false);
        setEditingTicket(null);
        form.resetFields();
        setImageFileList([]);
        setImagePreviewUrl('');
        setSaleEnabled(false);
        setImageValidationError('');
        setPriceValue('');
        setConvertedPrice('');
        setModalVisible(true);
    };

    // Handle edit ticket
    const handleEdit = useCallback((ticket) => {
        setEditMode(true);
        setEditingTicket(ticket);
        setModalVisible(true);

        // Prepare sale dates if they exist
        let saleDates = null;
        if (ticket.sale_date) {
            const [startDate, endDate] = ticket.sale_date.split(',');
            if (startDate && endDate) {
                saleDates = [dayjs(startDate.trim()), dayjs(endDate.trim())];
            }
        }

        // Set sale enabled state BEFORE setting form values
        const hasSaleData = ticket.sale === 1 || ticket.sale === true;
        setSaleEnabled(hasSaleData);

        // Set form values
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
            promocode_codes: ticket.promocode_ids
                ? JSON.parse(ticket.promocode_ids)
                : [],
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

        // Handle image preview - FIXED: Use background_image from API
        const imageUrl = ticket.background_image || ticket.ticket_image;
        if (imageUrl) {
            setImagePreviewUrl(imageUrl);
            setImageFileList([{
                uid: '-1',
                name: 'ticket-image.jpg',
                status: 'done',
                url: imageUrl,
            }]);
        } else {
            setImagePreviewUrl('');
            setImageFileList([]);
        }

        setSelectedCurrency(ticket.currency || 'INR');
        setPriceValue(ticket.price);

        // Update tickets array so the main table shows the same fallback values
        // (form.setFieldsValue only updates the form, not the table data source)
        setTickets(prev => prev.map(t => {
            if (!t) return t;
            if (t.id === ticket.id) {
                return {
                    ...t,
                    remaining_quantity: ticket?.remaining_quantity ?? 50,
                };
            }
            return t;
        }));
    }, [form]);

    // Handle delete ticket
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
                    fetchTickets();
                } catch (error) {
                    message.error('Failed to delete ticket');
                }
            },
        });
    };

    // Handle form submit
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // console.log(values)
            const formData = new FormData();
            // Basic fields
            formData.append('ticket_title', values.ticket_title);
            formData.append('price', values.price);
            formData.append('currency', values.currency);
            formData.append('ticket_quantity', values.quantity);
            formData.append('booking_per_customer', values.booking_per_customer);
            formData.append('user_booking_limit', values.user_booking_limit);
            formData.append('ticket_description', values.ticket_description || '');
            formData.append('taxes', values.taxes);

            // Arrays
            formData.append('access_area', JSON.stringify(values.access_area || []));
            // formData.append('promocode_codes', JSON.stringify(values.promocode_codes || []));
            if (values.promocode_codes && values.promocode_codes.length > 0) {
                formData.append('promocode_codes', JSON.stringify(values.promocode_codes));
            }


            // Booleans
            formData.append('sold_out', values.sold_out);
            formData.append('allow_pos', values.allow_pos);
            formData.append('allow_agent', values.allow_agent);
            formData.append('booking_not_open', values.booking_not_open);
            formData.append('fast_filling', values.fast_filling);
            formData.append('modify_access_area', values.modify_access_area);
            formData.append('status', values.status);
            formData.append('sale', saleEnabled);

            // Sale data
            if (saleEnabled && values.sale_dates) {
                const [start, end] = values.sale_dates;
                formData.append('sale_date', [
                    start.format('YYYY-MM-DD'),
                    end.format('YYYY-MM-DD')
                ].join(','));
                formData.append('sale_price', values.sale_price);
            }

            // Image
            const newImage = imageFileList.find(file => file.originFileObj);
            if (newImage) {
                formData.append('background_image', newImage.originFileObj);
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
                fetchTickets();
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save ticket');
        } finally {
            setLoading(false);
        }
    };

    // Check if form can be submitted
    const canSubmit = () => {
        // If there's an image uploaded but it has validation error, disable submit
        if (imageFileList.length > 0 && imageValidationError) {
            return false;
        }
        return true;
    };

    // Image upload props
    const imageUploadProps = {
        beforeUpload: async (file) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return Upload.LIST_IGNORE;
            }
            const isLt5M = file.size / 1024 / 1024 < 5;
            if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
                return Upload.LIST_IGNORE;
            }

            try {
                await validateImageDimensions(file);
                return false;
            } catch (error) {
                message.error('Image must be exactly 300x600 pixels');
                return Upload.LIST_IGNORE;
            }
        },
        onChange: ({ fileList }) => {
            setImageFileList(fileList.slice(-1));
            // Update preview URL when file changes
            if (fileList.length > 0) {
                const file = fileList[0];
                if (file.originFileObj) {
                    setImagePreviewUrl(URL.createObjectURL(file.originFileObj));
                } else if (file.url) {
                    setImagePreviewUrl(file.url);
                }
            } else {
                setImagePreviewUrl('');
                setImageValidationError('');
            }
        },
        onRemove: () => {
            setImageFileList([]);
            setImagePreviewUrl('');
            setImageValidationError('');
        },
        fileList: imageFileList,
        maxCount: 1,
        listType: 'picture-card',
    };

    // Table columns
    const columns = [
        {
            title: 'Ticket',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <span className="fw-semibold">{text}</span>
                </Space>
            )
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price, record) => (
                `${getCurrencySymbol(record.currency)}${price}`
            )
        },
        {
            title: 'Quantity',
            dataIndex: 'ticket_quantity',
            key: 'ticket_quantity',
        },
        {
            title: 'Sold',
            key: 'sold',
            render: (_, record) => {
                // Prefer explicit sold_count if provided, otherwise compute from ticket_quantity - remaining_count
                const soldExplicit = record.sold_count ?? record.sold_tickets ?? record.sold ?? null;
                if (soldExplicit !== null && soldExplicit !== undefined) return soldExplicit;

                const total = Number(record.ticket_quantity ?? record.ticket_qty ?? 0);
                const remaining = Number(record.remaining_count ?? record.remaining_quantity ?? record.remaining_qty ?? 0);
                const soldComputed = Number.isFinite(total) && Number.isFinite(remaining) ? Math.max(0, total - remaining) : '-';
                return soldComputed;
            }
        },
        {
            title: 'Remaining Quantity',
            dataIndex: 'remaining_quantity',
            key: 'remaining_quantity',
            render: (val, record) => {
                // Prefer explicit remaining fields in order of likelihood
                const remainingExplicit = record.remaining_count ?? record.remaining_quantity ?? record.remaining_qty;
                if (remainingExplicit !== undefined && remainingExplicit !== null) return remainingExplicit;

                // Fallback: compute remaining from available - sold
                const avail = Number(record.available_quantity ?? record.available_qty ?? record.ticket_quantity ?? 0);
                const sold = Number(record.sold_count ?? record.sold_tickets ?? record.sold ?? 0);
                const computed = Number.isFinite(avail) && Number.isFinite(sold) ? Math.max(0, avail - sold) : '-';
                return computed;
            }
        },
        {
            title: 'Sale',
            key: 'sale',
            render: (_, record) => (
                record.sale ? (
                    <Tag color="green">
                        {getCurrencySymbol(record.currency)}{record.sale_price}
                    </Tag>
                ) : (
                    <Tag>No Sale</Tag>
                )
            )
        },
        {
            title: 'Active',
            key: 'status',
            render: (_, record) => (
                record.status ? (
                    <Tag color="green">
                        <CheckOutlined className='m-0' />
                    </Tag>
                ) : (
                    <Tag color="red">
                        <CloseOutlined className='m-0' />
                    </Tag>
                )
            ),
        },
        {
            title: 'Status',
            key: null,
            render: (_, record) => (
                <Space size="small">
                    {record.sold_out && <Tag color="red">Sold Out</Tag>}
                    {record.fast_filling && <Tag color="orange">Fast Filling</Tag>}
                    {record.booking_not_open && <Tag color="blue">Not Open</Tag>}
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
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                            size="small"
                        />
                    </Tooltip>
                    <PermissionChecker permissions="Delete Ticket">

                        <Tooltip title="Delete">
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(record.id)}
                                size="small"
                            />
                        </Tooltip>
                    </PermissionChecker>
                </Space>
            ),
        },
    ];

    const saleValue = Form.useWatch('sale', form);

    // Update saleEnabled when form sale value changes
    useEffect(() => {
        if (saleValue !== undefined) {
            setSaleEnabled(saleValue);

            // Scroll to sale section when enabled
            if (saleValue) {
                setTimeout(() => {
                    saleSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest'
                    });
                }, 100);
            }
        }
    }, [saleValue]);

    const switchesConfig = [
        { label: 'Sale', name: 'sale' },
        {
            label: 'Sold Out',
            name: 'sold_out',
            onChange: (checked) => {
                if (checked) {
                    form.setFieldsValue({
                        booking_not_open: false,
                        fast_filling: false
                    });
                }
            }
        },
        {
            label: 'Not Open',
            name: 'booking_not_open',
            onChange: (checked) => {
                if (checked) {
                    form.setFieldsValue({
                        sold_out: false,
                        fast_filling: false
                    });
                }
            }
        },
        {
            label: 'Fast Filling',
            name: 'fast_filling',
            onChange: (checked) => {
                if (checked) {
                    form.setFieldsValue({
                        sold_out: false,
                        booking_not_open: false
                    });
                }
            }
        },
        { label: 'Modify Area', name: 'modify_access_area' },
        { label: 'Active', name: 'status' },
        { label: 'Allow Agent', name: 'allow_agent' },
        { label: 'Allow POS', name: 'allow_pos' },
    ];

    return (
        <>
            <Row justify="space-between" align="middle" className="mb-3">
                <Col>
                    {showEventName && <h4 className="mb-0">Tickets for {eventName}</h4>}
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                    >
                        New Ticket
                    </Button>
                </Col>
            </Row>

            <Table
                columns={columns}
                dataSource={tickets}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            />

            {/* Ticket Form Modal */}
            <Modal
                title={editMode ? 'Edit Ticket' : 'Create New Ticket'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                width={'80%'}
                okText={editMode ? 'Update' : 'Create'}
                okButtonProps={{ disabled: !canSubmit() }}
                style={{ top: 20 }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={20} xl={20} style={{ maxHeight: '65vh', overflow: 'auto' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{
                                currency: 'INR',
                                status: true,
                                taxes: 'Inclusive'
                            }}
                        >
                            <Row gutter={16}>
                                {/* Basic Info */}
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Ticket Title"
                                        name="ticket_title"
                                        rules={[{ required: true, message: 'Please enter ticket title' }]}
                                    >
                                        <Input placeholder="Enter ticket title" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={6}>
                                    <Form.Item
                                        label="Currency"
                                        name="currency"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            showSearch
                                            options={currencies}
                                            onChange={setSelectedCurrency}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={6}>
                                    <Form.Item
                                        label="Price"
                                        name="price"
                                        rules={[{ required: true, message: 'Please enter price' }]}
                                    >
                                        <Input
                                            type='number'
                                            style={{ width: '100%' }}
                                            min={0}
                                            onChange={handlePriceChange}
                                        />
                                    </Form.Item>
                                </Col>

                                {selectedCurrency !== 'INR' && convertedPrice && (
                                    <Col xs={24}>
                                        <Alert
                                            message={`Price in INR: ₹${convertedPrice}`}
                                            type="info"
                                            showIcon
                                        />
                                    </Col>
                                )}

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Total Quantity"
                                        name="quantity"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>

                                {/* Read-only Sold / Remaining display when editing */}
                                {editingTicket && (
                                    <>
                                        <Col xs={24} md={4}>
                                            <Form.Item label="Sold">
                                                <div style={{ padding: '6px 12px' }}>
                                                    {(() => {
                                                        const rec = editingTicket;
                                                        const soldExplicit = rec.sold_count ?? rec.sold_tickets ?? rec.sold ?? null;
                                                        if (soldExplicit !== null && soldExplicit !== undefined) return soldExplicit;
                                                        const total = Number(rec.ticket_quantity ?? rec.ticket_qty ?? 0);
                                                        const remaining = Number(rec.remaining_count ?? rec.remaining_quantity ?? rec.remaining_qty ?? 0);
                                                        return Number.isFinite(total) && Number.isFinite(remaining) ? Math.max(0, total - remaining) : '-';
                                                    })()}
                                                </div>
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={4}>
                                            <Form.Item label="Remaining">
                                                <div style={{ padding: '6px 12px' }}>
                                                    {(() => {
                                                        const rec = editingTicket;
                                                        const remainingExplicit = rec.remaining_count ?? rec.remaining_quantity ?? rec.remaining_qty;
                                                        if (remainingExplicit !== undefined && remainingExplicit !== null) return remainingExplicit;
                                                        const avail = Number(rec.available_quantity ?? rec.available_qty ?? rec.ticket_quantity ?? 0);
                                                        const sold = Number(rec.sold_count ?? rec.sold_tickets ?? rec.sold ?? 0);
                                                        return Number.isFinite(avail) && Number.isFinite(sold) ? Math.max(0, avail - sold) : '-';
                                                    })()}
                                                </div>
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Ticket Selection Limit"
                                        name="booking_per_customer"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Booking Limit Per User"
                                        name="user_booking_limit"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24}>
                                    <Form.Item
                                        label="Description"
                                        name="ticket_description"
                                    >
                                        <TextArea rows={2} placeholder="Enter ticket description" />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Tax Type"
                                        name="taxes"
                                        rules={[{ required: true }]}
                                    >
                                        <Select options={TAX_TYPES} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Access Areas"
                                        name="access_area"
                                    >
                                        <Select
                                            mode="multiple"
                                            options={areas}
                                            placeholder="Select areas"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Promocodes"
                                        name="promocode_codes"
                                    >
                                        <Select
                                            mode="multiple"
                                            options={promocodes}
                                            placeholder="Select promocodes"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label="Ticket Background Image (Optional)"
                                        validateStatus={imageValidationError ? 'error' : ''}
                                        help={imageValidationError || 'If uploading, image must be exactly 300x600 pixels'}
                                    >
                                        <Upload {...imageUploadProps}>
                                            {imageFileList.length < 1 && (
                                                <div>
                                                    <UploadOutlined />
                                                    <div style={{ marginTop: 8 }}>Upload Image (300x600)</div>
                                                </div>
                                            )}
                                        </Upload>
                                        {imageFileList.length > 0 && !imageValidationError && (
                                            <Alert
                                                message="✓ Image dimensions validated (300x600)"
                                                type="success"
                                                showIcon
                                                style={{ marginTop: 8 }}
                                            />
                                        )}
                                    </Form.Item>
                                </Col>

                                {/* Switches */}
                                <Col xs={24}>
                                    <Space size="large" wrap>
                                        {switchesConfig.map((config) => (
                                            <Form.Item
                                                key={config.name}
                                                label={config.label}
                                                name={config.name}
                                                valuePropName="checked"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Switch onChange={config.onChange} />
                                            </Form.Item>
                                        ))}
                                    </Space>
                                </Col>

                                {/* Sale Section */}
                                {saleEnabled && (
                                    <>
                                        <Col xs={24} className='py-2' ref={saleSectionRef}>
                                            <Alert
                                                message="Enter sale dates and price to activate sale pricing"
                                                type="info"
                                                showIcon
                                            />
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Sale Period"
                                                name="sale_dates"
                                                rules={[{ required: saleEnabled, message: 'Select sale dates' }]}
                                            >
                                                <RangePicker
                                                    style={{ width: '100%' }}
                                                    format="YYYY-MM-DD"
                                                    placeholder={['Start Date', 'End Date']}
                                                />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Sale Price"
                                                name="sale_price"
                                                rules={[
                                                    { required: saleEnabled, message: 'Enter sale price' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!saleEnabled) return Promise.resolve();
                                                            if (value === undefined || value === null || value === '') return Promise.resolve();
                                                            const salePrice = Number(value);
                                                            const ticketPrice = Number(getFieldValue('price'));
                                                            if (Number.isNaN(salePrice) || salePrice < 0) {
                                                                return Promise.reject(new Error('Enter a valid non-negative number'));
                                                            }
                                                            if (!Number.isNaN(ticketPrice) && salePrice > ticketPrice) {
                                                                return Promise.reject(new Error('Sale price cannot exceed ticket price'));
                                                            }
                                                            return Promise.resolve();
                                                        }
                                                    })
                                                ]}
                                            >
                                                <Input
                                                    type='number'
                                                    style={{ width: '100%' }}
                                                    min={0}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Form>
                    </Col>
                    {/* Image Preview Section */}
                    <Col xs={24} md={4} xl={4} className="d-none d-sm-block">
                        <div className="image-preview-container bg-transparent">
                            <h5>Ticket Preview:</h5>
                            <div className="rounded p-2 mt-2">
                                <Image
                                    src={imagePreviewUrl || 'https://placehold.co/300x600'}
                                    alt="Ticket Background Preview"
                                    className="rounded w-100"
                                    style={{
                                        maxWidth: '300px'
                                    }}
                                    preview={!!imagePreviewUrl}
                                />
                                <div className="text-center small text-muted mt-2">
                                    300x600 pixels
                                </div>
                            </div>
                        </div>
                    </Col>

                </Row>
            </Modal>
        </>
    );
};

export default TicketManager;