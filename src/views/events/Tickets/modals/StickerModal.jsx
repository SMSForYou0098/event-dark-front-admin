import React, { useRef, useState, useEffect } from "react";
import { Modal, Button, Checkbox, Form, Spin, Radio, message } from "antd";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { useMyContext } from "../../../../../Context/MyContextProvider";
import POSPrintModal from "../../POS/POSPrintModal";

const staticCustomFieldsData = [
  { id: "name", field_name: "Name", lable: "Name", field_type: "text" },
  { id: "mo", field_name: "Mo", lable: "Mo", field_type: "number" },
  { id: "photo", field_name: "Photo", lable: "Photo", field_type: "file" },
  { id: "company", field_name: "Company_Name", lable: "Company", field_type: "text" }
];

// LocalStorage helpers
const FIELD_TTL = 7 * 24 * 60 * 60 * 1000;
const STICKER_MODAL_FIELDS_KEY = (category_id) => `sticker_fields_${category_id || "default"}`;
const STICKER_MODAL_TOGGLES_KEY = (category_id) => `sticker_toggles_${category_id || "default"}`;
const STICKER_MODAL_SIZE_KEY = (category_id) => `sticker_size_${category_id || "default"}`;

const setWithExpiry = (key, value, ttlMs) => {
  const now = Date.now();
  localStorage.setItem(key, JSON.stringify({ value, expiry: now + ttlMs }));
};

