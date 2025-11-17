const AttendeesPrint = ({
  attendeesList,
  eventData,
  ticket,
  bookings,
 primaryColor = '#B51515' 
}) => {

  // Print individual attendee
  const handlePrintAttendee = (attendee, index) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            @page {
              size: 3in 2in;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              width: 3in;
              height: 2in;
              padding: 0.1in;
              font-size: 8pt;
              overflow: hidden;
            }
            .attendee-card {
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              padding: 0.1in;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .attendee-header {
              text-align: center;
              margin-bottom: 0.05in;
            }
            .attendee-header h3 {
              font-size: 10pt;
              color: ${primaryColor};
              margin: 0;
              font-weight: bold;
            }
            .attendee-content {
              display: flex;
              gap: 0.1in;
              flex: 1;
            }
            .attendee-photo {
              flex-shrink: 0;
            }
            .attendee-photo img {
              width: 0.8in;
              height: 0.8in;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid ${primaryColor};
            }
            .attendee-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: 7pt;
            }
            .info-row {
              margin-bottom: 0.02in;
              line-height: 1.2;
            }
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 6pt;
            }
            .info-value {
              color: #333;
              font-size: 7pt;
            }
            .event-name {
              font-size: 6pt;
              color: #666;
              text-align: center;
              margin-top: 0.02in;
              border-top: 1px solid #e8e8e8;
              padding-top: 0.02in;
            }
            @media print {
              body {
                width: 3in;
                height: 2in;
              }
            }
          </style>
        </head>
        <body>
          <div class="attendee-card">
            <div class="attendee-header">
              <h3>Attendee #${index + 1}</h3>
            </div>
            
            <div class="attendee-content">
              ${attendee?.Photo ? `
                <div class="attendee-photo">
                  <img src="${attendee.Photo}" alt="${attendee.Name}" onerror="this.style.display='none'" />
                </div>
              ` : ''}
              
              <div class="attendee-info">
                <div class="info-row">
                  <div class="info-label">Name:</div>
                  <div class="info-value"><strong>${attendee?.Name || 'N/A'}</strong></div>
                </div>

                ${attendee?.Mo ? `
                  <div class="info-row">
                    <div class="info-label">Mobile:</div>
                    <div class="info-value">${attendee.Mo}</div>
                  </div>
                ` : ''}

                ${attendee?.Email ? `
                  <div class="info-row">
                    <div class="info-label">Email:</div>
                    <div class="info-value" style="font-size: 6pt; word-break: break-all;">${attendee.Email}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="event-name">
              ${eventData?.name || 'Event'} - ${ticket?.name || 'Ticket'}
            </div>
          </div>
        </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    // Wait for content to load, then print
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 100);
    }, 250);
  };

  // Print all attendees in a single document with page breaks
  const handlePrintAllAttendees = () => {
    if (!attendeesList || attendeesList.length === 0) {
      return;
    }

    // Generate HTML for all attendees
    const attendeesHTML = attendeesList.map((attendee, index) => `
      <div class="attendee-page">
        <div class="attendee-card">
          <div class="attendee-header">
            <h3>Attendee #${index + 1}/${attendeesList.length}</h3>
          </div>
          
          <div class="attendee-content">
            ${attendee?.Photo ? `
              <div class="attendee-photo">
                <img src="${attendee.Photo}" alt="${attendee.Name}" onerror="this.style.display='none'" />
              </div>
            ` : ''}
            
            <div class="attendee-info">
              <div class="info-row">
                <div class="info-label">Name:</div>
                <div class="info-value"><strong>${attendee?.Name || 'N/A'}</strong></div>
              </div>

              ${attendee?.Mo ? `
                <div class="info-row">
                  <div class="info-label">Mobile:</div>
                  <div class="info-value">${attendee.Mo}</div>
                </div>
              ` : ''}

              ${attendee?.Email ? `
                <div class="info-row">
                  <div class="info-label">Email:</div>
                  <div class="info-value" style="font-size: 6pt; word-break: break-all;">${attendee.Email}</div>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="event-name">
            ${eventData?.name || 'Event'} - ${ticket?.name || 'Ticket'}
          </div>
        </div>
      </div>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print All Attendees - ${eventData?.name || 'Event'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: 3in 2in;
              margin: 0;
            }
            
            body {
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
              padding: 0;
            }
            
            .attendee-page {
              width: 3in;
              height: 2in;
              page-break-after: always;
              page-break-inside: avoid;
              padding: 0.1in;
              font-size: 8pt;
              overflow: hidden;
            }
            
            .attendee-page:last-child {
              page-break-after: auto;
            }
            
            .attendee-card {
              border: 1px solid #d9d9d9;
              border-radius: 4px;
              padding: 0.1in;
              height: 100%;
              width: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            
            .attendee-header {
              text-align: center;
              margin-bottom: 0.05in;
            }
            
            .attendee-header h3 {
              font-size: 10pt;
              color: ${primaryColor};
              margin: 0;
              font-weight: bold;
            }
            
            .attendee-content {
              display: flex;
              gap: 0.1in;
              flex: 1;
            }
            
            .attendee-photo {
              flex-shrink: 0;
            }
            
            .attendee-photo img {
              width: 0.8in;
              height: 0.8in;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid ${primaryColor};
            }
            
            .attendee-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              font-size: 7pt;
            }
            
            .info-row {
              margin-bottom: 0.02in;
              line-height: 1.2;
            }
            
            .info-label {
              font-weight: bold;
              color: #666;
              font-size: 6pt;
            }
            
            .info-value {
              color: #333;
              font-size: 7pt;
            }
            
            .event-name {
              font-size: 6pt;
              color: #666;
              text-align: center;
              margin-top: 0.02in;
              border-top: 1px solid #e8e8e8;
              padding-top: 0.02in;
            }
            
            @media print {
              .attendee-page {
                width: 3in;
                height: 2in;
                page-break-after: always;
              }
              
              .attendee-page:last-child {
                page-break-after: auto;
              }
            }
          </style>
        </head>
        <body>
          ${attendeesHTML}
        </body>
      </html>
    `;

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(printContent);
    iframeDoc.close();

    // Wait for images to load, then print
    const images = iframeDoc.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = resolve;
          img.onerror = resolve;
        }
      });
    });

    Promise.all(imagePromises).then(() => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Clean up after print dialog closes
        const checkPrintDialog = setInterval(() => {
          if (!iframe.contentWindow) {
            clearInterval(checkPrintDialog);
            return;
          }
          
          // Remove iframe after a delay
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            clearInterval(checkPrintDialog);
          }, 500);
        }, 1000);
      }, 300);
    });
  };

  return {
    handlePrintAttendee,
    handlePrintAllAttendees
  };
};

export default AttendeesPrint;