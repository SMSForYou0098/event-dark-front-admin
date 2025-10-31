import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric-pure-browser';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, Col, Row, Spin } from 'antd';
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
      console.error('Image fetch error:', error);
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
      console.log('No OrderId provided');
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
          console.error('❌ Error extracting QR code:', error);
          return false;
        }
      } else {
        console.log('⏳ QR canvas not found yet');
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
          console.log(`Attempt ${attemptCount} to extract QR code...`);
          const success = extractQRCode();
          if (success) {
            // console.log('QR code extraction successful!');
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

  const centerText = (text, fontSize, fontFamily, canvas, top) => {
    const textWidth = getTextWidth(text, fontSize, fontFamily);
    const canvasWidth = canvas.getWidth();
    const centerX = (canvasWidth - textWidth) / 2;

    const textObject = new fabric.Text(text, {
      fontSize,
      fontFamily,
      left: centerX,
      top: top,
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
    // if (!imageUrl || !qrDataUrl || !OrderId) {
    //   console.log('📊 Waiting for dependencies:', { 
    //     imageUrl: !!imageUrl, 
    //     qrDataUrl: !!qrDataUrl, 
    //     OrderId: !!OrderId 
    //   });
    //   return;
    // }

    // console.log('🎨 All dependencies ready, drawing canvas...');

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

        canvas.setDimensions({ width: imgWidth, height: imgHeight });
        img.scaleToWidth(imgWidth);
        img.scaleToHeight(imgHeight);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

        canvas.remove(loader);
        console.log('✅ Background loaded:', imgWidth, 'x', imgHeight);

        // Load and add QR code
        console.log('🔄 Loading QR code image...');
        const qrImg = await loadFabricImage(qrDataUrl);
        
        const qrCodeWidth = 100;
        const qrCodeHeight = 100;
        const padding = 5;
        const qrPositionX = (imgWidth / 2) - (qrCodeWidth / 2);
        const qrPositionY = 150;

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
          left: imgWidth / 2,
          top: qrPositionY + qrCodeHeight + 15,
          fontSize: 16,
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

        console.log('✅ QR code added at position:', qrPositionX, qrPositionY);

        // Add ticket details if showDetails is true
        if (showDetails) {
          centerText(`${ticketName}` || 'Ticket Name', 16, 'Arial', canvas, 50);
          centerText(`${userName}` || 'User Name', 16, 'Arial', canvas, 190);
          centerText(`${number}` || 'User Number', 16, 'Arial', canvas, 210);

          const eventVenueText = new fabric.Textbox(`Venue: ${address}`, {
            left: 30,
            top: 240,
            fontSize: 16,
            fontFamily: 'Arial',
            fill: textColor,
            selectable: false,
            evented: false,
            width: 250,
            lineHeight: 1.2,
          });

          const eventDateText = new fabric.Textbox(`Date: ${date} : ${time}`, {
            left: 30,
            top: 320,
            width: 200,
            fontSize: 16,
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
        console.error('❌ Error drawing canvas:', error);
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
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempCtx.drawImage(canvas, 0, 0);

      const dataURL = tempCanvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `ticket_${OrderId || 'event'}.jpg`;
      link.click();

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const printCanvas = () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      tempCtx.drawImage(canvas, 0, 0);

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
      console.error('Print error:', error);
      alert('Failed to print ticket. Please try again.');
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
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <canvas ref={canvasRef} />
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
      <div ref={qrContainerRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
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
