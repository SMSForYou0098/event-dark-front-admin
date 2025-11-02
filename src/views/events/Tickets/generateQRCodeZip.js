import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { createRoot } from 'react-dom/client';
import { Modal, notification } from 'antd';
import React from 'react';

const generateQRCodeZip = async ({ bookings, QRGenerator, loader, onModalOpen }) => {
    if (!bookings?.length) {
        notification.error({
            message: 'Error',
            description: 'No bookings found to generate QR codes',
        });
        return;
    }

    // Show Ant Design Modal for progress IMMEDIATELY
    let modal;
    let progress = 0;
    const ProgressContent = ({ progress, total }) => (
        <div style={{ textAlign: 'center' }}>
            {loader && (
                <img src={loader} style={{ width: '10rem', display: 'block', margin: '0 auto' }} alt="Loading" />
            )}
            <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>
                Progress: <span style={{ color: '#1677ff' }}>{progress}%</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                Processing {progress} of {total} QR codes
            </div>
            <div style={{ width: '100%', border: '1px solid #dddddd', borderRadius: 10, marginTop: 16, overflow: 'hidden' }}>
                <div
                    style={{
                        width: `${progress}%`,
                        height: 20,
                        background: 'linear-gradient(90deg, #1677ff 0%, #52c41a 100%)',
                        transition: 'width 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 500,
                    }}
                >
                    {progress > 10 && `${progress}%`}
                </div>
            </div>
        </div>
    );

    // Create modal IMMEDIATELY before any processing
    const total = bookings?.length;
    modal = Modal.info({
        title: 'Generating QR Codes',
        content: <ProgressContent progress={0} total={total} />,
        closable: false,
        maskClosable: false,
        okButtonProps: { style: { display: 'none' } },
        width: 400,
        centered: true,
    });

    // Call onModalOpen callback immediately after modal is created
    // Use setTimeout to ensure modal is rendered
    setTimeout(() => {
        onModalOpen?.();
    }, 0);

    // Create a container div for QR codes
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    // Helper to update modal content
    const updateModal = (newProgress) => {
        progress = newProgress;
        modal && modal.update({
            content: <ProgressContent progress={progress} total={total} />
        });
    };

    try {
        const zip = new JSZip();

        // Convert SVG to PNG using canvas
        const svgToPng = async (svgElement) => {
            return new Promise((resolve, reject) => {
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

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load SVG image'));
                };

                img.src = url;
            });
        };

        // Process in batches to avoid memory issues and update progress incrementally
        const BATCH_SIZE = 10; // Process 10 QR codes at a time
        let processedCount = 0;

        // Helper function to process a single booking
        const processBooking = async (booking, index) => {
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

                // Wait for React to render
                await new Promise(resolve => setTimeout(resolve, 50));

                const svgElement = qrElement.querySelector('svg');
                let pngBlob = null;

                if (svgElement) {
                    pngBlob = await svgToPng(svgElement);
                }

                qrRoot.unmount();
                container.removeChild(qrElement);

                return {
                    index: index,
                    blob: pngBlob
                };
            } catch (error) {
                console.error(`Error generating QR code for booking ${index}:`, error);
                return null;
            }
        };

        // Process bookings in batches
        for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
            const batch = bookings.slice(i, i + BATCH_SIZE);
            
            const batchResults = await Promise.all(
                batch.map((booking, batchIndex) => {
                    const globalIndex = i + batchIndex;
                    return processBooking(booking, globalIndex);
                })
            );

            // Update progress and add to zip
            for (const result of batchResults) {
                if (result && result.blob) {
                    zip.file(`${result.index + 1}.png`, result.blob);
                }
                // Count both successful and failed items for progress
                processedCount++;
                // Update progress after each item
                updateModal(Math.round((processedCount / total) * 100));
            }

            // Small delay between batches to keep UI responsive
            if (i + BATCH_SIZE < bookings.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

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