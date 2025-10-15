import * as faceapi from "face-api.js";

// Only static method, no UI/component needed
const FaceDetector = {};

FaceDetector.cropFaceFromImage = async (imageDataUrl) => {
    // Load face-api.js models if not already loaded
    if (!faceapi.nets.tinyFaceDetector.params) {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    }

    return new Promise(async (resolve) => {
        const img = new window.Image();
        img.src = imageDataUrl;
        img.onload = async () => {
            // Create canvas from image
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Detect face
            const detection = await faceapi.detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions());
            if (detection) {
                let { x, y, width, height } = detection.box;

                // 🔥 Expand bounding box to include forehead + chin + shoulders
                const expandY = height * 0.5; // add 50% extra top/bottom
                const expandX = width * 0.3;  // add 30% extra on left/right

                x = Math.max(0, x - expandX);
                y = Math.max(0, y - expandY * 0.6); // more space above forehead
                width = Math.min(canvas.width - x, width + expandX * 2);
                height = Math.min(canvas.height - y, height + expandY);

                // Crop expanded face region
                const faceCanvas = document.createElement("canvas");
                faceCanvas.width = width;
                faceCanvas.height = height;
                const faceCtx = faceCanvas.getContext("2d");
                faceCtx.drawImage(canvas, x, y, width, height, 0, 0, width, height);

                faceCanvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], "face_photo.jpg", { type: "image/jpeg" }));
                    } else {
                        resolve(null);
                    }
                }, "image/jpeg");
            } else {
                resolve(null); // No face detected
            }
        };
        img.onerror = () => resolve(null);
    });
};

export default FaceDetector;
