export const VALIDATION_REGEX = {
    // GST Number: 15 characters (e.g., 22AAAAA0000A1Z5)
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,

    // PAN Number: 10 characters (e.g., ABCDE1234F)
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

    // Mobile Number: 10 digits
    MOBILE: /^\d{10}$/,

    // Pincode: 6 digits
    PINCODE: /^[1-9][0-9]{5}$/,

    // Name: Only letters and spaces
    NAME: /^[a-zA-Z\s]+$/,

    // Mobile: 10-12 digits
    MOBILE_LONG: /^\d{10,12}$/,

    // Email: 
    EMAIL: /^[A-Za-z0-9]+([._+-]?[A-Za-z0-9]+)*@[A-Za-z0-9]+(-[A-Za-z0-9]+)*(\.[A-Za-z0-9]+(-[A-Za-z0-9]+)*)+$/,

    // City : Gujarat
    CITY: /^[A-Za-z]+(?:[\s-][A-Za-z]+)*$/,

    // Address validation
    ADDRESS: /^[a-zA-Z0-9\s,.\-\/\(\)\|]+$/,
    ADDRESS_SPECIAL: /[,.\-\/\(\)\|]{2,}|\|\s*\|/,

    // Bank Details validation

    // Bank Name: Only letters, spaces, dots, ampersands, hyphens, and parentheses
    BANK_NAME: /^[A-Za-z]+(?:[ .&-][A-Za-z]+)*$/,

    // Bank Branch: Only letters, numbers, spaces, dots, slashes, ampersands, hyphens, parentheses, and underscores
    BANK_BRANCH: /^[A-Za-z0-9]+(?:[A-Za-z0-9\s./&()-]*[A-Za-z0-9])?$/,

    // IFSC Code: 11 characters (e.g., SBIN0001234)
    IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,

    // Account Number: 9-18 digits
    ACCOUNT_NUMBER: /^\d{9,18}$/,

    // Brand Name: Only letters, spaces, dots, ampersands, hyphens, and parentheses
    BRAND_NAME: /^[A-Za-z]+(?:[ .&-][A-Za-z]+)*$/,

    // Event Name: Only letters, numbers, spaces, commas, dots, and hyphens
    EVENT_NAME: /^[A-Za-z0-9]+([ ,.-][A-Za-z0-9]+)*$/,

    // Organisation Name: Only letters, numbers, spaces, dots, ampersands, hyphens, and parentheses
    ORGANISATION_NAME: /^[A-Za-z0-9]+(?:[ .&-][A-Za-z0-9]+)*$/,

    // Category Name: Only letters, numbers, spaces, dots, hyphens, and parentheses
    CATEGORY_NAME: /^[A-Za-z0-9]+(?:[ .-][A-Za-z0-9]+)*$/,
    // URL validation: Supports http, https, and optional www
    URL: /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\s]*)?$/,

};

export const VALIDATION_MESSAGES = {
    GST: 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)',
    PAN: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    MOBILE: 'Please enter a valid 10-digit mobile number',
    PINCODE: 'Please enter a valid 6-digit pincode',
    EMAIL: 'Please enter a valid email address',
    NAME: 'Name must contain only letters and spaces',
    MOBILE_LONG: 'Please enter a valid 10-12 digit mobile number',
    CITY: 'City must contain only letters and spaces',
    ORGANISATION_NAME: 'Organisation name must contain only letters and spaces',
    BRAND_NAME: 'Brand name must contain only letters and spaces',
    EVENT_NAME: 'Event name can only contain letters, numbers, spaces, commas, dots, and hyphens',
    CATEGORY_NAME: 'Category name can only contain letters, numbers, spaces, commas, dots, and hyphens',
    URL: 'Please enter a valid URL (e.g., https://example.com)',

    // Bank Details Messages
    BANK_NAME: 'Bank name must contain only letters and spaces',
    BANK_BRANCH: 'Bank branch must contain only letters and spaces',
    ACCOUNT_NUMBER: 'Account number must contain only numbers',
    IFSC: 'Please enter a valid IFSC code (e.g., SBIN0001234)',
    REQUIRED: (field) => `Please enter ${field}`,
};

/**
 * Reusable validation rules for Ant Design Form.Item
 */