const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  try {
    const item = JSON.parse(itemStr);
    if (!item.expiry || Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

const StickerModal = ({ data, open, setOpen, category_id, setAttendeeState, AttendyView, printInvoiceData }) => {
  const { fetchCategoryData } = useMyContext();
  const [customFieldsData, setCustomFieldsData] = useState(staticCustomFieldsData);
  const [printOptions, setPrintOptions] = useState({});
  const [stickerSize, setStickerSize] = useState('2x1');
  const [loading, setLoading] = useState(false);
  const [showPrintModel, setShowPrintModel] = useState(false);
  const printRef = useRef();

  // Load saved settings from localStorage
  useEffect(() => {
    const fields = getWithExpiry(STICKER_MODAL_FIELDS_KEY(category_id));
    const toggles = getWithExpiry(STICKER_MODAL_TOGGLES_KEY(category_id));
    const size = getWithExpiry(STICKER_MODAL_SIZE_KEY(category_id));

    if (fields) setCustomFieldsData(fields);
    if (toggles) setPrintOptions(toggles);
    if (size) setStickerSize(size);
  }, [category_id]);

  // Fetch category data if not in localStorage
  useEffect(() => {
    let ignore = false;
    const key = STICKER_MODAL_FIELDS_KEY(category_id);
    if (open && category_id && !getWithExpiry(key)) {
      setLoading(true);
      fetchCategoryData(category_id)
        .then((res) => {
          if (!ignore) {
            const fields = res?.customFieldsData || staticCustomFieldsData;
            setCustomFieldsData(fields);
            setWithExpiry(key, fields, FIELD_TTL);
            
            const opts = {};
            fields.forEach(f => { opts[f.field_name] = true; });
            opts.showQR = true;
            setPrintOptions(opts);
            setWithExpiry(STICKER_MODAL_TOGGLES_KEY(category_id), opts, FIELD_TTL);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
    return () => { ignore = true; };
  }, [category_id, open, fetchCategoryData]);

  const moveField = (idx, direction) => {
    setCustomFieldsData((fields) => {
      const newFields = [...fields];
      const tgt = direction === "up" ? idx - 1 : idx + 1;
      if (tgt < 0 || tgt >= newFields.length) return newFields;
      [newFields[idx], newFields[tgt]] = [newFields[tgt], newFields[idx]];
      setWithExpiry(STICKER_MODAL_FIELDS_KEY(category_id), newFields, FIELD_TTL);
      return newFields;
    });
  };

  const handleOptionChange = (field) => {
    setPrintOptions((opts) => {
      const updated = { ...opts, [field]: !opts[field] };
      setWithExpiry(STICKER_MODAL_TOGGLES_KEY(category_id), updated, FIELD_TTL);
      return updated;
    });
  };

  const handleSizeChange = (size) => {
    setStickerSize(size);
    setWithExpiry(STICKER_MODAL_SIZE_KEY(category_id), size, FIELD_TTL);
  };

  const handleDownload = async () => {
    const html2canvas = (await import("html2canvas")).default;
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, {
      scale: 3,
      useCORS: true,
    });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${data?.Name || data?.name || "sticker"}.png`;
    link.click();
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page {
        margin: 0;
        size: ${stickerSize === '2x1' ? '80mm 25mm' : '51mm 55mm'};
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        margin: 0;
        padding: 0;
        transform: scale(1);
      }
      .sticker-wrapper {
        margin-bottom: ${stickerSize === '2x2' ? '4mm' : '0'};
      }
    `,
    printOptions: {
      preferCSSPageSize: true,
    }
  });

  // Calculate dynamic font size based on content length
  const getDynamicFontSize = (value, fieldName) => {
    if (stickerSize === '2x1') return '8px';
    
    const length = value?.length || 0;
    const isNameField = fieldName === 'Name';
    
    if (length <= 15) return isNameField ? '16px' : '18px';
    if (length <= 25) return isNameField ? '16px' : '18px';
    return isNameField ? '7px' : '6px';
  };

  // Inline styles
  const stickerWrapperStyle = {
    display: 'flex',
    flexDirection: stickerSize === '2x1' ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#fff',
    padding: '2px',
    boxSizing: 'border-box',
    gap: '3px',
    width: stickerSize === '2x1' ? '80mm' : '51mm',
    height: stickerSize === '2x1' ? '25mm' : '51mm',
    marginBottom: stickerSize === '2x2' ? '4mm' : '0'
  };

  const qrCodeContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    order: stickerSize === '2x1' ? 0 : 2
  };

  const idCardDetailsStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: stickerSize === '2x1' ? 'flex-start' : 'center',
    gap: '2px',
    width: '100%',
    order: 1,
    overflow: 'hidden',
    lineHeight: '1.1',
    fontWeight: '400',
    color: '#222',
    textAlign: stickerSize === '2x1' ? 'left' : 'center',
    maxHeight: '100%',
    boxSizing: 'border-box'
  };

  const textItemStyle = {
    maxWidth: stickerSize === '2x1' ? '60mm' : '45mm',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
    padding: 0
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          AttendyView?.();
          setAttendeeState?.(false);
        }}
        centered
        title="Sticker Preview"
        footer={null}
        width={500}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          {loading ? (
            <Spin />
          ) : (
            <div>
              <div
                ref={printRef}
                className="sticker-wrapper"
                style={stickerWrapperStyle}
              >
                {printOptions.showQR && (
                  <div style={qrCodeContainerStyle}>
                    <QRCodeSVG
                      value={data?.token || ""}
                      size={stickerSize === '2x2' ? 40 : 25}
                    />
                  </div>
                )}
                <div style={idCardDetailsStyle}>
                  {customFieldsData?.map((field) => (
                    printOptions[field.field_name] && data?.[field.field_name] && (
                      <div key={field.id} style={textItemStyle}>
                        <p
                          style={{
                            margin: 0,
                            height: "auto",
                            fontSize: getDynamicFontSize(data[field.field_name], field.field_name),
                            padding: "0",
                            fontWeight: field.field_name === "Name" ? "bold" : "400",
                          }}
                        >
                          {data[field.field_name]}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: 24 }}>
          <Form layout="vertical">
            <Form.Item label="Sticker Size:">
              <Radio.Group
                value={stickerSize}
                onChange={e => handleSizeChange(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="2x1">2x1</Radio.Button>
                <Radio.Button value="2x2">2x2</Radio.Button>
              </Radio.Group>
              {printInvoiceData &&
                <Button style={{ marginLeft: 8 }} onClick={() => setShowPrintModel(true)}>
                  Print Invoice
                </Button>
              }
            </Form.Item>
            {customFieldsData.map((field, idx) => (
              <Form.Item key={field.id} style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={!!printOptions[field.field_name]}
                  onChange={() => handleOptionChange(field.field_name)}
                  style={{ marginRight: 8 }}
                >
                  {field.lable}
                </Checkbox>
                <Button
                  size="small"
                  style={{ marginRight: 4 }}
                  disabled={idx === 0}
                  onClick={() => moveField(idx, "up")}
                >
                  ▲
                </Button>
                <Button
                  size="small"
                  disabled={idx === customFieldsData.length - 1}
                  onClick={() => moveField(idx, "down")}
                >
                  ▼
                </Button>
              </Form.Item>
            ))}
            <Form.Item>
              <Checkbox
                checked={!!printOptions.showQR}
                onChange={() => handleOptionChange("showQR")}
              >
                QR Code
              </Checkbox>
            </Form.Item>
          </Form>
          <div style={{ textAlign: "right", marginTop: 16 }}>
            <Button style={{ marginRight: 8 }} onClick={handleDownload}>
              Download
            </Button>
            <Button type="primary" onClick={handlePrint}>
              Print
            </Button>
          </div>
        </div>
      </Modal>
      <POSPrintModal
        showPrintModel={showPrintModel}
        closePrintModel={() => setShowPrintModel(false)}
        event={printInvoiceData?.event}
        bookingData={printInvoiceData?.bookingData}
        subtotal={printInvoiceData?.subtotal}
        totalTax={printInvoiceData?.totalTax}
        discount={printInvoiceData?.discount}
        grandTotal={printInvoiceData?.grandTotal}
      />
    </>
  );
};

export default StickerModal;