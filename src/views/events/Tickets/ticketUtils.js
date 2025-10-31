import html2canvas from "html2canvas";
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
export const downloadTickets = (ticketRefs, ticketType, setLoading) => {
    // Set loading state immediately
    setLoading(true);
    setTimeout(async () => {
        const generateCanvas = async (ref, scaleFactor =  window.devicePixelRatio || 2) => {
            // window.devicePixelRatio * 2 || 4  = 1.2mb
            return html2canvas(ref, {
                useCORS: true,
                allowTaint: true,
                scale: scaleFactor,
                backgroundColor: null, // Ensures transparent background if any
                logging: false, // Disables logging for better performance
            });
        };

        try {
            if (ticketType === 'combine') {
                for (let index = 0; index < ticketRefs.current.length; index++) {
                    const ref = ticketRefs.current[index];
                    if (ref) {
                        const canvas = await generateCanvas(ref);
                        const imgData = canvas.toDataURL('image/webp', 2.0); // High-quality image format
                        const link = document.createElement('a');
                        link.href = imgData;
                        link.download = `ticket_${index + 1}.webp`;
                        link.click();
                    }
                }
            } else if (ticketType === 'individual') {
                const promises = ticketRefs.current.map((ref, index) => {
                    if (ref) {
                        return generateCanvas(ref)
                            .then((canvas) => {
                                const imgData = canvas.toDataURL('image/jpeg', 2.0);
                                const { width, height } = canvas;
                                return { imgData, width, height };
                            });
                    }
                    return Promise.resolve(null);
                });

                const results = await Promise.all(promises);
                const pdfBlob = await createPDF(results);
                saveAs(pdfBlob, 'tickets.pdf');
            }
        } catch (error) {
            console.error('Error generating ticket(s):', error);
        } finally {
            // Ensure loading state is set to false after all operations
            setLoading(false);
        }
    }, 0);
};

export const createPDF = async (imageDataList) => {
    const pdfDoc = await PDFDocument.create();

    for (const { imgData, width, height } of imageDataList) {
        const page = pdfDoc.addPage([width, height]); // Set page size based on image size

        const pdfImage = await pdfDoc.embedJpg(imgData);
        page.drawImage(pdfImage, {
            x: 0,
            y: 0,
            width,
            height,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
};