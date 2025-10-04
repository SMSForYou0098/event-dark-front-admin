import React from "react";
import {QRCodeSVG} from "qrcode.react";

function QRGenerator(props) {
  const { value, documentId } = props;
  return (
    <div>
      <QRCodeSVG
        id={documentId}
        value={value}
        size={144}
        bgColor="#FFF"
        fgColor="#000"
        includeMargin
        level={"H"}
      />
    </div>
  );
}

export default QRGenerator;