export const VALIDATION_RULES = {
    GST: [
        {
            pattern: VALIDATION_REGEX.GST,
            message: VALIDATION_MESSAGES.GST
        }
    ],
    PAN: [
        {
            pattern: VALIDATION_REGEX.PAN,
            message: VALIDATION_MESSAGES.PAN
        }
    ],
    MOBILE: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('mobile number') },
        { pattern: VALIDATION_REGEX.MOBILE, message: VALIDATION_MESSAGES.MOBILE }
    ],
    EMAIL: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('email address') },
        { pattern: VALIDATION_REGEX.EMAIL, message: VALIDATION_MESSAGES.EMAIL }
    ],
    URL: [
        { pattern: VALIDATION_REGEX.URL, message: VALIDATION_MESSAGES.URL }
    ],
    NAME: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('name') },
        { min: 2, message: 'Name must be at least 2 characters' },
        { max: 255, message: 'Name must be max 255 characters' },
        { pattern: VALIDATION_REGEX.NAME, message: VALIDATION_MESSAGES.NAME }
    ],
    MOBILE_LONG: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('mobile number') },
        { pattern: VALIDATION_REGEX.MOBILE_LONG, message: VALIDATION_MESSAGES.MOBILE_LONG }
    ],
    PINCODE: [
        { pattern: VALIDATION_REGEX.PINCODE, message: VALIDATION_MESSAGES.PINCODE }
    ],
    CITY: [
        { pattern: VALIDATION_REGEX.CITY, message: VALIDATION_MESSAGES.CITY }
    ],
    ADDRESS: [

        {
            validator: (_, value) => {
                if (!value || !value.trim()) return Promise.resolve();
                const val = value.trim();
                if (val.length < 5) return Promise.reject(new Error('Address is too short'));
                if (val.length > 255) return Promise.reject(new Error('Address is too long'));
                if (!VALIDATION_REGEX.ADDRESS.test(val)) {
                    return Promise.reject(new Error('Address contains invalid characters'));
                }
                if (VALIDATION_REGEX.ADDRESS_SPECIAL.test(val)) {
                    return Promise.reject(new Error('Address contains consecutive special characters'));
                }
                return Promise.resolve();
            }
        }
    ],

    // Bank Details
    BANK_NAME: [
        { pattern: VALIDATION_REGEX.BANK_NAME, message: VALIDATION_MESSAGES.BANK_NAME }
    ],
    BANK_BRANCH: [
        { pattern: VALIDATION_REGEX.BANK_BRANCH, message: VALIDATION_MESSAGES.BANK_BRANCH }
    ],
    IFSC: [
        { pattern: VALIDATION_REGEX.IFSC, message: VALIDATION_MESSAGES.IFSC }
    ],
    ACCOUNT_NUMBER: [
        { pattern: VALIDATION_REGEX.ACCOUNT_NUMBER, message: VALIDATION_MESSAGES.ACCOUNT_NUMBER }
    ],


    BRAND_NAME: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('brand name') },
        { pattern: VALIDATION_REGEX.BRAND_NAME, message: VALIDATION_MESSAGES.BRAND_NAME }
    ],

    ORGANISATION_NAME: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('organisation name') },
        { pattern: VALIDATION_REGEX.ORGANISATION_NAME, message: VALIDATION_MESSAGES.ORGANISATION_NAME }
    ],

    CATEGORY_NAME: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('category name') },
        { pattern: VALIDATION_REGEX.CATEGORY_NAME, message: VALIDATION_MESSAGES.CATEGORY_NAME }
    ],



};

/**
 * Functional validation rules
 */
export const VALIDATION_FUNCTIONS = {
    requiredIf: (condition, message) => ({
        required: condition,
        validator(_, value) {
            if (!condition) return Promise.resolve();
            const hasValue = Array.isArray(value)
                ? value.length > 0
                : value !== undefined && value !== null && value !== '';
            return hasValue ? Promise.resolve() : Promise.reject(new Error(message));
        }
    }),

    numberRange: (min, max, errorMessage) => ({
        validator(_, value) {
            if (value === undefined || value === null || value === '') {
                return Promise.resolve();
            }
            const n = Number(value);
            if (Number.isNaN(n)) {
                return Promise.reject(new Error('Must be a number'));
            }
            if (n < min || n > max) {
                return Promise.reject(new Error(errorMessage || `Must be between ${min} and ${max}`));
            }
            return Promise.resolve();
        }
    }),

    amountOrPercentageValidator: (typeFieldName, fallbackType) => ({ getFieldValue }) => ({
        validator(_, value) {
            if (value === undefined || value === null || value === '') {
                return Promise.resolve();
            }
            const num = Number(value);
            if (Number.isNaN(num)) {
                return Promise.reject(new Error('Enter a valid number'));
            }
            if (num < 0) {
                return Promise.reject(new Error('Value cannot be negative'));
            }
            if (value.toString().length > 10) {
                return Promise.reject(new Error('Value cannot be greater than 10 digits'));
            }
            const type = (getFieldValue && getFieldValue(typeFieldName)) || fallbackType;
            if (type === 'percentage' && num > 100) {
                return Promise.reject(new Error('Percentage cannot exceed 100'));
            }
            return Promise.resolve();
        }
    }),

    preventSpecialCharsInSelect: (e, allowedPattern = /^[a-zA-Z0-9\s,.-]+$/, specialChars = [' ', ',', '.', '-']) => {
        if (e.key.length === 1) {
            if (!allowedPattern.test(e.key)) {
                e.preventDefault();
                return;
            }
            if (specialChars.includes(e.key)) {
                const val = e.target.value || '';
                if (val.length === 0 || specialChars.includes(val.slice(-1))) {
                    e.preventDefault();
                }
            }
        }
    }
};
