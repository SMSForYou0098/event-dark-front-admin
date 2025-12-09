import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

/**
 * SignatureDisplay - Component to display signatures (type, draw, or upload)
 * 
 * @param {Object} signatureData - The signature data object from API
 * @param {string} signatureData.signature_type - Type: 'type', 'draw', or 'upload'
 * @param {string} signatureData.signature_text - Text for typed signatures
 * @param {string} signatureData.signature_font - Font name for typed signatures
 * @param {string} signatureData.signature_font_style - Font style (CSS) for typed signatures
 * @param {string} signatureData.signature_image - Image data (base64 or URL) for draw/upload
 * @param {string} signatureData.signatory_name - Name of the person who signed
 * @param {string} signatureData.signing_date - Date when signature was created
 * @param {string} label - Label to display above signature (default: "Signature:")
 * @param {string} align - Text alignment: 'left', 'center', 'right' (default: 'right')
 * @param {boolean} showBorder - Show top border separator (default: true)
 * @param {Object} style - Additional custom styles
 */
const SignatureDisplay = ({
    signatureData,
    label = 'Signature:',
    align = 'right',
    showBorder = true,
    style = {}
}) => {
    if (!signatureData) return null;

    const {
        signature_type,
        signature_text,
        signature_font_style,
        signature_image,
        signatory_name,
        signing_date,
        updated_at
    } = signatureData;
    return (
        <div
            style={{
                marginTop: 32,
                textAlign: align,
                ...(showBorder && { borderTop: '1px solid #f0f0f0', paddingTop: 16 }),
                ...style
            }}
        >
            {/* Label */}
            {label && (
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {label}
                </Text>
            )}

            {/* Type Signature - Display typed text with custom font */}
            {signature_type === 'type' && signature_text && (
                <div
                    style={{
                        fontFamily: signature_font_style || 'cursive',
                        fontSize: '32px',
                        marginBottom: 8,
                        color: '#000',
                        lineHeight: 1.2
                    }}
                >
                    {signature_text}
                </div>
            )}

            {/* Draw or Upload Signature - Display image */}
            {(signature_type === 'draw' || signature_type === 'upload') && signature_image && (
                <div
                    style={{
                        marginBottom: 8,
                        display: 'inline-block',
                        backgroundColor: '#fff'
                    }}
                >
                    <img
                        src={
                            signature_image.startsWith('data:')
                                ? signature_image
                                : signature_image.startsWith('http')
                                    ? signature_image
                                    : `${signature_image}`
                        }
                        alt="Signature"
                        style={{
                            maxWidth: '250px',
                            maxHeight: '100px',
                            display: 'block',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            padding: '8px',
                            backgroundColor: '#fff'
                        }}
                        onError={(e) => {
                            console.error('Signature image failed to load:', signature_image);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            )}

            {/* Signatory Name */}
            {signatory_name && (
                <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginTop: 4 }}>
                    {signatory_name}
                </Text>
            )}

            {/* Signing Date */}
            {(signing_date || updated_at) && (
                <Text type="secondary" style={{ display: 'block', fontSize: '11px', marginTop: 2 }}>
                    Signed on: {new Date(signing_date ?? updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </Text>
            )}
        </div>
    );
};

export default SignatureDisplay;
