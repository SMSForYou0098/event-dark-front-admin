// LocationStep.jsx
import React from "react";
import { Form, Input, Card, Space } from "antd";

const { TextArea } = Input;

const LocationStep = ({ form }) => {
  // Watch the map_code field so the preview updates as the user types
  const mapCode = Form.useWatch("map_code", form); // ← no props needed

  const isEmbedCode = typeof mapCode === "string" && mapCode.includes("<iframe");
  const isURL = typeof mapCode === "string" && /^https?:\/\//i.test(mapCode || "");

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Form.Item
        name="map_code"
        label="Google Map Embed Code or URL"
        rules={[{ required: true, message: "Please enter a map embed code or URL" }]}
        tooltip="Paste a Google Maps iframe embed code or a Google Maps URL"
      >
        <TextArea
          rows={4}
          placeholder="Paste Google Maps iframe or a map URL (e.g., https://www.google.com/maps/embed?...)"
        />
      </Form.Item>

      {mapCode && (
        <div>
          {isEmbedCode ? (
            // If user pasted full iframe embed code
            <div 
              dangerouslySetInnerHTML={{ __html: mapCode }}
            />
          ) : isURL ? (
            // If user pasted just a URL
            <div className="d-flex flex-column">
              <iframe
                className="w-100"
                title="map"
                src={mapCode}
                height="400"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <p style={{ color: "#888" }}>Invalid embed code or URL.</p>
          )}
        </div>
      )}
    </Space>
  );
};

export default LocationStep;
