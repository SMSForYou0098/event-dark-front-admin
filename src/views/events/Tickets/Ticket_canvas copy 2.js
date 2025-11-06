import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric-pure-browser';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, Col, message, Row, Spin } from 'antd';
import axios from 'axios';
import { CloudDownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useMyContext } from 'Context/MyContextProvider';

const TicketCanvas = (props) => {
  const { showDetails, ticketName, userName, number, address, ticketBG, date, time, photo, OrderId, showPrintButton, ticketNumber } = props;
  const { api } = useMyContext();
  const canvasRef = useRef(null);
  const qrContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const textColor = '#000';

  const fetchImage = async () => {
    try {
      const response = await axios.post(
        `${api}get-image/retrive`,
        { path: ticketBG },
        { responseType: 'blob' }
      );
      const imageUrl = URL.createObjectURL(response.data);
      setImageUrl(imageUrl);
    } catch (error) {
      message.error('❌ Failed to load ticket background image.');
    }
  };

  useEffect(() => {
    if (ticketBG) {
      fetchImage();
    }
  }, [ticketBG]);

  // Generate QR code data URL when OrderId is available
  useEffect(() => {
    if (!OrderId) {
      message.error('❌ No OrderId provided');
      return;
    }


    const extractQRCode = () => {
      // Find the canvas element inside the hidden div
      const qrCanvas = qrContainerRef.current?.querySelector('canvas');
      
      if (qrCanvas) {
        try {
          const dataUrl = qrCanvas.toDataURL('image/png');

          setQrDataUrl(dataUrl);
          return true;
        } catch (error) {
          message.error('❌ Error extracting QR code:', error);
          return false;
        }
      } else {
        message.warning('⏳ QR canvas not found yet');
        return false;
      }
    };

    // Try multiple times with increasing delays
    const delays = [100, 300, 500, 800, 1000];
    let attemptCount = 0;

    delays.forEach((delay) => {
      setTimeout(() => {
        if (!qrDataUrl) {
          attemptCount++;
          const success = extractQRCode();
          if (success) {
            // message.success('🎉 QR code extraction successful!');
          }
        }
      }, delay);
    });

  }, [OrderId]);

  const getTextWidth = (text, fontSize = 16, fontFamily = 'Arial') => {
    const tempText = new fabric.Text(text, {
      fontSize,
      fontFamily,
    });
    return tempText.width;
  };

  const centerText = (text, fontSize, fontFamily, canvas, top, scale = 1) => {
    const textWidth = getTextWidth(text, fontSize * scale, fontFamily);
    const canvasWidth = canvas.getWidth();
    const centerX = (canvasWidth - textWidth) / 2;

    const textObject = new fabric.Text(text, {
      fontSize: fontSize * scale,
      fontFamily,
      left: centerX,
      top: top * scale,
      fill: textColor,
      selectable: false,
      evented: false,
    });

    canvas.add(textObject);
    return textObject;
  };

  const loadFabricImage = (url, options = {}) => {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        url,
        (img) => {
          if (img && img.getElement()) {
            resolve(img);
          } else {
            reject(new Error('Failed to load image'));
          }
        },
        { crossOrigin: 'anonymous', ...options }
      );
    });
  };

  useEffect(() => {

    const canvas = new fabric.Canvas(canvasRef.current);
    fabricCanvasRef.current = canvas;

    const showLoadingIndicator = () => {
      const loaderText = new fabric.Text('Generating Ticket...', {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: 20,
        fill: '#555',
        fontFamily: 'Comic Sans MS',
        fontWeight: 'bold',
        fontStyle: 'italic',
        underline: true,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 5,
          offsetX: 2,
          offsetY: 2,
        }),
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      canvas.add(loaderText);
      canvas.renderAll();
      return loaderText;
    };

    const drawCanvas = async () => {
      const loader = showLoadingIndicator();

      try {
        // Load background image
        const img = await loadFabricImage(imageUrl);
        const imgWidth = img.width;
        const imgHeight = img.height;

        // Fixed display dimensions
        const displayWidth = 250;
        const displayHeight = 450;
        const scale = Math.min(displayWidth / imgWidth, displayHeight / imgHeight);
        const scaledWidth = displayWidth;
        const scaledHeight = displayHeight;

        canvas.setDimensions({ width: scaledWidth, height: scaledHeight });
        img.scaleToWidth(scaledWidth);
        img.scaleToHeight(scaledHeight);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        canvas.remove(loader);
        const qrImg = await loadFabricImage(qrDataUrl);
        
        const qrCodeWidth = 100 * scale;
        const qrCodeHeight = 100 * scale;
        const padding = 5 * scale;
        const qrPositionX = (scaledWidth / 2) - (qrCodeWidth / 2);
        const qrPositionY = 150 * scale;

        // Add white background for QR code
        const qrBackground = new fabric.Rect({
          left: qrPositionX - padding,
          top: qrPositionY - padding,
          width: qrCodeWidth + padding * 2,
          height: qrCodeHeight + padding * 2,
          fill: 'white',
          selectable: false,
          evented: false,
        });

        // Scale and position QR code
        qrImg.set({
          left: qrPositionX,
          top: qrPositionY,
          selectable: false,
          evented: false,
          scaleX: qrCodeWidth / qrImg.width,
          scaleY: qrCodeHeight / qrImg.height,
        });

        // Add ticket number below QR code
        const ticketNumberText = new fabric.Text(`Ticket #${ticketNumber || '1'}`, {
          left: scaledWidth / 2,
          top: qrPositionY + qrCodeHeight + (15 * scale),
          fontSize: 16 * scale,
          fontFamily: 'Arial',
          originX: 'center',
          textAlign: 'center',
          fill: '#000',
          selectable: false,
          evented: false,
        });

        // Add all QR elements to canvas
        canvas.add(qrBackground);
        canvas.add(qrImg);
        canvas.add(ticketNumberText);

        // Add ticket details if showDetails is true
        if (showDetails) {
          centerText(`${ticketName}` || 'Ticket Name', 16, 'Arial', canvas, 50, scale);
          centerText(`${userName}` || 'User Name', 16, 'Arial', canvas, 190, scale);
          centerText(`${number}` || 'User Number', 16, 'Arial', canvas, 210, scale);

          const eventVenueText = new fabric.Textbox(`Venue: ${address}`, {
            left: 26 * scale,
            top: 240 * scale,
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: textColor,
            selectable: false,
            evented: false,
            width: 250 * scale,
            lineHeight: 1.2,
          });

          const eventDateText = new fabric.Textbox(`Date: ${date} : ${time}`, {
            left: 26 * scale,
            top: 320 * scale,
            width: 200 * scale,
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: textColor,
            selectable: false,
            evented: false,
            lineHeight: 1.2,
          });

          canvas.add(eventDateText, eventVenueText);
        }

        // Final render
        canvas.renderAll();

      } catch (error) {
        // message.error('❌ Error:');
        canvas.remove(loader);
      }
    };

    drawCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl, qrDataUrl, OrderId, ticketName, userName, address, time, date, photo, number, showDetails, ticketNumber]);

  const downloadCanvas = () => {
    setLoading(true);
    try {
      const canvas = fabricCanvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Get original dimensions from background image
      const bgImage = canvas.backgroundImage;
      const originalWidth = bgImage.width;
      const originalHeight = bgImage.height;

      // Create a temporary canvas at original size
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;

      // Calculate scale ratio
      const scaleX = originalWidth / canvas.getWidth();
      const scaleY = originalHeight / canvas.getHeight();

      // Scale the context
      tempCtx.scale(scaleX, scaleY);

      // Draw the fabric canvas onto temp canvas
      const fabricEl = canvas.getElement();
      tempCtx.drawImage(fabricEl, 0, 0);

      const dataURL = tempCanvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `ticket_${OrderId || 'event'}.jpg`;
      link.click();

    } catch (error) {
      message.error('❌ Failed to download ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const printCanvas = () => {
    setLoading(true);
    try {
      const canvas = fabricCanvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Get original dimensions from background image
      const bgImage = canvas.backgroundImage;
      const originalWidth = bgImage.width;
      const originalHeight = bgImage.height;

      // Create a temporary canvas at original size
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;

      // Calculate scale ratio
      const scaleX = originalWidth / canvas.getWidth();
      const scaleY = originalHeight / canvas.getHeight();

      // Scale the context
      tempCtx.scale(scaleX, scaleY);

      // Draw the fabric canvas onto temp canvas
      const fabricEl = canvas.getElement();
      tempCtx.drawImage(fabricEl, 0, 0);

      const printWindow = window.open('', '', 'width=800,height=600');
      const printImage = new Image();
      printImage.src = tempCanvas.toDataURL('image/png');

      printImage.onload = () => {
        printWindow.document.body.innerHTML = '<h1>Ticket</h1>';
        printWindow.document.body.appendChild(printImage);
        printWindow.document.body.style.textAlign = 'center';
        printWindow.print();
        printWindow.close();
      };

    } catch (error) {
      message.error('❌ Failed to print ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="cnvs my-2">
        {loadingImage ? (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height:'30rem' }}>
            <canvas ref={canvasRef} className='cc'/>
          </div>
        )}
      </div>
      {!loadingImage && (
        <Row justify="center" className="mb-2">
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                type="primary"
                block
                icon={<CloudDownloadOutlined size={14} />}
                loading={loading}
                onClick={downloadCanvas}
                disabled={loading}
              >
                {loading ? 'Please Wait...' : 'Download'}
              </Button>
              {showPrintButton && (
                <Button
                  type="default"
                  block
                  icon={<PrinterOutlined size={18} />}
                  onClick={printCanvas}
                  loading={loading}
                  disabled={loading}
                >
                  Print
                </Button>
              )}
            </div>
          </Col>
        </Row>
      )}
      
      {/* Hidden QR Code Generator */}
      <div ref={qrContainerRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px'}}>
        <QRCodeCanvas 
          value={OrderId || ''} 
          size={150} 
          level="H" 
          includeMargin={true}
        />
      </div>
    </>
  );
};

export default TicketCanvas;