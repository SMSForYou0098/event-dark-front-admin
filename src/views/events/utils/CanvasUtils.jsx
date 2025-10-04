import axios from "axios";
import { Check } from "lucide-react";
import { Form, Typography } from "antd"; // Use Ant Design components
import { fabric } from "fabric-pure-browser";
import { capitalize } from "lodash";
import QRCode from "qrcode";

export const FetchImageBlob = async (api, setLoading, imageUrl, setState) => {
    // console.log(api, 'setLoading', imageUrl, 'setFinalImage');
  if (!imageUrl) {
    setState(null);
    setLoading(false);
    return;
  }
  try {
    const res = await axios.post(
      `${api}get-image/retrive`,
      { path: imageUrl },
      { responseType: "blob" }
    );
    const imageBlob = res.data;
    const url = URL.createObjectURL(imageBlob);
    setState(url);
  } catch (error) {
    console.error("Error fetching image:", error);
    setState(null);
  } finally {
    setLoading(false);
  }
};

export const ImageStyleSelector = ({ isCircle, setIsCircle }) => {
  const renderOption = (label, isSelected, onClick, isCircular) => {
    return (
      <div
        className={`shadow-sm transition cursor-pointer`}
        style={{
          width: "90px",
          height: "90px",
          borderRadius: isCircular ? "50%" : "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f3f5",
          cursor: "pointer",
          position: "relative",
          border: isSelected ? "2px solid #1677ff" : "1px solid #eee",
          boxShadow: isSelected ? "0 0 0 2px #1677ff22" : "none",
        }}
        onClick={onClick}
      >
        <Typography.Text strong style={{ color: "#333", fontSize: 13 }}>
          {label}
        </Typography.Text>
        {isSelected && (
          <div
            style={{
              position: "absolute",
              background: "#1677ff",
              color: "#fff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "22px",
              height: "22px",
              top: "-6px",
              right: "-6px",
              fontSize: "12px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            <Check size={14} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Form.Item
      label={<span style={{ fontWeight: 500, color: "#888" }}>Image Style</span>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
        {renderOption("Circle", isCircle, () => setIsCircle(true), true)}
        {renderOption("Square", !isCircle, () => setIsCircle(false), false)}
      </div>
    </Form.Item>
  );
};

export const CreateHDCanvas = async ({
  finalImage,
  userImage,
  userData,
  orderId,
  zones = [],
  bgRequired = true,
  resolutionMultiplier = 10,
}) => {
  const BASE_WIDTH = 400;
  const HD_WIDTH = BASE_WIDTH * resolutionMultiplier;

  // 1. Create off-screen canvas
  const hdCanvas = new fabric.Canvas(null, {
    width: HD_WIDTH,
    height: 600 * resolutionMultiplier,
  });

  // 2. Draw background
  const bgImg = await new Promise((resolve) => {
    fabric.Image.fromURL(
      finalImage,
      (img) => {
        const scale = HD_WIDTH / img?.width;
        img.scaleX = scale;
        img.scaleY = scale;
        img.selectable = false;
        img.evented = false;
        resolve(img);
      },
      { crossOrigin: "anonymous" }
    );
  });

  if (bgRequired && bgImg) {
    hdCanvas.setBackgroundImage(bgImg, hdCanvas.renderAll.bind(hdCanvas));
  } else {
    hdCanvas.backgroundColor = "white";
  }

  // 3. Add user image
  if (userImage) {
    const circleRadius = 70 * resolutionMultiplier;
    const centerX = 200 * resolutionMultiplier;
    const centerY = 235 * resolutionMultiplier;

    const userImg = await new Promise((resolve) => {
      fabric.Image.fromURL(
        userImage,
        (img) => {
          const scale =
            (circleRadius * 2.5 * 1.05) / Math.max(img?.width, img.height);
          img.set({
            left: centerX,
            top: centerY,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            clipPath: new fabric.Circle({
              radius: circleRadius,
              originX: "center",
              originY: "center",
              left: centerX,
              top: centerY,
              absolutePositioned: true,
            }),
          });
          resolve(img);
        },
        { crossOrigin: "anonymous" }
      );
    });

    hdCanvas.add(userImg);
  }

  // 4. Add text
  const values = [
    capitalize(userData?.name) || "User Name",
    capitalize(userData?.designation) || "Designation",
    capitalize(userData?.company_name || userData?.comp_name) || "Company Name",
  ];
  values.forEach((text, i) => {
    hdCanvas.add(
      new fabric.Text(text, {
        left: HD_WIDTH / 2,
        top: (320 + i * 25) * resolutionMultiplier,
        fontSize: 18 * resolutionMultiplier,
        fontFamily: "Arial",
        fill: "#076066",
        fontWeight: "bold",
        selectable: false,
        evented: false,
        originX: "center",
      })
    );
  });

  // 5. Add QR
  const qrDataURL = await QRCode.toDataURL(orderId, {
    width: 120 * resolutionMultiplier, // Increase QR code generation size
    margin: 1, // Reduce margin in QR code itself
    color: {
      dark: "#000000",
      light: "#FFFFFF", // This creates the white background in QR
    },
  });
  const qrCodeWidth = 100 * resolutionMultiplier; // Increased from 100 to 120
  const qrCodeHeight = 100 * resolutionMultiplier; // Increased from 100 to 120
  const qrPositionX = 155 * resolutionMultiplier;
  const qrPositionY = 410 * resolutionMultiplier;
  const Radius = 12 * resolutionMultiplier; // Border radius for QR code

  const qrImg = await new Promise((resolve) => {
    fabric.Image.fromURL(qrDataURL, (img) => {
      img.set({
        left: qrPositionX,
        top: qrPositionY,
        selectable: false,
        evented: false,
        scaleX: qrCodeWidth / img?.width,
        scaleY: qrCodeHeight / img.height,
        clipPath: new fabric.Rect({
          left: qrPositionX,
          top: qrPositionY,
          width: qrCodeWidth,
          height: qrCodeHeight,
          rx: Radius,
          ry: Radius,
          absolutePositioned: true,
        }),
      });
      resolve(img);
    });
  });

  hdCanvas.add(qrImg);

  // 6. Add zone boxes
  const boxWidth = 28 * resolutionMultiplier;
  const boxHeight = 28 * resolutionMultiplier;
  const boxPadding = 8 * resolutionMultiplier;
  const numBoxes = zones?.length ?? 0;
  const totalBoxesWidth = numBoxes * boxWidth + (numBoxes - 1) * boxPadding;
  const boxStartX = (HD_WIDTH - totalBoxesWidth) / 2;
  const boxStartY = 530 * resolutionMultiplier;
  const borderRadius = 8 * resolutionMultiplier;

  const userZones = userData?.company?.zone
    ? Array.isArray(userData.company.zone)
      ? userData.company.zone
      : JSON.parse(userData.company.zone)
    : [];

  for (let i = 0; i < numBoxes; i++) {
    const currentZone = zones[i];
    const isUserZone = userZones.includes(currentZone?.id || currentZone);
    const box = new fabric.Rect({
      left: boxStartX + i * (boxWidth + boxPadding),
      top: boxStartY,
      width: boxWidth,
      height: boxHeight,
      fill: isUserZone ? "#076066" : "#f0f0f0",
      rx: borderRadius,
      ry: borderRadius,
      stroke: "#076066",
      strokeWidth: 2 * resolutionMultiplier,
      selectable: false,
      evented: false,
    });
    hdCanvas.add(box);

    if (isUserZone) {
      const checkIcon = new fabric.Text("✓", {
        left: boxStartX + i * (boxWidth + boxPadding) + boxWidth / 2,
        top: boxStartY + boxHeight / 2,
        fontSize: 16 * resolutionMultiplier,
        fill: "white",
        fontFamily: "Arial",
        fontWeight: "bold",
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });
      hdCanvas.add(checkIcon);
    } else {
      const zoneNumber = new fabric.Text((i + 1).toString(), {
        left: boxStartX + i * (boxWidth + boxPadding) + boxWidth / 2,
        top: boxStartY + boxHeight / 2,
        fontSize: 14 * resolutionMultiplier,
        fill: isUserZone ? "white" : "#076066",
        fontFamily: "Arial",
        fontWeight: "bold",
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });
      hdCanvas.add(zoneNumber);
    }
  }

  // hdCanvas.renderAll();
  return hdCanvas;
};

export const UploadToAPIBackground = async ({
  dataURL,
  filename,
  userId,
  api,
  authToken,
}) => {
  try {
    const response = await fetch(dataURL);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append("card", blob, filename);
    formData.append("user_id", userId);

    const apiResponse = await axios.post(`${api}user-card`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${authToken}`,
      },
    });

    return apiResponse.data;
  } catch (error) {
    return null;
  }
};
export const HandlePrint = async ({
  hdCanvas,
  orderId,
  userId,
  api,
  authToken,
  ErrorAlert,
}) => {
  const dataURL = hdCanvas.toDataURL({ format: "png", quality: 1.0 });

  try {
    const response = await axios.get(`${api}card-status/${userId}/1`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.data.status) {
      ErrorAlert("Card status update failed. Printing will continue.");
    }
  } catch (apiError) {
    ErrorAlert("Failed to update card status. Printing will continue.");
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Popup blocked. Please allow popups.");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print ID Card</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #fff;
          }
          img {
            max-width: 100%;
            max-height: 100vh;
          }
        </style>
      </head>
      <body>
        <img id="printImage" src="${dataURL}" />
      </body>
    </html>
  `);
  printWindow.document.close();

  printWindow.onload = () => {
    const img = printWindow.document.getElementById("printImage");
    if (img.complete) {
      printWindow.focus();
      printWindow.print();
    } else {
      img.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      img.onerror = () => {
        console.error("Image failed to load for printing");
        alert("Failed to load image for printing.");
      };
    }
  };
};
