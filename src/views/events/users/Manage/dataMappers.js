/**
 * Map API response to form values
 * @param {Object} apiData - Response from edit-user API
 * @returns {Object} - Mapped data for form
 */
export const mapApiToForm = (apiData) => {
    if (!apiData) return {};
    
    const user = apiData.user || apiData;
    
    // Extract event IDs
    const eventIds = user.events?.map(e => e.id) || [];
    
    // Extract ticket IDs - FIXED: Use agentTickets instead of events.tickets
    const ticketIds = user.agentTickets?.map(ticket => String(ticket.id)) || [];

    return {
        // Basic Info
        name: user.name || '',
        email: user.email || '',
        number: user.phone_number?.toString() || '',
        
        // Role
        roleId: user.role?.id || null,
        roleName: user.role?.name || '',
        
        // Organization & Reporting
        organisation: user.organisation || '',
        reportingUser: user.reporting_user_id?.toString() || null,
        
        // Events & Tickets - FIXED
        events: eventIds,
        tickets: ticketIds, // Now uses agentTickets
        
        // Address
        city: user.city || '',
        pincode: user.pincode || '',
        
        // Banking (Organizer)
        bankName: user.bank_name || '',
        bankIfsc: user.bank_ifsc || '',
        bankBranch: user.bank_branch || '',
        bankNumber: user.bank_number || '',
        orgGstNumber: user.org_gst_no || '',
        
        // Status & Security
        status: Boolean(user.status),
        authentication: user.authentication === 1,
        agreementStatus: user.agreement_status === 1,
        agentDiscount: user.agent_disc === 1,
        
        // Role-specific
        paymentMethod: user.payment_method || 'Cash',
        qrLength: user.qr_length || null,
        
        // Add convenience fee mappings
        brandName: user.brandName || '',
        convenienceFeeType: user.convenience_fee_type || 'percentage',
        convenienceFee: user.convenience_fee || '',
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
        role_id: formData.roleId !== undefined && formData.roleId !== null ? Number(formData.roleId) : null,
        reporting_user: formData.reportingUser,
        status: Boolean(formData.status),
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
        event_ids : Array.isArray(formData.events) ? formData.events : formData.events ? [formData.events] : [],
        ticket_ids: (formData.tickets || []).map(t => Number(t)),
        gate_ids: formData.gates || [],
        
        // Password (only include if provided)
        ...(formData.password && { password: formData.password }),
        
        // Agreement Details
        ...(formData.aggrementDetails || {}),
        
        // Add convenience fee mappings
        brandName: formData.brandName,
        convenience_fee_type: formData.convenienceFeeType,
        convenience_fee: formData.convenienceFee ? Number(formData.convenienceFee) : null,
    };
};