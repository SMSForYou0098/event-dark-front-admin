// components/TicketManager.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal, Form, Input, Select, Upload, Button, Table, Space,
    Switch, DatePicker, InputNumber, Row, Col, Alert, message,
    Card, Tag, Tooltip, Image
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    DollarOutlined, PercentageOutlined, TicketOutlined
} from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';
import apiClient from 'auth/FetchInterceptor';
import moment from 'moment';
import axios from 'axios';

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
    const [imagePreviewUrl, setImagePreviewUrl] = useState(''); // Added preview state
    const [convertedPrice, setConvertedPrice] = useState('');
    const [saleEnabled, setSaleEnabled] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('INR');
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
        try {
            const response = await apiClient.get(`promo-list/${UserData?.id}`);
            const promoOptions = (response.promoCodes || []).map(promo => ({
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

    // Currency conversion
    useEffect(() => {
        const price = form.getFieldValue('price');
        if (price && selectedCurrency !== 'INR') {
            axios.get(`https://open.er-api.com/v6/latest/${selectedCurrency}`)
                .then(response => {
                    const rate = response.data.rates.INR;
                    setConvertedPrice((price * rate).toFixed(2));
                })
                .catch(() => setConvertedPrice(''));
        } else {
            setConvertedPrice('');
        }
    }, [form.getFieldValue('price'), selectedCurrency]);

    // Handle create new ticket
    const handleCreate = () => {
        setEditMode(false);
        setEditingTicket(null);
        form.resetFields();
        setImageFileList([]);
        setImagePreviewUrl(''); // Reset preview
        setSaleEnabled(false);
        setModalVisible(true);
    };

    // Handle edit ticket
    const handleEdit = (ticket) => {
        setEditMode(true);
        setEditingTicket(ticket);

        // Set form values
        form.setFieldsValue({
            ticket_title: ticket.name,
            price: ticket.price,
            currency: ticket.currency,
            ticket_quantity: ticket.ticket_quantity,
            booking_per_customer: ticket.booking_per_customer,
            user_booking_limit: ticket.user_booking_limit,
            ticket_description: ticket.description,
            taxes: ticket.taxes,
            access_area: ticket.access_area || [],
            promocode_codes: ticket.promocode_ids || [],
            sold_out: ticket.sold_out === 1,
            booking_not_open: ticket.booking_not_open === 1,
            fast_filling: ticket.fast_filling === 1,
            modify_access_area: ticket.modify_as === 1,
            status: ticket.status === 1,
            sale: ticket.sale === 1,
            sale_price: ticket.sale_price,
        });

        // Set sale dates if exists
        if (ticket.sale === 1 && ticket.sale_date) {
            const [startDate, endDate] = ticket.sale_date.split(',');
            if (startDate && endDate) {
                form.setFieldValue('sale_dates', [moment(startDate), moment(endDate)]);
            }
        }

        // Set image
        if (ticket.background_image) {
            setImageFileList([{
                uid: '-1',
                name: 'image.jpg',
                status: 'done',
                url: ticket.background_image,
            }]);
            setImagePreviewUrl(ticket.background_image); // Set preview URL
        }

        setSaleEnabled(ticket.sale === 1);
        setSelectedCurrency(ticket.currency);
        setModalVisible(true);
    };

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
            const formData = new FormData();

            // Basic fields
            formData.append('ticket_title', values.ticket_title);
            formData.append('price', values.price);
            formData.append('currency', values.currency);
            formData.append('ticket_quantity', values.ticket_quantity);
            formData.append('booking_per_customer', values.booking_per_customer);
            formData.append('user_booking_limit', values.user_booking_limit);
            formData.append('ticket_description', values.ticket_description || '');
            formData.append('taxes', values.taxes);

            // Arrays
            formData.append('access_area', JSON.stringify(values.access_area || []));
            formData.append('promocode_codes', JSON.stringify(values.promocode_codes || []));

            // Booleans
            formData.append('sold_out', values.sold_out ? 1 : 0);
            formData.append('booking_not_open', values.booking_not_open ? 1 : 0);
            formData.append('fast_filling', values.fast_filling ? 1 : 0);
            formData.append('modify_access_area', values.modify_access_area ? 1 : 0);
            formData.append('status', values.status ? 1 : 0);
            formData.append('sale', saleEnabled ? 1 : 0);

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

    // Image upload props
    const imageUploadProps = {
        beforeUpload: (file) => {
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
            return false;
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
            }
        },
        onRemove: () => {
            setImageFileList([]);
            setImagePreviewUrl(''); // Clear preview on remove
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
                    {record.status === 0 && <Tag color="red">Inactive</Tag>}
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
            title: 'Sale',
            key: 'sale',
            render: (_, record) => (
                record.sale === 1 ? (
                    <Tag color="green">
                        {getCurrencySymbol(record.currency)}{record.sale_price}
                    </Tag>
                ) : (
                    <Tag>No Sale</Tag>
                )
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Space size="small">
                    {record.sold_out === 1 && <Tag color="red">Sold Out</Tag>}
                    {record.fast_filling === 1 && <Tag color="orange">Fast Filling</Tag>}
                    {record.booking_not_open === 1 && <Tag color="blue">Not Open</Tag>}
                </Space>
            )
        },
        {
            title: 'Action',
            key: 'action',
            fixed : 'right',
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
                    <Tooltip title="Delete">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
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
                        size="large"
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
                style={{ top: 20 }}
            >
                <Row gutter={16}>
                    <Col xs={24} md={20} xl={20} style={{maxHeight:'65vh', overflow : 'auto'}}>
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
                                        {/* <InputNumber
                                            style={{ width: '100%' }}
                                            min={0}
                                            prefix={<DollarOutlined />}
                                        /> */}
                                        <Input
                                                    type='number'
                                                    style={{ width: '100%' }}
                                                    min={0}
                                                    // prefix={<PercentageOutlined />}
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
                                        name="ticket_quantity"
                                        rules={[{ required: true, message: 'Required' }]}
                                    >
                                        <InputNumber style={{ width: '100%' }} min={1} />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label="Tickets Per Booking"
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
                                    <Form.Item label="Ticket Background Image">
                                        <Upload {...imageUploadProps}>
                                            {imageFileList.length < 1 && (
                                                <div>
                                                    <UploadOutlined />
                                                    <div style={{ marginTop: 8 }}>Upload Image</div>
                                                </div>
                                            )}
                                        </Upload>
                                    </Form.Item>
                                </Col>

                                {/* Switches */}
                                <Col xs={24}>
                                    <Space size="large" wrap>
                                        {[
                                            { label: 'Sale', name: 'sale', onChange: (checked) => {
                setSaleEnabled(checked);
                // Scroll to sale section when enabled
                if (checked) {
                    setTimeout(() => {
                        saleSectionRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest' 
                        });
                    }, 100);
                }
            }
         },
                                            { label: 'Sold Out', name: 'sold_out' },
                                            { label: 'Not Open', name: 'booking_not_open' },
                                            { label: 'Fast Filling', name: 'fast_filling' },
                                            { label: 'Modify Area', name: 'modify_access_area' },
                                            { label: 'Active', name: 'status' },
                                        ].map((config) => (
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
                                        <Col xs={24} className='py-2'>
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
                                                <RangePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Col>

                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                label="Sale Price"
                                                name="sale_price"
                                                rules={[{ required: saleEnabled, message: 'Enter sale price' }]}
                                            >
                                                <Input
                                                    type='number'
                                                    style={{ width: '100%' }}
                                                    min={0}
                                                    // prefix={<PercentageOutlined />}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </Form>
                    </Col>
                    {/* Image Preview Section */}
                    <Col xs={24} md={4} xl={4} className='d-none d-sm-block'>
                        <div className="image-preview-container bg-transparent">
                            <h5>Ticket Preview:</h5>
                            <Image
                                src={imagePreviewUrl || 'https://placehold.co/300x600'}
                                alt="Ticket Background Preview"
                                style={{
                                    borderRadius: '5px',
                                    marginTop: '10px',
                                    width: '100%',
                                    maxWidth: '300px'
                                }}
                                preview={!!imagePreviewUrl}
                            />
                        </div>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default TicketManager;