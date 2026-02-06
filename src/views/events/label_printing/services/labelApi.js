/**
 * Label Printing API Service
 * 
 * Dummy API for fetching label data for bulk printing.
 * Replace with actual API calls when backend is ready.
 */

// Simulated API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Dummy badge/attendee data with various structures
const DUMMY_BADGES = [
    {
        id: 1,
        token: 'TKN-2024-001',
        order_id: 'ORD-78901',
        firstName: 'Rahul',
        lastName: 'Sharma',
        company: 'TechCorp Solutions',
        designation: 'Senior Developer',
        phone: '+91 98765 43210',
        email: 'rahul.sharma@techcorp.com',
        stall: 'A-101',
        category: 'VIP',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 2,
        token: 'TKN-2024-002',
        order_id: 'ORD-78902',
        firstName: 'Priya',
        lastName: 'Patel',
        company: 'Innovation Labs',
        designation: 'Product Manager',
        phone: '+91 87654 32109',
        email: 'priya@innovationlabs.in',
        stall: 'B-205',
        category: 'Speaker',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 3,
        token: 'TKN-2024-003',
        order_id: 'ORD-78903',
        firstName: 'Amit',
        lastName: 'Kumar',
        company: 'Digital Dynamics',
        designation: 'CTO',
        phone: '+91 76543 21098',
        email: 'amit.kumar@digitaldynamics.com',
        stall: 'C-302',
        category: 'VIP',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 4,
        token: 'TKN-2024-004',
        order_id: 'ORD-78904',
        firstName: 'Sneha',
        lastName: 'Reddy',
        company: 'CloudNine Systems',
        designation: 'DevOps Engineer',
        phone: '+91 65432 10987',
        email: 'sneha@cloudnine.io',
        stall: 'A-102',
        category: 'Attendee',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 5,
        token: 'TKN-2024-005',
        order_id: 'ORD-78905',
        firstName: 'Vikram',
        lastName: 'Singh',
        company: 'DataStream Analytics',
        designation: 'Data Scientist',
        phone: '+91 54321 09876',
        email: 'vikram.singh@datastream.ai',
        stall: 'D-401',
        category: 'Exhibitor',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 6,
        token: 'TKN-2024-006',
        order_id: 'ORD-78906',
        firstName: 'Ananya',
        lastName: 'Gupta',
        company: 'FinTech Ventures',
        designation: 'CEO',
        phone: '+91 43210 98765',
        email: 'ananya@fintechventures.com',
        stall: 'VIP-001',
        category: 'VIP',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 7,
        token: 'TKN-2024-007',
        order_id: 'ORD-78907',
        firstName: 'Rohan',
        lastName: 'Mehta',
        company: 'AppWorks Studio',
        designation: 'UI/UX Designer',
        phone: '+91 32109 87654',
        email: 'rohan@appworks.design',
        stall: 'B-206',
        category: 'Attendee',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 8,
        token: 'TKN-2024-008',
        order_id: 'ORD-78908',
        firstName: 'Kavitha',
        lastName: 'Nair',
        company: 'Quantum Computing Ltd',
        designation: 'Research Scientist',
        phone: '+91 21098 76543',
        email: 'kavitha@quantumcomp.in',
        stall: 'C-303',
        category: 'Speaker',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 9,
        token: 'TKN-2024-009',
        order_id: 'ORD-78909',
        firstName: 'Arjun',
        lastName: 'Kapoor',
        company: 'SecureNet Solutions',
        designation: 'Security Analyst',
        phone: '+91 10987 65432',
        email: 'arjun@securenet.com',
        stall: 'A-103',
        category: 'Exhibitor',
        eventName: 'Tech Summit 2024',
    },
    {
        id: 10,
        token: 'TKN-2024-010',
        order_id: 'ORD-78910',
        firstName: 'Meera',
        lastName: 'Iyer',
        company: 'GreenTech Innovations',
        designation: 'Sustainability Lead',
        phone: '+91 09876 54321',
        email: 'meera@greentech.eco',
        stall: 'E-501',
        category: 'Attendee',
        eventName: 'Tech Summit 2024',
    },
];

