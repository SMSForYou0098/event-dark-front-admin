import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createRoot } from 'react-dom/client';
import { Modal, notification } from 'antd';
import React from 'react';

const generateQRCodeZip = async ({ bookings, QRGenerator, loader }) => {
    if (!bookings?.length) {
        notification.error({
            message: 'Error',
            description: 'No bookings found to generate QR codes',
        });
        return;
    }

    // Show Ant Design Modal for progress
    let modal;
    let progress = 0;
    const ProgressContent = ({ progress }) => (
        <div style={{ textAlign: 'center' }}>
            <img src={loader} style={{ width: '10rem', display: 'block', margin: '0 auto' }} alt="Loading" />
            <div>Progress: <span>{progress}%</span></div>
            <div style={{ width: '100%', border: '1px solid #dddddd', borderRadius: 10, marginTop: 16 }}>
                <div
                    style={{
                        width: `${progress}%`,
                        height: 10,
                        borderRadius: 4,
                        background: '#1677ff',
                        transition: 'width 0.3s',
                    }}
                />
            </div>
        </div>
    );

    // Create a container div for QR codes
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Helper to update modal content
    const updateModal = (newProgress) => {
        progress = newProgress;
        modal && modal.update({
            content: <ProgressContent progress={progress} />
        });
    };

    modal = Modal.info({
        title: 'Processing',
        content: <ProgressContent progress={progress} />,
        closable: false,
        maskClosable: false,
        okButtonProps: { style: { display: 'none' } },
    });

    try {
        const zip = new JSZip();
        const total = bookings?.length;

        // Convert SVG to PNG using canvas
        const svgToPng = async (svgElement) => {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();

                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    canvas.width = 144;
                    canvas.height = 144;

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        URL.revokeObjectURL(url);
                        resolve(blob);
                    }, 'image/png');
                };

                img.src = url;
            });
        };

        let processedCount = 0;
        const batchResults = await Promise.all(
            bookings?.map(async (booking, index) => {
                try {
                    const qrElement = document.createElement('div');
                    container.appendChild(qrElement);

                    const qrRoot = createRoot(qrElement);
                    qrRoot.render(
                        <QRGenerator
                            value={booking?.token}
                            documentId={booking?.id || 'unknown'}
                        />
                    );

                    await new Promise(resolve => setTimeout(resolve, 100));

                    const svgElement = qrElement.querySelector('svg');
                    let pngBlob = null;

                    if (svgElement) {
                        pngBlob = await svgToPng(svgElement);
                    }

                    qrRoot.unmount();
                    container.removeChild(qrElement);

                    processedCount++;
                    updateModal(Math.round((processedCount / total) * 100));
                    return {
                        name: index + 1,
                        blob: pngBlob
                    };
                } catch (error) {
                    console.error(`Error generating QR code for booking:`, error);
                    return null;
                }
            })
        );

        batchResults.forEach((result, i) => {
            if (result && result.blob) {
                zip.file(`${i + 1}.png`, result.blob);
            }
        });

        // Generate and download the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, 'qr_codes.zip');

        // Clean up
        document.body.removeChild(container);
        modal && modal.destroy();

        // Show success message
        notification.success({
            message: 'Success!',
            description: 'QR codes have been generated and downloaded',
            duration: 2
        });

    } catch (error) {
        console.error('Error in zip generation:', error);
        modal && modal.destroy();

        notification.error({
            message: 'Error',
            description: 'Failed to generate QR codes. Please try again.',
        });
    }
};

export default generateQRCodeZip;