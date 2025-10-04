import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { fabric } from 'fabric-pure-browser';
import { QRCodeCanvas } from 'qrcode.react';
const TicketCanvasZip = forwardRef((props, ref) => {
  const { showDetails, ticketName, userName, number, address, imageUrl, date, time, photo, OrderId } = props

  const canvasRef = useRef(null);
  const qrCodeRef = useRef(null);
  const textColor = '#000'


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
      if (imageUrl) {
        try {
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
              const qrPositionX = 80;
              const qrPositionY = 80;

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

              canvas.add(qrBackground, qrImg);
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


  useImperativeHandle(ref, () => ({
    canvasRef,
    // Add a direct method to get the canvas data URL for more reliability
    getCanvasDataURL: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL("image/jpeg", 0.9);
      }
      return null;
    }
  }));
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ display: 'none' }}>
        <QRCodeCanvas ref={qrCodeRef} value={OrderId} size={150} />
      </div>
    </>
  );
});

export default TicketCanvasZip;
