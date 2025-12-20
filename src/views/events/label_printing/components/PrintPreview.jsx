import React, { forwardRef } from "react";
import { AVAILABLE_FIELDS } from "./constants";

/**
 * Print Preview Component
 * Hidden content for browser print
 */
const PrintPreview = forwardRef(({
    selectedRows,
    selectedFields,
    fontFamily,
    fontSizeMultiplier,
    fieldFontSizes,
    lineGapMultiplier,
}, ref) => {
    return (
        <div style={{ display: "none" }}>
            <div ref={ref} style={{ fontFamily }}>
                {selectedRows.map((row, index) => (
                    <div
                        key={index}
                        className="label-item"
                        style={{
                            padding: "20px",
                            border: "1px solid #000",
                            marginBottom: "10px",
                            pageBreakAfter: "always",
                        }}
                    >
                        {selectedFields.map((field) => {
                            const fieldConfig = AVAILABLE_FIELDS.find((f) => f.key === field);
                            if (!fieldConfig) return null;

                            const fieldSize = (fieldFontSizes[field] || fieldConfig.defaultSize || 1.0) * fontSizeMultiplier;
                            const lineHeight = 1.2 * lineGapMultiplier;

                            return row[field] ? (
                                <div
                                    key={field}
                                    style={{
                                        marginBottom: `${10 * lineGapMultiplier}px`,
                                        fontSize: `${14 * fieldSize}px`,
                                        lineHeight: `${lineHeight}`,
                                    }}
                                >
                                    <strong>{fieldConfig.label}:</strong> {row[field]}
                                </div>
                            ) : null;
                        })}
                        {row.number && (
                            <div style={{ marginTop: "15px", textAlign: "center" }}>
                                <div style={{ fontSize: "12px", marginBottom: "5px" }}>
                                    QR Code: {row.number}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

PrintPreview.displayName = "PrintPreview";

export default PrintPreview;
