import React from "react";
import { Document, Page, Image, View, StyleSheet } from "@react-pdf/renderer";

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    display: "block",
    padding: 20,
  },
  view: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    margin: 10,
  },
  qrImage: {
    width: 150, // Adjust size if needed
    height: 150, // Adjust size if needed
    margin: 10,
  },
});

// Component to render a single QR code page
function QRCodePage({ dataUrl }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.view}>
        <Image src={dataUrl} style={styles.qrImage} />
      </View>
    </Page>
  );
}

// Document component that renders all QR code pages
function QRCodeDocument({ qrCodes }) {
  return (
    <Document>
      {qrCodes.map((qrCode, index) => (
        <QRCodePage key={index} dataUrl={qrCode.dataUrl} />
      ))}
    </Document>
  );
}

export default QRCodeDocument;
