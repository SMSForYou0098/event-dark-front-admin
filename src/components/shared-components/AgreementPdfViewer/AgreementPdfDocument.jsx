import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import Html from 'react-pdf-html';

const PDF_BUILTIN = ['Helvetica', 'Times-Roman', 'Times-Italic', 'Courier', 'Helvetica-Oblique'];

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 120, // Extra space for fixed footer
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
  },
  content: {
    marginBottom: 30,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  signatureSection: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#666666',
  },
  signatureText: {
    fontSize: 20,
    marginBottom: 4,
  },
  signatureImage: {
    maxWidth: 150,
    maxHeight: 50,
    marginBottom: 4,
    objectFit: 'contain',
  },
  signatoryName: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  signatureDate: {
    fontSize: 8,
    color: '#888888',
    marginTop: 2,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#888888',
  },
});

// HTML stylesheet for content
const htmlStyles = {
  body: {
    textAlign: 'justify',
  },
  p: {
    marginBottom: 10,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  strong: {
    fontWeight: 'bold',
  },
  h1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
    textAlign: 'center',
  },
  h2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 14,
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
  },
  ul: {
    marginLeft: 15,
    marginBottom: 10,
    paddingLeft: 10,
  },
  ol: {
    marginLeft: 15,
    marginBottom: 10,
    paddingLeft: 10,
  },
  li: {
    marginBottom: 4,
    textAlign: 'justify',
    paddingLeft: 5,
    lineHeight: 1.6, // Match paragraph line height
  },
  br: {
    marginBottom: 8,
  },
  div: {
    textAlign: 'justify',
  },
  span: {
    textAlign: 'justify',
  },
};

const SignatureBlock = ({ signatureData, label, adminName }) => {
  if (!signatureData) return null;

  const {
    signature_type,
    signature_text,
    signature_image,
    signature_font_style,
    signatory_name,
    signing_date,
    updated_at,
  } = signatureData;

  const fontFamily = signature_font_style && PDF_BUILTIN.includes(signature_font_style) ? signature_font_style : 'Helvetica';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.signatureBox}>
      <Text style={styles.signatureLabel}>{label}</Text>

      {signature_type === 'type' && signature_text && (
        <Text style={[styles.signatureText, { fontFamily }]}>
          {signature_text}
        </Text>
      )}

      {(signature_type === 'draw' || signature_type === 'upload') && signature_image && (
        <Image src={signature_image} style={styles.signatureImage} />
      )}

      {signatory_name && <Text style={styles.signatoryName}>{adminName ?? signatory_name}</Text>}

      {(signing_date || updated_at) && (
        <Text style={styles.signatureDate}>
          Signed on: {formatDate(signing_date || updated_at)}
        </Text>
      )}
    </View>
  );
};

const AgreementPdfDocument = ({ content, adminSignature, organizerSignature, title, org }) => {
  // Clean HTML content for PDF rendering
  const cleanContent = (html) => {
    if (!html) return '';
    // Remove script tags, event handlers, and clean up Jodit's output
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      // Remove data attributes that Jodit adds
      .replace(/\s*data-[^=]*="[^"]*"/gi, '')
      // Remove <p> tags directly inside <li> (Jodit wraps li content in p tags)
      .replace(/<li([^>]*)>\s*<p([^>]*)>/gi, '<li$1>')
      .replace(/<\/p>\s*<\/li>/gi, '</li>')
      // Clean up empty paragraphs
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Title */}
        {title && <Text style={styles.title}>{title}</Text>}

        {/* Content */}
        <View style={styles.content}>
          <Html stylesheet={htmlStyles}>{cleanContent(content)}</Html>
        </View>

        {/* Signatures - Fixed on every page */}
        {(adminSignature || organizerSignature) && (
          <View style={styles.signatureSection} fixed>
            <SignatureBlock signatureData={adminSignature} label="For, Trava Get Your Ticket Pvt. Ltd." adminName={'Janak Rana'} />
            <SignatureBlock signatureData={organizerSignature} label={`For ${org?.organisation}`} />
          </View>
        )}

        {/* Page number - Fixed on every page */}
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export default AgreementPdfDocument;
