import DOMPurify from 'dompurify';

/**
 * Replaces agreement placeholders with actual entity data.
 * 
 * @param {string} content - The HTML content with {{placeholders}}
 * @param {object} record - The entity record containing values (name, organisation, etc.)
 * @returns {string} - Sanitized HTML with replaced values
 */
export const replaceAgreementPlaceholders = (content, record) => {
    if (!content || !record) return content || '';

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const tax = record.booking_tax;
    const organizerPercent = tax
        ? `${tax.commission_rate}${tax.commission_type === 'percentage' ? '%' : ''} (${tax.commission_type})`
        : '';

    const replacements = {
        username: record.name,
        useremail: record.email,
        organisation: record.organisation,
        date: today,
        organizeraddress: record.address,
        organizerpercent: organizerPercent,
        bank_ifsc: record.bank_ifsc,
        bank_name: record.bank_name,
        bank_branch: record.bank_branch,
        bank_number: record.bank_number,
        gst_number: record.org_gst_no,
        orgpan: record.pan_no,
    };

    const replacedContent = content.replace(/{{(\w+)}}/g, (match, key) => {
        return replacements[key] !== undefined ? `<strong>${replacements[key] || ''}</strong>` : match;
    });

    return DOMPurify.sanitize(replacedContent);
};