// Different data structures for testing
const DUMMY_ORDERS = [
    {
        orderId: 'ORD-2024-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        productName: 'Premium Package',
        quantity: 2,
        total: '₹15,000',
        orderDate: '2024-02-01',
    },
    {
        orderId: 'ORD-2024-002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        productName: 'Basic Package',
        quantity: 1,
        total: '₹5,000',
        orderDate: '2024-02-02',
    },
];

const DUMMY_PRODUCTS = [
    {
        sku: 'SKU-001',
        productName: 'Wireless Headphones',
        brand: 'AudioMax',
        price: '₹2,999',
        category: 'Electronics',
        barcode: '8901234567890',
    },
    {
        sku: 'SKU-002',
        productName: 'Smart Watch Pro',
        brand: 'TechFit',
        price: '₹8,499',
        category: 'Wearables',
        barcode: '8901234567891',
    },
];

/**
 * Fetch badges/attendees for label printing
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response with data
 */
export const fetchBadges = async (params = {}) => {
    await delay(800); // Simulate network delay
    
    let data = [...DUMMY_BADGES];
    
    // Filter by category if provided
    if (params.category) {
        data = data.filter(b => b.category === params.category);
    }
    
    // Filter by search term
    if (params.search) {
        const term = params.search.toLowerCase();
        data = data.filter(b => 
            b.firstName.toLowerCase().includes(term) ||
            b.lastName.toLowerCase().includes(term) ||
            b.company.toLowerCase().includes(term) ||
            b.token.toLowerCase().includes(term)
        );
    }
    
    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const start = (page - 1) * limit;
    const paginatedData = data.slice(start, start + limit);
    
    return {
        success: true,
        data: paginatedData,
        total: data.length,
        page,
        limit,
        // Return field names for dynamic mapping
        availableFields: Object.keys(DUMMY_BADGES[0] || {}),
    };
};

/**
 * Fetch orders for label printing
 */
export const fetchOrders = async (params = {}) => {
    await delay(600);
    return {
        success: true,
        data: DUMMY_ORDERS,
        total: DUMMY_ORDERS.length,
        availableFields: Object.keys(DUMMY_ORDERS[0] || {}),
    };
};

/**
 * Fetch products for label printing
 */
export const fetchProducts = async (params = {}) => {
    await delay(600);
    return {
        success: true,
        data: DUMMY_PRODUCTS,
        total: DUMMY_PRODUCTS.length,
        availableFields: Object.keys(DUMMY_PRODUCTS[0] || {}),
    };
};

/**
 * Fetch single badge by token or ID
 */
export const fetchBadgeByToken = async (token) => {
    await delay(400);
    const badge = DUMMY_BADGES.find(b => b.token === token || b.order_id === token);
    return {
        success: !!badge,
        data: badge || null,
    };
};

/**
 * Get available data sources for label printing
 */
export const getDataSources = () => [
    { value: 'badges', label: 'Event Badges / Attendees', fetchFn: fetchBadges },
    { value: 'orders', label: 'Orders', fetchFn: fetchOrders },
    { value: 'products', label: 'Products', fetchFn: fetchProducts },
];

/**
 * Default field mappings for common data sources
 */
export const DEFAULT_FIELD_MAPPINGS = {
    badges: {
        name: 'firstName',
        surname: 'lastName',
        company_name: 'company',
        designation: 'designation',
        number: 'phone',
        stall_number: 'stall',
        qrcode: 'token', // Use token for QR code
    },
    orders: {
        name: 'customerName',
        qrcode: 'orderId',
    },
    products: {
        name: 'productName',
        company_name: 'brand',
        qrcode: 'barcode',
    },
};

const labelApiService = {
    fetchBadges,
    fetchOrders,
    fetchProducts,
    fetchBadgeByToken,
    getDataSources,
    DEFAULT_FIELD_MAPPINGS,
};

export default labelApiService;
