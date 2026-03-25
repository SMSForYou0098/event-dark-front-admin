export const VALIDATION_REGEX = {
    // GST Number: 15 characters (e.g., 22AAAAA0000A1Z5)
    GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,

    // PAN Number: 10 characters (e.g., ABCDE1234F)
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

    // Mobile Number: 10 digits
    MOBILE: /^\d{10}$/,

    // Pincode: 6 digits
    PINCODE: /^\d{6}$/,

    // IFSC Code: 11 characters (e.g., SBIN0001234)
    IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,

    // Name: Only letters and spaces
    NAME: /^[a-zA-Z\s]+$/,

    // Mobile: 10-12 digits
    MOBILE_LONG: /^\d{10,12}$/,
};

export const VALIDATION_MESSAGES = {
    GST: 'Please enter a valid GST number (e.g., 22AAAAA0000A1Z5)',
    PAN: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
    MOBILE: 'Please enter a valid 10-digit mobile number',
    PINCODE: 'Please enter a valid 6-digit pincode',
    IFSC: 'Please enter a valid IFSC code (e.g., SBIN0001234)',
    EMAIL: 'Please enter a valid email address',
    NAME: 'Name must contain only letters and spaces',
    MOBILE_LONG: 'Please enter a valid 10-12 digit mobile number',
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
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('email') },
        { type: 'email', message: VALIDATION_MESSAGES.EMAIL }
    ],
    NAME: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('name') },
        { pattern: VALIDATION_REGEX.NAME, message: VALIDATION_MESSAGES.NAME }
    ],
    MOBILE_LONG: [
        { required: true, message: VALIDATION_MESSAGES.REQUIRED('mobile number') },
        { pattern: VALIDATION_REGEX.MOBILE_LONG, message: VALIDATION_MESSAGES.MOBILE_LONG }
    ],
    PINCODE: [
        { pattern: VALIDATION_REGEX.PINCODE, message: VALIDATION_MESSAGES.PINCODE }
    ],
    IFSC: [
        { pattern: VALIDATION_REGEX.IFSC, message: VALIDATION_MESSAGES.IFSC }
    ]
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

    percentageValidator: (getFieldValue, convenienceFeeType) => ({
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
            const type = getFieldValue('convenienceFeeType') || convenienceFeeType;
            if (type === 'percentage' && num > 100) {
                return Promise.reject(new Error('Percentage cannot exceed 100'));
            }
            return Promise.resolve();
        }
    })
};
