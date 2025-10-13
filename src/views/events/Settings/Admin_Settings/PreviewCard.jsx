// PreviewCard.js
import React from "react";
import { Card, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";

function PreviewCard({ imageUrl, alt, onRemove, height = 100 }) {
  return (
    <Card
      className="mt-2"
      style={{ 
        display: 'inline-block',
        position: 'relative',
        width: '100%'
      }}
      bodyStyle={{ padding: '8px' }}
    >
      <Button
        danger
        size="small"
        shape="circle"
        icon={<CloseOutlined />}
        onClick={onRemove}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 1
        }}
        aria-label="Remove"
      />
      <img
        src={imageUrl}
        alt={alt}
        style={{ 
          height: `${height}px`, 
          width: '100%',
          objectFit: "contain" 
        }}
      />
    </Card>
  );
}

export default PreviewCard;
