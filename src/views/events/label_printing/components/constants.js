// Label Printing Constants

/**
 * Available fields for label printing
 * Keys match API field names
 */
export const AVAILABLE_FIELDS = [
    { key: "name", label: "First Name", defaultEnabled: true, defaultSize: 1.5 },
    { key: "surname", label: "Surname", defaultEnabled: true, defaultSize: 1.5 },
    { key: "number", label: "Mobile", defaultEnabled: true, defaultSize: 1.0 },
    { key: "designation", label: "Designation", defaultEnabled: true, defaultSize: 1.0 },
    { key: "company_name", label: "Company", defaultEnabled: true, defaultSize: 1.0 },
    { key: "stall_number", label: "Stall", defaultEnabled: false, defaultSize: 1.0 },
];

/**
 * Label size options
 */
export const LABEL_SIZES = [
    { value: "2x2", label: "2 inch × 2 inch" },
    { value: "2x1", label: "2 inch × 1 inch" },
    { value: "3x2", label: "3 inch × 2 inch" },
];

/**
 * Default font families
 */
export const FONT_FAMILIES = [
    { value: "Arial, sans-serif", label: "Arial" },
    { value: "Helvetica, sans-serif", label: "Helvetica" },
    { value: "Times New Roman, serif", label: "Times New Roman" },
    { value: "Georgia, serif", label: "Georgia" },
    { value: "Courier New, monospace", label: "Courier New" },
    { value: "Verdana, sans-serif", label: "Verdana" },
];

/**
 * Printer types
 */
export const PRINTER_TYPES = [
    { value: "tspl", label: "TSPL (TSC)" },
    { value: "zpl", label: "ZPL (Zebra)" },
    { value: "cpcl", label: "CPCL (Citizen)" },
];

/**
 * Connection modes
 */
export const CONNECTION_MODES = [
    { value: "browser", label: "Browser Print" },
    { value: "usb", label: "USB" },
    { value: "bluetooth", label: "Bluetooth" },
];
