// Label Forge Constants

/**
 * DPI for thermal printers (203 DPI = 8 dots per mm)
 */
export const DPI_203 = 8;

/**
 * Screen scale for rendering (4x for better precision)
 */
export const SCREEN_SCALE = 4;

/**
 * Default snap grid size in mm
 */
export const SNAP_GRID_SIZE = 1;

/**
 * Local storage key for persistence
 */
export const STORAGE_KEY = 'LABEL_FORGE_STATE_V1';

/**
 * Available fonts for label elements
 */
export const FONTS = [
    { name: 'Arial (Sans)', value: 'Arial, sans-serif', tspl: '0' },
    { name: 'Courier (Mono)', value: 'Courier New, monospace', tspl: '1' },
    { name: 'Times (Serif)', value: 'Times New Roman, serif', tspl: '2' },
    { name: 'Impact', value: 'Impact, sans-serif', tspl: '3' },
    { name: 'Verdana', value: 'Verdana, sans-serif', tspl: '4' },
];

/**
 * Label size presets
 */
export const PRESETS = [
    { name: '48mm x 30mm (Standard)', width: 48, height: 30 },
    { name: '50mm x 50mm (Square)', width: 50, height: 50 },
    { name: '100mm x 150mm (Shipping)', width: 100, height: 150 },
    { name: '40mm x 20mm (Small)', width: 40, height: 20 },
];

/**
 * Available grid sizes for snapping
 */
export const GRID_SIZES = [0.5, 1, 2, 5, 10];

/**
 * Printer language options
 */
export const PRINTER_LANGUAGES = [
    { value: 'TSPL', label: 'TSPL (TSC, Godex)' },
    { value: 'ZPL', label: 'ZPL (Zebra)' },
    { value: 'ESC', label: 'ESC/POS (Receipt)' },
];

/**
 * Initial default elements for new canvas
 */
export const INITIAL_ELEMENTS = [
    { id: '1', type: 'text', x: 2, y: 2, content: 'TICKET #', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
    { id: '2', type: 'text', x: 2, y: 12, content: '{ticket_id}', fontSize: 14, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
    { id: '3', type: 'qrcode', x: 28, y: 2, width: 18, height: 18, content: '{ticket_id}', showBorder: true, padding: 1 },
    { id: '4', type: 'barcode', x: 2, y: 22, width: 44, height: 6, content: '12345678' },
];

/**
 * Demo template for showcase
 */
export const DEMO_TEMPLATE = {
    labelSize: { name: '100mm x 150mm (Shipping)', width: 100, height: 150 },
    elements: [
        { id: 'd1', type: 'box', x: 2, y: 2, width: 96, height: 146, strokeWidth: 0.5 },
        { id: 'd2', type: 'text', x: 5, y: 5, content: 'SHIPPING LABEL', fontSize: 16, fontWeight: 'bold', fontFamily: 'Impact, sans-serif' },
        { id: 'd3', type: 'text', x: 70, y: 6, content: '{date}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd4', type: 'box', x: 2, y: 15, width: 96, height: 0.5, strokeWidth: 0.5 },
        { id: 'd5', type: 'text', x: 5, y: 18, content: 'FROM: Store #{store_id}', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd6', type: 'text', x: 5, y: 23, content: 'TO CUSTOMER: {customer_id}', fontSize: 12, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd7', type: 'text', x: 5, y: 28, content: '{name}', fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd8', type: 'box', x: 2, y: 35, width: 96, height: 0.5, strokeWidth: 0.5 },
        { id: 'd9', type: 'text', x: 5, y: 38, content: 'PRODUCT DETAILS', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd10', type: 'text', x: 5, y: 43, content: 'SKU: {sku}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
        { id: 'd11', type: 'text', x: 50, y: 43, content: 'Cat: {category}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd12', type: 'text', x: 5, y: 48, content: '{description}', fontSize: 12, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd13', type: 'text', x: 5, y: 55, content: 'PRICE:', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd14', type: 'text', x: 5, y: 59, content: '{currency} {price}', fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd15', type: 'text', x: 50, y: 55, content: 'WEIGHT:', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd16', type: 'text', x: 50, y: 59, content: '{weight}', fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd17', type: 'barcode', x: 5, y: 70, width: 90, height: 20, content: '{order_no}' },
        { id: 'd18', type: 'text', x: 35, y: 92, content: 'Order: {order_no}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd19', type: 'qrcode', x: 65, y: 105, width: 25, height: 25, content: '{ticket_id}', showBorder: true, padding: 1 },
        { id: 'd20', type: 'text', x: 67, y: 132, content: 'SCAN ME', fontSize: 8, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd21', type: 'text', x: 5, y: 105, content: 'Expiry: {expiry}', fontSize: 10, fontWeight: 'bold', fontFamily: 'Arial, sans-serif' },
        { id: 'd22', type: 'text', x: 5, y: 110, content: 'Lot: {lot_no}', fontSize: 10, fontWeight: 'normal', fontFamily: 'Arial, sans-serif' },
        { id: 'd23', type: 'text', x: 5, y: 140, content: 'Ticket ID: {ticket_id}', fontSize: 8, fontWeight: 'normal', fontFamily: 'Courier New, monospace' },
    ]
};

/**
 * Mock data for variable preview
 */
export const MOCK_DATA = {
    '{name}': 'Fresh Atlantic Salmon',
    '{ticket_id}': 'TK-8849201',
    '{price}': '24.99',
    '{date}': '2023-12-01',
    '{sku}': 'SKU-554432',
    '{description}': 'Premium Filet Skin-on',
    '{category}': 'Seafood',
    '{weight}': '0.45 kg',
    '{currency}': '$',
    '{store_id}': 'ST-001',
    '{customer_id}': 'CUST-887',
    '{order_no}': 'ORD-2023-001',
    '{expiry}': '2023-12-05',
    '{lot_no}': 'L-7761'
};
