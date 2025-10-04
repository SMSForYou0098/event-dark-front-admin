import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric-pure-browser';
import { QRCodeCanvas } from 'qrcode.react';
import { Button, Col, Row, Spin } from 'antd'; // <-- Ant Design components
import axios from 'axios';
import { ArrowBigDownDash, Printer } from 'lucide-react';
import { capitalize } from 'lodash';
import { useMyContext } from 'Context/MyContextProvider';

const AccreditationTicket = (props) => {
  const { showDetails, ticketName, title, userName, number, address, ticketBG, date, time, photo, OrderId, showPrintButton, user } = props
  const { api } = useMyContext()
  const canvasRef = useRef(null);
  const qrCodeRef = useRef(null);
  const profileImageRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');
  const [loading, setLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const textColor = '#000'
  const fetchImage = async (bg, setBg) => {
    try {
      const response = await axios.post(
        `${api}get-image/retrive`,
        { path: bg },
        { responseType: 'blob' }
      );
      const imageUrl = URL.createObjectURL(response.data);
      setBg(imageUrl);
    } catch (error) {
      console.error('Image fetch error:', error);
    }
  };

  useEffect(() => {
    if (ticketBG && user) {
      if (user.photo) {
        fetchImage(user.photo, setProfileImage);
      }
      fetchImage(ticketBG, setImageUrl);
    }
  }, [ticketBG]);

  const getTextWidth = (text, fontSize = 16, fontFamily = 'Arial') => {
    const tempText = new fabric.Text(text, {
      fontSize,
      fontFamily,
    });
    return tempText?.width;
  };
  const centerText = (text, fontSize, fontFamily, canvas, top, color) => {
    const textWidth = getTextWidth(text, fontSize, fontFamily);
    const canvasWidth = canvas?.getWidth();
    const centerX = (canvasWidth - textWidth) / 2;

    const textObject = new fabric.Text(text, {
      fontSize,
      fontFamily,
      left: centerX,
      top: top,
      fill: color || textColor, // Use your text color
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
        left: canvas?.width / 2,
        top: canvas?.height / 2,
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
          const imgWidth = img?.width;
          const imgHeight = img?.height;

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
              const qrPositionX = 78;
              const qrPositionY = 300;

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
                scaleX: qrCodeWidth / qrImg?.width,
                scaleY: qrCodeHeight / qrImg?.height,
              });

              canvas.add(qrBackground, qrImg);
              canvas.renderAll();
            });
          }

          // Show profile image
          if (profileImage) {
            const profileImageURL = profileImage;
            const circleCenterX = 140;
            const circleCenterY = 160;
            const circleRadius = 55; // smaller image
            // Try Fabric.js first
            fabric.Image.fromURL(profileImageURL, (img) => {
              if (img) {
                const scale = (circleRadius * 2) / Math.max(img?.width, img.height);
                img.set({
                  left: circleCenterX - circleRadius,
                  top: circleCenterY - circleRadius,
                  scaleX: scale,
                  scaleY: scale,
                  selectable: false,
                  evented: false
                });

                canvas.add(img);
                canvas.renderAll();
              } else {
                // Fallback to native canvas
                const ctx = canvas.getContext('2d');
                const nativeImg = new window.Image();
                nativeImg.crossOrigin = 'anonymous';
                nativeImg.onload = function () {
                  ctx.drawImage(
                    nativeImg,
                    circleCenterX - circleRadius,
                    circleCenterY - circleRadius,
                    circleRadius * 2,
                    circleRadius * 2
                  );
                };
                nativeImg.src = profileImageURL;
              }
            }, { crossOrigin: 'anonymous' });
          }

          // Conditionally show other ticket details
          if (showDetails) {
            // centerText(`${capitalize(userName)}` || 'User Name', 16, 'Arial', canvas, 230,'white');
            // centerText(`${user?.designation}` || 'User Number', 16, 'Arial', canvas, 250,'white');
            // centerText(`${capitalize(user?.company_name)}` || 'Company Name', 16, 'Arial', canvas, 270,'white');
            // Only values, since labels are in the image
            const values = [
              capitalize(userName) || 'User Name',
              capitalize(user?.designation) || 'User Designation',
              // (number !== undefined && number !== null && number !== '') ? String(number) : 'User Number',
              capitalize(user?.company_name) || 'Campany Name',

            ];
            const fontSize = 16;
            const fontFamily = 'Arial';
            const valueLeft = 85; // <-- Adjust this to match where values should start
            const startTop = 225;  // <-- Adjust this to match the first value's Y position
            const verticalGap = 20; // <-- Adjust this to match the gap between lines

            values.forEach((value, i) => {
              const valueText = new fabric.Text(value, {
                left: valueLeft,
                top: startTop + i * verticalGap,
                fontSize,
                fontFamily,
                fill: 'white', // Change text color to white
                fontWeight: 'bold', // Make text bold
                selectable: false,
                evented: false,
                originX: 'left'
              });
              canvas.add(valueText);
            });
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
      tempCanvas.width = canvas?.width;
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
      tempCanvas.width = canvas?.width;
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
      <Row justify="center" className="mb-2">
        <Col xs={24} sm={12}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              block
              icon={<ArrowBigDownDash size={18} />}
              onClick={downloadCanvas}
              disabled={loading}
            >
              {loading ? "Please Wait..." : "Download"}
            </Button>
            {showPrintButton && (
              <Button
                type="default"
                block
                icon={<Printer size={18} />}
                onClick={printCanvas}
                disabled={loading}
              >
                Print
              </Button>
            )}
          </div>
        </Col>
      </Row>
      {loadingImage ? (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Spin size="large" />
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <canvas ref={canvasRef} />
        </div>
      )}
      <div style={{ display: 'none' }}>
        <QRCodeCanvas ref={qrCodeRef} value={OrderId} size={150} />
      </div>
    </>
  );
};

export default AccreditationTicket;
