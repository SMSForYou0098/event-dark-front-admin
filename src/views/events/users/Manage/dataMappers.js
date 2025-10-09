/**
 * Map API response to form values
 * @param {Object} apiData - Response from edit-user API
 * @returns {Object} - Mapped data for form
 */
export const mapApiToForm = (apiData) => {
    if (!apiData) return {};
    
    const user = apiData.user || apiData;
    
    return {
        // Basic Info
        name: user.name || '',
        email: user.email || '',
        number: user.phone_number?.toString() || '',
        altNumber: user.alt_number?.toString() || '',
        organisation: user.organisation || '',
        
        // Address
        city: user.city || '',
        pincode: user.pincode || '',
        state: user.state || '',
        
        // Role & User Info
        roleId: user.role?.id || null,
        roleName: user.role?.name || '',
        reportingUser: user.reporting_user_id ? String(user.reporting_user_id) : null,
        status: user.status === 1 ? 'Active' : 'Inactive',
        
        // Banking
        bankName: user.bank_name || '',
        bankNumber: user.bank_number || '',
        bankIfsc: user.bank_ifsc || '',
        bankBranch: user.bank_branch || '',
        bankMicr: user.bank_micr || '',
        
        // Shop (if exists)
        shopName: user.shop?.name || '',
        shopNumber: user.shop?.number || '',
        gstNumber: user.shop?.gst_number || '',
        
        // Organization specific
        orgGstNumber: user.org_gst_no || '',
        
        // Settings
        qrLength: user.qr_length || '',
        authentication: user.authentication === 1,
        agentDiscount: user.agent_disc === 1,
        agreementStatus: user.agreement_status === 1,
        paymentMethod: user.payment_method || 'Cash',
        
        // Events & Tickets - Extract from nested structure
        events: (user.events || []).map(e => e.id),
        tickets: (user.agentTickets || user.tickets || []).map(t => String(t.id)),
        gates: (user.gates || []).map(g => g.id),
        
        // Agreement Details
        aggrementDetails: {
            org_office_address: user.org_office_address || '',
            org_name_signatory: user.org_name_signatory || '',
            pan_no: user.pan_no || '',
            account_holder: user.account_holder || '',
            org_type_of_company: user.org_type_of_company || '',
            org_signature_type: user.org_signature_type || ''
        },
        
        // Don't set password fields when editing
        password: '',
        repeatPassword: ''
    };
};

/**
 * Map form data back to API format
 * @param {Object} formData - Data from form
 * @returns {Object} - Mapped data for API
 */
export const mapFormToApi = (formData) => {
    return {
        name: formData.name,
        email: formData.email,
        number: formData.number,
        alt_number: formData.altNumber || null,
        organisation: formData.organisation,
        
        // Address
        city: formData.city,
        pincode: formData.pincode,
        state: formData.state,
        
        // Role
        role_id: formData.roleId,
        reporting_user: formData.reportingUser,
        status: formData.status === 'Active' ? 1 : 0,
        role_name: formData.roleName,
        
        // Banking
        bank_name: formData.bankName,
        bank_number: formData.bankNumber,
        bank_ifsc: formData.bankIfsc,
        bank_branch: formData.bankBranch,
        bank_micr: formData.bankMicr,
        
        // Shop
        shop_name: formData.shopName,
        shop_number: formData.shopNumber,
        gst_number: formData.gstNumber,
        
        // Organization
        org_gst_no: formData.orgGstNumber,
        
        // Settings
        qr_length: formData.qrLength,
        authentication: formData.authentication ? 1 : 0,
        agent_disc: formData.agentDiscount ? 1 : 0,
        agreement_status: formData.agreementStatus ? 1 : 0,
        payment_method: formData.paymentMethod,
        
        // Events & Tickets - send as arrays of IDs
        event_ids: formData.events || [],
        ticket_ids: (formData.tickets || []).map(t => Number(t)),
        gate_ids: formData.gates || [],
        
        // Password (only include if provided)
        ...(formData.password && { password: formData.password }),
        
        // Agreement Details
        ...(formData.aggrementDetails || {})
    };
};