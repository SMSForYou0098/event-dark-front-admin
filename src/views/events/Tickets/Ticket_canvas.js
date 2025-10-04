import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric-pure-browser';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, Col, Row, Spin } from 'antd'; // Use Ant Design components
import axios from 'axios';
import { ArrowBigDownDash, Printer } from 'lucide-react';
import { useMyContext } from 'Context/MyContextProvider';

const TicketCanvas = (props) => {
  const { showDetails, ticketName, userName, number, address, ticketBG, date, time, photo, OrderId, showPrintButton, ticketNumber } = props
  const { api } = useMyContext()
  const canvasRef = useRef(null);
  const qrCodeRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const textColor = '#000'
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
    //  console.log(ticketName, userName, number, address, ticketBG, date, time, photo, OrderId)
  }, [ticketBG]);

  const getTextWidth = (text, fontSize = 16, fontFamily = 'Arial') => {
    const tempText = new fabric.Text(text, {
      fontSize,
      fontFamily,
    });
    return tempText.width;
  };
  const centerText = (text, fontSize, fontFamily, canvas, top) => {
    const textWidth = getTextWidth(text, fontSize, fontFamily); // Get the width of the text
    const canvasWidth = canvas.getWidth(); // Get the canvas width
    const centerX = (canvasWidth - textWidth) / 2; // Calculate the center position

    const textObject = new fabric.Text(text, {
      fontSize,
      fontFamily,
      left: centerX,
      top: top,
      fill: textColor, // Use your text color
      selectable: false,
      evented: false,
    });

    canvas.add(textObject);
    canvas.renderAll();

    return textObject; // Return the fabric.Text object if needed
  };
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current);
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


    const loadBackgroundImage = (url) => {
      return new Promise((resolve, reject) => {
        fabric.Image.fromURL(url, (img) => {
          if (img) {
            resolve(img);
          } else {
            reject(new Error('Failed to load image'));
          }
        }, { crossOrigin: 'anonymous' });
      });
    };

    const drawCanvas = async () => {
      const loader = showLoadingIndicator();
      if (imageUrl) {
        try {
          canvas.remove(loader);
          const img = await loadBackgroundImage(imageUrl);
          const imgWidth = img.width;
          const imgHeight = img.height;

          canvas.setDimensions({ width: imgWidth, height: imgHeight });
          img.scaleToWidth(imgWidth);
          img.scaleToHeight(imgHeight);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            crossOrigin: 'anonymous',
          });

          // Always show QR code
          const qrCodeCanvas = qrCodeRef.current;
          if (qrCodeCanvas) {
            const qrCodeDataURL = qrCodeCanvas.toDataURL('image/png');

            fabric.Image.fromURL(qrCodeDataURL, (qrImg) => {
              const qrCodeWidth = 100;
              const qrCodeHeight = 100;
              const padding = 5;
              const qrPositionX = 100;
              const qrPositionY = 100;

              const qrBackground = new fabric.Rect({
                left: qrPositionX - padding,
                top: qrPositionY - padding,
                width: qrCodeWidth + padding * 2,
                height: qrCodeHeight + padding * 2,
                fill: 'white',
                selectable: false,
                evented: false,
              });

              qrImg.set({
                left: qrPositionX,
                top: qrPositionY,
                selectable: false,
                evented: false,
                scaleX: qrCodeWidth / qrImg.width,
                scaleY: qrCodeHeight / qrImg.height,
              });

              const ticketNumberText = new fabric.Text(`${ticketNumber || '1'}`, {
                left: qrPositionX + 50,
                top: qrPositionY + qrCodeHeight + 21, // Position below QR code
                fontSize: 16,
                fontFamily: 'Arial',
                originX: 'center', // ✅ makes the text align from its center
                textAlign: 'center',
                fill: "#000",
                selectable: false,
                evented: false,
              });

              canvas.add(qrBackground, qrImg, ticketNumberText);
              canvas.renderAll();
            });
          }

          // Conditionally show other ticket details
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
            canvas.renderAll();
          }

        } catch (error) {
          console.error('Error drawing canvas:', error);
        }
      }
    };

    drawCanvas();

    return () => {
      canvas.dispose();
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl, OrderId, ticketName, userName, address, time, date, photo, number, showDetails]);


  // Download functionality
  const downloadCanvas = () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      // Create a temporary canvas for safe export
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Draw the fabric.js canvas content onto the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Create the download link from the temporary canvas with JPG format
      const dataURL = tempCanvas.toDataURL('image/jpeg', 0.9); // 0.9 is quality level (0-1)
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

      // Create a temporary canvas for safe export
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;

      // Draw the fabric.js canvas content onto the temporary canvas
      tempCtx.drawImage(canvas, 0, 0);

      // Create a new window for printing
      const printWindow = window.open('', '', 'width=800,height=600');

      // Create an image element and set the canvas data URL as the source
      const printImage = new Image();
      printImage.src = tempCanvas.toDataURL('image/png');

      // Once the image is loaded, inject it into the print window and trigger the print
      printImage.onload = () => {
        printWindow.document.body.innerHTML = '<h1>Ticket</h1>';
        printWindow.document.body.appendChild(printImage);
        printWindow.document.body.style.textAlign = 'center'; // Center the image
        printWindow.print(); // Trigger the print dialog
        printWindow.close(); // Close the print window after printing
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
        {
          loadingImage ?
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Spin size="large" />
            </div>
            :
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%'}}>
              <canvas ref={canvasRef} />
            </div>
        }
      </div>
      {!loadingImage &&
        <Row justify="center" className="mb-2">
          <Col xs={24} sm={12}>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                type="primary"
                block
                icon={<ArrowBigDownDash size={14} />}
                loading={loading}
                onClick={downloadCanvas}
                disabled={loading}
              >
                {loading ? "Please Wait..." : "Download"}
              </Button>
              {showPrintButton &&
                <Button
                  type="default"
                  block
                  icon={<Printer size={18} />}
                  onClick={printCanvas}
                  disabled={loading}
                >
                  Print
                </Button>
              }
            </div>
          </Col>
        </Row>
      }
      <div style={{ display: 'none' }}>
        <QRCodeCanvas ref={qrCodeRef} value={OrderId} size={150} />
      </div>
    </>
  );
};

export default TicketCanvas;
