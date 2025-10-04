import React, { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric-pure-browser";
import { Button, Spin } from "antd"; // Use Ant Design components
import { ArrowBigDownDash, Printer, Save, RotateCcw } from "lucide-react";
import QRCode from "qrcode";
import { capitalize } from "lodash";
import { QRCodeCanvas } from "qrcode.react";
import { useMyContext } from "Context/MyContextProvider";
import { UploadToAPIBackground } from "../utils/CanvasUtils";


const IDCardDragAndDrop = ({
  finalImage,
  orderId,
  userData,
  userImage,
  bgRequired = true,
  isEdit = true,
  isCircle = false,
  download = false,
  print = false,
  animate = false,
  setLayoutData,
  setShowSettingsModal,
  categoryId,
  fetchingLayout,
  handleCloseModal,
  savedLayout
}) => {
  const canvasRef = useRef(null);
  const qrCodeRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isDraggingRef = useRef(false);
  const isLoadingStateRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [elementPositions, setElementPositions] = useState({});
  const [showIntroAnimation, setShowIntroAnimation] = useState(animate);
  const [animationComplete, setAnimationComplete] = useState(!animate);
  const { authToken, ErrorAlert, api, isMobile } = useMyContext();

  const CANVAS_WIDTH = 204;
  const CANVAS_HEIGHT = 321;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    maxWidth: '100%'
  };

  // Action buttons container
  const actionButtonsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'center',
    ...(isMobile && {
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem'
    })
  };

  // Button group styles
  const buttonGroupStyle = {
    display: 'flex',
    gap: '0.75rem',
    ...(isMobile && {
      width: '70%',
      justifyContent: 'space-between'
    })
  };

  // Canvas container styles
  const canvasContainerStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  };

  // Canvas wrapper styles
  const canvasWrapperStyle = {
    maxWidth: '100%',
    overflow: 'auto',
  };

  // Loading state styles
  const loadingStyle = {
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '3rem 0',
    width: '100%'
  };
  const saveLayoutToBackend = async (layoutData) => {
  try {
    setLoading(true);
    const canvas = canvasRef.current?.fabricCanvas;
    if (canvas) {
      const currentPositions = trackElementPositions(canvas);

      // ✅ Inject isCircle into userPhoto
      const updatedLayout = {
        ...currentPositions,
        userPhoto: {
          ...currentPositions.userPhoto,
          isCircle: isCircle, // <-- pass your boolean here
        },
      };

      setLayoutData(updatedLayout); // Save layout with isCircle
      setShowSettingsModal(false);
    }
  } catch (error) {
    const err = error.response?.data?.message || "Failed to save layout";
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  // Undo/Redo functionality using refs for better performance
  const saveCanvasState = useCallback((canvas) => {
    if (!canvas || isLoadingStateRef.current || isDraggingRef.current) return;

    const canvasState = JSON.stringify(canvas.toJSON(["name"]));

    // Remove any history after current index
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );
    historyRef.current.push(canvasState);

    // Limit history to 50 states to prevent memory issues
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, []);

  const undo = useCallback((canvas) => {
    if (!canvas || historyIndexRef.current <= 0) return;

    const previousState = historyRef.current[historyIndexRef.current - 1];
    if (!previousState) return;

    historyIndexRef.current--;
    isLoadingStateRef.current = true;

    canvas.loadFromJSON(previousState, () => {
      canvas.renderAll();
      trackElementPositions(canvas);
      isLoadingStateRef.current = false;
    });
  }, []);

  const redo = useCallback((canvas) => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1)
      return;

    const nextState = historyRef.current[historyIndexRef.current + 1];
    if (!nextState) return;

    historyIndexRef.current++;
    isLoadingStateRef.current = true;

    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      trackElementPositions(canvas);
      isLoadingStateRef.current = false;
    });
  }, []);

  const createCenterGuides = (canvas) => {
    const canvasCenter = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };

    // Vertical center guide (red)
    const verticalGuide = new fabric.Line(
      [canvasCenter.x, 0, canvasCenter.x, canvas.height],
      {
        stroke: "#ff0000",
        strokeWidth: 1.5,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "verticalCenterGuide",
        opacity: 0,
      }
    );

    // Horizontal center guide (red)
    const horizontalGuide = new fabric.Line(
      [0, canvasCenter.y, canvas.width, canvasCenter.y],
      {
        stroke: "#ff0000",
        strokeWidth: 1.5,
        strokeDashArray: [8, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "horizontalCenterGuide",
        opacity: 0,
      }
    );

    // Left third guide (green)
    const leftThirdGuide = new fabric.Line(
      [canvas.width / 3, 0, canvas.width / 3, canvas.height],
      {
        stroke: "#00ff00",
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "leftThirdGuide",
        opacity: 0,
      }
    );

    // Right third guide (green)
    const rightThirdGuide = new fabric.Line(
      [(canvas.width * 2) / 3, 0, (canvas.width * 2) / 3, canvas.height],
      {
        stroke: "#00ff00",
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "rightThirdGuide",
        opacity: 0,
      }
    );

    // Top quarter guide (blue)
    const topQuarterGuide = new fabric.Line(
      [0, canvas.height / 4, canvas.width, canvas.height / 4],
      {
        stroke: "#0066ff",
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "topQuarterGuide",
        opacity: 0,
      }
    );

    // Bottom quarter guide (blue)
    const bottomQuarterGuide = new fabric.Line(
      [0, (canvas.height * 3) / 4, canvas.width, (canvas.height * 3) / 4],
      {
        stroke: "#0066ff",
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        selectable: false,
        evented: false,
        excludeFromExport: true,
        name: "bottomQuarterGuide",
        opacity: 0,
      }
    );

    canvas.add(verticalGuide);
    canvas.add(horizontalGuide);
    canvas.add(leftThirdGuide);
    canvas.add(rightThirdGuide);
    canvas.add(topQuarterGuide);
    canvas.add(bottomQuarterGuide);

    return {
      vertical: verticalGuide,
      horizontal: horizontalGuide,
      leftThird: leftThirdGuide,
      rightThird: rightThirdGuide,
      topQuarter: topQuarterGuide,
      bottomQuarter: bottomQuarterGuide,
    };
  };

  const showCenterGuides = useCallback((canvas, target) => {
    // Check if guides already exist, if not create them
    let guides = {
      vertical: canvas
        .getObjects()
        .find((obj) => obj.name === "verticalCenterGuide"),
      horizontal: canvas
        .getObjects()
        .find((obj) => obj.name === "horizontalCenterGuide"),
      leftThird: canvas
        .getObjects()
        .find((obj) => obj.name === "leftThirdGuide"),
      rightThird: canvas
        .getObjects()
        .find((obj) => obj.name === "rightThirdGuide"),
      topQuarter: canvas
        .getObjects()
        .find((obj) => obj.name === "topQuarterGuide"),
      bottomQuarter: canvas
        .getObjects()
        .find((obj) => obj.name === "bottomQuarterGuide"),
    };

    // If guides don't exist, create them
    if (!guides.vertical) {
      guides = createCenterGuides(canvas);
    }

    const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const leftThird = canvas.width / 3;
    const rightThird = (canvas.width * 2) / 3;
    const topQuarter = canvas.height / 4;
    const bottomQuarter = (canvas.height * 3) / 4;
    const snapDistance = 15; // Snap distance for better UX

    // Get target dimensions and position
    let targetLeft, targetTop, targetWidth, targetHeight;

    if (target.type === "group") {
      // For groups, use the group's bounding box
      const bounds = target.getBoundingRect();
      targetLeft = bounds.left;
      targetTop = bounds.top;
      targetWidth = bounds.width;
      targetHeight = bounds.height;
    } else {
      // For individual objects
      targetLeft = target.left;
      targetTop = target.top;
      targetWidth = target.width * target.scaleX;
      targetHeight = target.height * target.scaleY;
    }

    const targetCenter = {
      x: targetLeft + targetWidth / 2,
      y: targetTop + targetHeight / 2,
    };

    let showVertical = false;
    let showHorizontal = false;
    let showLeftThird = false;
    let showRightThird = false;
    let showTopQuarter = false;
    let showBottomQuarter = false;

    // Check if target is near vertical center
    if (Math.abs(targetCenter.x - canvasCenter.x) < snapDistance) {
      showVertical = true;
      // Snap to center
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetX =
          canvasCenter.x - (currentBounds.left + currentBounds.width / 2);
        target.set({ left: target.left + offsetX });
      } else {
        target.set({ left: canvasCenter.x - targetWidth / 2 });
      }
    }

    // Check if target is near horizontal center
    if (Math.abs(targetCenter.y - canvasCenter.y) < snapDistance) {
      showHorizontal = true;
      // Snap to center
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetY =
          canvasCenter.y - (currentBounds.top + currentBounds.height / 2);
        target.set({ top: target.top + offsetY });
      } else {
        target.set({ top: canvasCenter.y - targetHeight / 2 });
      }
    }

    // Check if target is near left third
    if (Math.abs(targetCenter.x - leftThird) < snapDistance) {
      showLeftThird = true;
      // Snap to left third
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetX =
          leftThird - (currentBounds.left + currentBounds.width / 2);
        target.set({ left: target.left + offsetX });
      } else {
        target.set({ left: leftThird - targetWidth / 2 });
      }
    }

    // Check if target is near right third
    if (Math.abs(targetCenter.x - rightThird) < snapDistance) {
      showRightThird = true;
      // Snap to right third
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetX =
          rightThird - (currentBounds.left + currentBounds.width / 2);
        target.set({ left: target.left + offsetX });
      } else {
        target.set({ left: rightThird - targetWidth / 2 });
      }
    }

    // Check if target is near top quarter
    if (Math.abs(targetCenter.y - topQuarter) < snapDistance) {
      showTopQuarter = true;
      // Snap to top quarter
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetY =
          topQuarter - (currentBounds.top + currentBounds.height / 2);
        target.set({ top: target.top + offsetY });
      } else {
        target.set({ top: topQuarter - targetHeight / 2 });
      }
    }

    // Check if target is near bottom quarter
    if (Math.abs(targetCenter.y - bottomQuarter) < snapDistance) {
      showBottomQuarter = true;
      // Snap to bottom quarter
      if (target.type === "group") {
        const currentBounds = target.getBoundingRect();
        const offsetY =
          bottomQuarter - (currentBounds.top + currentBounds.height / 2);
        target.set({ top: target.top + offsetY });
      } else {
        target.set({ top: bottomQuarter - targetHeight / 2 });
      }
    }

    // Show/hide guides based on proximity
    if (guides.vertical) {
      guides.vertical.set({ opacity: showVertical ? 0.8 : 0 });
    }
    if (guides.horizontal) {
      guides.horizontal.set({ opacity: showHorizontal ? 0.8 : 0 });
    }
    if (guides.leftThird) {
      guides.leftThird.set({ opacity: showLeftThird ? 0.8 : 0 });
    }
    if (guides.rightThird) {
      guides.rightThird.set({ opacity: showRightThird ? 0.8 : 0 });
    }
    if (guides.topQuarter) {
      guides.topQuarter.set({ opacity: showTopQuarter ? 0.8 : 0 });
    }
    if (guides.bottomQuarter) {
      guides.bottomQuarter.set({ opacity: showBottomQuarter ? 0.8 : 0 });
    }

    // Update coordinates for proper rendering
    target.setCoords();
    canvas.renderAll();
  }, []);

  const hideCenterGuides = (canvas) => {
    // Find and hide all guides by their names
    const guides = canvas
      .getObjects()
      .filter(
        (obj) =>
          obj.name &&
          (obj.name === "verticalCenterGuide" ||
            obj.name === "horizontalCenterGuide" ||
            obj.name === "leftThirdGuide" ||
            obj.name === "rightThirdGuide" ||
            obj.name === "topQuarterGuide" ||
            obj.name === "bottomQuarterGuide")
      );

    guides.forEach((guide) => {
      guide.set({ opacity: 0 });
    });

    canvas.renderAll();
  };

  const trackElementPositions = useCallback((canvas) => {
    const positions = {};
    canvas.getObjects().forEach((obj) => {
      if (obj.name && !obj.name.includes("Guide")) {
        positions[obj.name] = {
          left: obj.left,
          top: obj.top,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          originX: obj.originX,
          originY: obj.originY,
          width: obj.width, // Add width
          height: obj.height, // Add height
          fontSize: obj.fontSize, // For text objects
          fontFamily: obj.fontFamily,
          fontWeight: obj.fontWeight,
          fill: obj.fill, // For text color
        };
      }
    });
    setElementPositions(positions);
    return positions;
  }, []);

  // Animation helper function for smooth transitions
  const animateToPosition = (object, targetProps, duration = 1000) => {
    return new Promise((resolve) => {
      const startProps = {
        left: object.left,
        top: object.top,
        angle: object.angle,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
      };

      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        // Calculate current values
        object.set({
          left:
            startProps.left +
            (targetProps.left - startProps.left) * easedProgress,
          top:
            startProps.top + (targetProps.top - startProps.top) * easedProgress,
          angle:
            startProps.angle +
            (targetProps.angle - startProps.angle) * easedProgress,
          scaleX:
            startProps.scaleX +
            ((targetProps.scaleX || startProps.scaleX) - startProps.scaleX) *
              easedProgress,
          scaleY:
            startProps.scaleY +
            ((targetProps.scaleY || startProps.scaleY) - startProps.scaleY) *
              easedProgress,
        });

        object.setCoords();
        object.canvas?.renderAll();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  };

  // Reset all elements to their default positions with smooth animation
  const resetElementPositions = useCallback(async () => {
    if (!canvasRef.current?.fabricCanvas || !canvasReady) return;

    const canvas = canvasRef.current.fabricCanvas;

    // Get actual current sizes from the rendered objects
    const getActualDefaultScales = () => {
      const userPhotoObj = canvas
        .getObjects()
        .find((obj) => obj.name === "userPhoto");
      const qrCodeObj = canvas
        .getObjects()
        .find((obj) => obj.name === "qrCode");

      let userPhotoScales = { scaleX: 1, scaleY: 1 };
      let qrCodeScales = { scaleX: 1, scaleY: 1 };

      // For user photo - use stored original dimensions and target scale
      if (userPhotoObj && userPhotoObj.originalTargetScale) {
        userPhotoScales = {
          scaleX: userPhotoObj.originalTargetScale,
          scaleY: userPhotoObj.originalTargetScale,
        };
      } else if (userPhotoObj) {
        // Fallback calculation if original data not available
        const circleRadius = 70;
        const boxSize = circleRadius * 2.5 * 1.05;
        const originalWidth = userPhotoObj.width / userPhotoObj.scaleX;
        const originalHeight = userPhotoObj.height / userPhotoObj.scaleY;
        const baseSize = Math.max(originalWidth, originalHeight);
        const correctScale = boxSize / baseSize;
        userPhotoScales = { scaleX: correctScale, scaleY: correctScale };
      }

      // For QR code - use stored original target scales
      if (
        qrCodeObj &&
        qrCodeObj.originalTargetScaleX &&
        qrCodeObj.originalTargetScaleY
      ) {
        qrCodeScales = {
          scaleX: qrCodeObj.originalTargetScaleX,
          scaleY: qrCodeObj.originalTargetScaleY,
        };
      } else if (qrCodeObj) {
        // Fallback calculation if original data not available
        const targetWidth = 100;
        const targetHeight = 100;
        const originalWidth = qrCodeObj.width / qrCodeObj.scaleX;
        const originalHeight = qrCodeObj.height / qrCodeObj.scaleY;
        const correctScaleX = targetWidth / originalWidth;
        const correctScaleY = targetHeight / originalHeight;
        qrCodeScales = { scaleX: correctScaleX, scaleY: correctScaleY };
      }

      return { userPhotoScales, qrCodeScales };
    };

    const { userPhotoScales, qrCodeScales } = getActualDefaultScales();

    // Default positions for each element type
    const defaultPositions = {
      userPhoto: {
        left: 200, // circleCenterX
        top: 235, // circleCenterY
        originX: "center",
        originY: "center",
        angle: 0,
        scaleX: userPhotoScales.scaleX,
        scaleY: userPhotoScales.scaleY,
      },
      textValue_0: {
        // Name
        left: canvas.width / 2,
        top: 320,
        originX: "center",
        originY: "top",
        angle: 0,
        fontSize: 18,
        scaleX: 1,
        scaleY: 1,
      },
      textValue_1: {
        // Designation
        left: canvas.width / 2,
        top: 345, // 320 + 25
        originX: "center",
        originY: "top",
        angle: 0,
        fontSize: 18,
        scaleX: 1,
        scaleY: 1,
      },
      textValue_2: {
        // Company
        left: canvas.width / 2,
        top: 370, // 320 + 50
        originX: "center",
        originY: "top",
        angle: 0,
        fontSize: 18,
        scaleX: 1,
        scaleY: 1,
      },
      qrCode: {
        left: 155,
        top: 410,
        originX: "left",
        originY: "top",
        angle: 0,
        scaleX: qrCodeScales.scaleX,
        scaleY: qrCodeScales.scaleY,
      },
    };

    // Get all objects that need to be reset
    const objectsToReset = canvas
      .getObjects()
      .filter(
        (obj) =>
          obj.name && !obj.name.includes("Guide") && defaultPositions[obj.name]
      );

    if (objectsToReset.length === 0) return;

    // Animate each object to its default position with staggered timing
    const animationPromises = objectsToReset.map((obj, index) => {
      return new Promise((resolve) => {
        setTimeout(async () => {
          const defaultPos = defaultPositions[obj.name];
          if (defaultPos) {
            // Prepare animation target with all properties
            const animationTarget = {
              left: defaultPos.left,
              top: defaultPos.top,
              angle: defaultPos.angle,
              scaleX: defaultPos.scaleX,
              scaleY: defaultPos.scaleY,
            };

            // Use the same animation function as intro
            await animateToPosition(obj, animationTarget, 800);

            // Set origin properties after animation
            obj.set({
              originX: defaultPos.originX,
              originY: defaultPos.originY,
            });

            // Reset font size for text elements
            if (
              (obj.type === "text" || obj.type === "i-text") &&
              defaultPos.fontSize
            ) {
              obj.set({
                fontSize: defaultPos.fontSize,
              });
            }

            obj.setCoords();
          }
          resolve();
        }, index * 150); // Stagger each animation by 150ms
      });
    });

    // Wait for all animations to complete
    await Promise.all(animationPromises);

    canvas.renderAll();
    trackElementPositions(canvas);
    saveCanvasState(canvas);
  }, [canvasReady,  trackElementPositions, saveCanvasState]);

  const startIntroAnimation = useCallback(
    async (canvas) => {
      if (!canvas || !showIntroAnimation || animationComplete) return;

      const objects = canvas
        .getObjects()
        .filter((obj) => obj.name && !obj.name.includes("Guide"));

      if (objects.length === 0) return;

      // Store the original final positions
      const originalPositions = {};
      objects.forEach((obj) => {
        originalPositions[obj.name] = {
          left: obj.finalLeft || obj.left,
          top: obj.finalTop || obj.top,
        };
      });

      // Start the gentle left-right shake animation
      const shakeDuration = 2000; // 2 seconds of gentle movement
      const shakeIntensity = 8; // Maximum pixels to move left/right
      const startTime = Date.now();

      const animateShake = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / shakeDuration;

        if (progress >= 1) {
          // Animation complete - set final positions
          objects.forEach((obj) => {
            const originalPos = originalPositions[obj.name];
            if (originalPos) {
              obj.set({
                left: originalPos.left,
                opacity: 1,
              });
            }
          });
          canvas.renderAll();

          setAnimationComplete(true);
          setShowIntroAnimation(false);
          return;
        }

        // Calculate shake effect for each object
        objects.forEach((obj, index) => {
          const originalPos = originalPositions[obj.name];
          if (!originalPos) return;

          // Create a wave effect with different phases for each element
          const phase = index * 0.5 + progress * Math.PI * 4; // 4 complete cycles
          const shakeOffset =
            Math.sin(phase) * shakeIntensity * (1 - progress * 0.7); // Gradually reduce intensity

          // Apply gentle fade-in during the shake
          const opacity = 0.3 + progress * 0.7; // Fade from 30% to 100%

          obj.set({
            left: originalPos.left + shakeOffset,
            opacity: opacity,
          });
          obj.setCoords();
        });

        canvas.renderAll();
        requestAnimationFrame(animateShake);
      };

      // Start the shake animation after a brief delay
      setTimeout(() => {
        animateShake();
      }, 300);
    },
    [showIntroAnimation, animationComplete]
  );

  // Canvas initialization effect - runs only when essential props change
  useEffect(() => {
    if (!canvasRef.current || !finalImage || fetchingLayout) return;

    let isMounted = true;
    let canvas;

    const setupEventListeners = (canvasInstance) => {
      // Handle drag end and save state
      canvasInstance.on("object:moved", () => {
        isDraggingRef.current = false;
        if (isEdit) {
          hideCenterGuides(canvasInstance);
          // Immediately track positions and save state
          trackElementPositions(canvasInstance);
          saveCanvasState(canvasInstance);
        }
      });

      // Handle other modifications (scaling, rotating, etc.)
      canvasInstance.on("object:modified", (e) => {
        if (e.transform) {
          // Only proceed if there was an actual transformation
          trackElementPositions(canvasInstance);
          saveCanvasState(canvasInstance);
        }
      });

      // Handle object moving - show guides
      canvasInstance.on("object:moving", (e) => {
        isDraggingRef.current = true;
        if (isEdit) {
          showCenterGuides(canvasInstance, e.target);
        }
      });

      // Update positions when mouse up occurs (even if object didn't move)
      canvasInstance.on("mouse:up", () => {
        if (isDraggingRef.current && isEdit) {
          trackElementPositions(canvasInstance);
          saveCanvasState(canvasInstance);
        }
        isDraggingRef.current = false;
        if (isEdit) {
          hideCenterGuides(canvasInstance);
        }
      });

      canvasInstance.on("object:added", () => {
        // Save state when objects are added (but not during initial setup or dragging)
        if (canvasReady && !isDraggingRef.current) {
          setTimeout(() => {
            saveCanvasState(canvasInstance);
          }, 10);
        }
      });

      canvasInstance.on("object:removed", () => {
        // Save state when objects are removed (but not during dragging)
        if (canvasReady && !isDraggingRef.current) {
          setTimeout(() => {
            saveCanvasState(canvasInstance);
          }, 10);
        }
      });

      // Hide guides when selection is cleared
      canvasInstance.on("selection:cleared", () => {
        if (isEdit) {
          hideCenterGuides(canvasInstance);
        }
      });

      // Handle selection created
      canvasInstance.on("selection:created", (e) => {
        if (isEdit) {
          hideCenterGuides(canvasInstance);
        }
      });

      // Handle selection updated
      canvasInstance.on("selection:updated", (e) => {
        if (isEdit) {
          hideCenterGuides(canvasInstance);
        }
      });
    };

    const initCanvas = async () => {
      try {
        canvas = new fabric.Canvas(canvasRef.current, {
          selection: isEdit,
          preserveObjectStacking: true,
        });

        // Store canvas reference for content updates
        canvasRef.current.fabricCanvas = canvas;

        // Load background image
        const bgImg = await new Promise((resolve) => {
          fabric.Image.fromURL(
            finalImage,
            (img) => {
              if (!img || !isMounted) return;
              const displayWidth = 400;
              const scaleFactor = displayWidth / img.width;
              const displayHeight = img.height * scaleFactor;

              canvas.setDimensions({
                width: displayWidth,
                height: displayHeight,
              });
              img.scaleX = scaleFactor;
              img.scaleY = scaleFactor;
              img.selectable = false;
              img.evented = false;
              resolve(img);
            },
            { crossOrigin: "anonymous" }
          );
        });

        if (!isMounted) return;

        if (bgRequired) {
          canvas.setBackgroundImage(bgImg, () => {
            if (canvas.contextContainer) canvas.renderAll();
          });
        } else {
          canvas.setBackgroundColor("white", () => {
            if (canvas.contextContainer) canvas.renderAll();
          });
        }

        setupEventListeners(canvas);

        if (isMounted) setCanvasReady(true);
      } catch (err) {
        // Canvas initialization error
      }
    };

    initCanvas();

    return () => {
      isMounted = false;
      if (canvas) {
        canvas.dispose();
        const currentCanvasRef = canvasRef.current;
        if (currentCanvasRef) {
          currentCanvasRef.fabricCanvas = null;
        }
      }
    };
  }, [finalImage, fetchingLayout, bgRequired, isEdit]);

  // Keyboard event listener effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEdit || !canvasRef.current?.fabricCanvas) return;

      const canvas = canvasRef.current.fabricCanvas;
      const activeObject = canvas.getActiveObject();

      if (e.ctrlKey || e.metaKey) {
        // Undo/Redo shortcuts
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo(canvas);
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo(canvas);
        }

        // Alignment shortcuts - only work if an object is selected
        else if (activeObject) {
          const canvasCenter = { x: canvas.width / 2, y: canvas.height / 2 };
          let shouldUpdate = false;

          switch (e.key.toLowerCase()) {
            case "e": // Ctrl+E - Center horizontally
              e.preventDefault();
              if (activeObject.type === "group") {
                // Center the group itself
                const bounds = activeObject.getBoundingRect();
                const offsetX =
                  canvasCenter.x - (bounds.left + bounds.width / 2);
                activeObject.set({ left: activeObject.left + offsetX });

                // Center all items within the group
                const groupObjects = activeObject.getObjects();
                if (groupObjects.length > 0) {
                  // Calculate group's internal bounds
                  const groupBounds = activeObject.getBoundingRect(true); // true for absolute coordinates
                  const groupCenterX = groupBounds.width / 2;

                  groupObjects.forEach((obj) => {
                    const objWidth = obj.width * (obj.scaleX || 1);
                    obj.set({ left: groupCenterX - objWidth / 2 });
                  });
                }
              } else {
                // For individual objects, handle different types properly
                if (
                  activeObject.type === "text" ||
                  activeObject.type === "i-text"
                ) {
                  // For text elements, check origin property
                  if (activeObject.originX === "center") {
                    // If origin is center, just set left to canvas center
                    activeObject.set({ left: canvasCenter.x });
                  } else {
                    // If origin is left, calculate offset using bounding rect
                    const bounds = activeObject.getBoundingRect();
                    const newLeft = canvasCenter.x - bounds.width / 2;
                    activeObject.set({ left: newLeft });
                  }
                } else if (activeObject.type === "image") {
                  // For images, handle origin properly
                  if (activeObject.originX === "center") {
                    // If origin is center, just set left to canvas center
                    activeObject.set({ left: canvasCenter.x });
                  } else {
                    // If origin is left, calculate offset
                    const targetWidth =
                      activeObject.width * activeObject.scaleX;
                    activeObject.set({
                      left: canvasCenter.x - targetWidth / 2,
                    });
                  }
                } else {
                  // For other elements (shapes, etc.)
                  const targetWidth = activeObject.width * activeObject.scaleX;
                  activeObject.set({ left: canvasCenter.x - targetWidth / 2 });
                }
              }
              shouldUpdate = true;
              break;

            case "q": // Ctrl+Q - Center vertically
              e.preventDefault();
              if (activeObject.type === "group") {
                // Center the group itself
                const bounds = activeObject.getBoundingRect();
                const offsetY =
                  canvasCenter.y - (bounds.top + bounds.height / 2);
                activeObject.set({ top: activeObject.top + offsetY });

                // Center all items within the group vertically
                const groupObjects = activeObject.getObjects();
                if (groupObjects.length > 0) {
                  // Calculate group's internal bounds
                  const groupBounds = activeObject.getBoundingRect(true);
                  const groupCenterY = groupBounds.height / 2;

                  groupObjects.forEach((obj) => {
                    const objHeight = obj.height * (obj.scaleY || 1);
                    obj.set({ top: groupCenterY - objHeight / 2 });
                  });
                }
              } else {
                // For individual objects, handle different types properly
                if (
                  activeObject.type === "text" ||
                  activeObject.type === "i-text"
                ) {
                  // For text elements, check origin property
                  if (activeObject.originY === "center") {
                    // If origin is center, just set top to canvas center
                    activeObject.set({ top: canvasCenter.y });
                  } else {
                    // If origin is top, calculate offset using bounding rect
                    const bounds = activeObject.getBoundingRect();
                    const newTop = canvasCenter.y - bounds.height / 2;
                    activeObject.set({ top: newTop });
                  }
                } else if (activeObject.type === "image") {
                  // For images, handle origin properly
                  if (activeObject.originY === "center") {
                    // If origin is center, just set top to canvas center
                    activeObject.set({ top: canvasCenter.y });
                  } else {
                    // If origin is top, calculate offset
                    const targetHeight =
                      activeObject.height * activeObject.scaleY;
                    activeObject.set({
                      top: canvasCenter.y - targetHeight / 2,
                    });
                  }
                } else {
                  // For other elements (shapes, etc.)
                  const targetHeight =
                    activeObject.height * activeObject.scaleY;
                  activeObject.set({ top: canvasCenter.y - targetHeight / 2 });
                }
              }
              shouldUpdate = true;
              break;

            case "w": // Ctrl+W - Center both horizontally and vertically
              e.preventDefault();
              if (activeObject.type === "group") {
                // Center the group itself
                const bounds = activeObject.getBoundingRect();
                const offsetX =
                  canvasCenter.x - (bounds.left + bounds.width / 2);
                const offsetY =
                  canvasCenter.y - (bounds.top + bounds.height / 2);
                activeObject.set({
                  left: activeObject.left + offsetX,
                  top: activeObject.top + offsetY,
                });

                // Center all items within the group
                const groupObjects = activeObject.getObjects();
                if (groupObjects.length > 0) {
                  // Calculate group's internal bounds
                  const groupBounds = activeObject.getBoundingRect(true);
                  const groupCenterX = groupBounds.width / 2;
                  const groupCenterY = groupBounds.height / 2;

                  groupObjects.forEach((obj) => {
                    const objWidth = obj.width * (obj.scaleX || 1);
                    const objHeight = obj.height * (obj.scaleY || 1);
                    obj.set({
                      left: groupCenterX - objWidth / 2,
                      top: groupCenterY - objHeight / 2,
                    });
                  });
                }
              } else {
                // For individual objects, handle different types properly
                if (
                  activeObject.type === "text" ||
                  activeObject.type === "i-text"
                ) {
                  // For text elements, check origin properties
                  const newLeft =
                    activeObject.originX === "center"
                      ? canvasCenter.x
                      : canvasCenter.x -
                        activeObject.getBoundingRect().width / 2;
                  const newTop =
                    activeObject.originY === "center"
                      ? canvasCenter.y
                      : canvasCenter.y -
                        activeObject.getBoundingRect().height / 2;
                  activeObject.set({ left: newLeft, top: newTop });
                } else if (activeObject.type === "image") {
                  // For images, handle origin properly
                  const newLeft =
                    activeObject.originX === "center"
                      ? canvasCenter.x
                      : canvasCenter.x -
                        (activeObject.width * activeObject.scaleX) / 2;
                  const newTop =
                    activeObject.originY === "center"
                      ? canvasCenter.y
                      : canvasCenter.y -
                        (activeObject.height * activeObject.scaleY) / 2;
                  activeObject.set({ left: newLeft, top: newTop });
                } else {
                  // For other elements (shapes, etc.)
                  const targetWidth = activeObject.width * activeObject.scaleX;
                  const targetHeight =
                    activeObject.height * activeObject.scaleY;
                  activeObject.set({
                    left: canvasCenter.x - targetWidth / 2,
                    top: canvasCenter.y - targetHeight / 2,
                  });
                }
              }
              shouldUpdate = true;
              break;

            case "1": // Ctrl+1 - Align to left third
              e.preventDefault();
              const leftThird = canvas.width / 3;
              if (activeObject.type === "group") {
                const bounds = activeObject.getBoundingRect();
                const offsetX = leftThird - (bounds.left + bounds.width / 2);
                activeObject.set({ left: activeObject.left + offsetX });
              } else {
                // Handle text elements specially
                if (
                  activeObject.type === "text" ||
                  activeObject.type === "i-text"
                ) {
                  if (activeObject.originX === "center") {
                    // If origin is center, just set left to third position
                    activeObject.set({ left: leftThird });
                  } else {
                    // If origin is left, calculate offset
                    const targetWidth = activeObject.getBoundingRect().width;
                    activeObject.set({ left: leftThird - targetWidth / 2 });
                  }
                } else {
                  const targetWidth = activeObject.width * activeObject.scaleX;
                  activeObject.set({ left: leftThird - targetWidth / 2 });
                }
              }
              shouldUpdate = true;
              break;

            case "2": // Ctrl+2 - Align to right third
              e.preventDefault();
              const rightThird = (canvas.width * 2) / 3;
              if (activeObject.type === "group") {
                const bounds = activeObject.getBoundingRect();
                const offsetX = rightThird - (bounds.left + bounds.width / 2);
                activeObject.set({ left: activeObject.left + offsetX });
              } else {
                // Handle text elements specially
                if (
                  activeObject.type === "text" ||
                  activeObject.type === "i-text"
                ) {
                  if (activeObject.originX === "center") {
                    // If origin is center, just set left to third position
                    activeObject.set({ left: rightThird });
                  } else {
                    // If origin is left, calculate offset
                    const targetWidth = activeObject.getBoundingRect().width;
                    activeObject.set({ left: rightThird - targetWidth / 2 });
                  }
                } else {
                  const targetWidth = activeObject.width * activeObject.scaleX;
                  activeObject.set({ left: rightThird - targetWidth / 2 });
                }
              }
              shouldUpdate = true;
              break;

            default:
              // No action for other keys
              break;
          }

          // Inside the keyboard event handler
          if (shouldUpdate) {
            activeObject.setCoords();
            canvas.renderAll();
            // Add this line to ensure positions are tracked after keyboard operations
            trackElementPositions(canvas);
            saveCanvasState(canvas);
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEdit, undo, redo, trackElementPositions, saveCanvasState]);

  // Content update effect - runs when userData or other content changes
  useEffect(() => {
    if (!canvasRef.current?.fabricCanvas || !userData || !canvasReady) return;

    const canvas = canvasRef.current.fabricCanvas;

    const updateCanvasContent = async () => {
      try {
        // Capture current element positions before removing them
        const currentPositions = {};
        canvas.getObjects().forEach((obj) => {
          if (obj.name && !obj.name.includes("Guide")) {
            currentPositions[obj.name] = {
              left: obj.left,
              top: obj.top,
              scaleX: obj.scaleX,
              scaleY: obj.scaleY,
              angle: obj.angle,
              originX: obj.originX,
              originY: obj.originY,
            };
          }
        });

        // Remove existing content (but keep guides)
        const objectsToRemove = canvas
          .getObjects()
          .filter((obj) => obj.name && !obj.name.includes("Guide"));
        objectsToRemove.forEach((obj) => canvas.remove(obj));

        // Add user image (circle or rounded square)
        if (userImage) {
          const photo = await new Promise((resolve) => {
            fabric.Image.fromURL(
              userImage,
              (img) => {
                if (!img) return;
                // Enhance image quality settings
                img.set({
                  // Disable image smoothing for sharper rendering
                  imageSmoothingEnabled: false,
                  // Use high-quality scaling
                  resampleMethod: "lanczos",
                });

                const circleCenterX = 200;
                const circleCenterY = 235;
                const circleRadius = 70;
                const boxSize = circleRadius * 2.5 * 1.05;

                // Use higher resolution calculation for better quality
                const baseSize = Math.max(img.width, img.height);
                const scale = boxSize / baseSize;

                // Apply minimum resolution threshold to maintain quality
                const minResolution = 400; // Minimum pixel dimension
                const currentMaxDimension = Math.max(
                  img.width * scale,
                  img.height * scale
                );

                let qualityScale = scale;
                if (currentMaxDimension < minResolution) {
                  qualityScale = scale * (minResolution / currentMaxDimension);
                }

                const clipShape = isCircle
                  ? new fabric.Circle({
                      radius: circleRadius,
                      originX: "center",
                      originY: "center",
                    })
                  : new fabric.Rect({
                      width: boxSize,
                      height: boxSize,
                      rx: 20,
                      ry: 20,
                      originX: "center",
                      originY: "center",
                    });

                // Use current position if available, otherwise use saved layout or default
                const positionSource =
                  currentPositions?.userPhoto || savedLayout?.userPhoto || savedLayout?.user_photo;

                // For shake animation, start at final position but with low opacity
                let finalLeft = positionSource?.left || circleCenterX;
                let finalTop = positionSource?.top || circleCenterY;
                let startOpacity = 1;

                if (
                  showIntroAnimation &&
                  !animationComplete &&
                  !positionSource
                ) {
                  startOpacity = 0.3; // Start with low opacity for fade-in effect
                }

                img.set({
                  left: finalLeft,
                  top: finalTop,
                  originX: positionSource?.originX || "center",
                  originY: positionSource?.originY || "center",
                  scaleX: positionSource?.scaleX || scale,
                  scaleY: positionSource?.scaleY || scale,
                  angle: positionSource?.angle || 0,
                  opacity: startOpacity,
                  selectable: isEdit,
                  evented: isEdit,
                  hasControls: isEdit,
                  hasBorders: isEdit,
                  name: "userPhoto",
                  clipPath: clipShape,
                  // Store original dimensions for reset calculation
                  originalImageWidth: img.width,
                  originalImageHeight: img.height,
                  originalTargetScale: scale,
                  // High-quality rendering options
                  imageSmoothingEnabled: false,
                  // Store final position for animation
                  finalLeft: finalLeft,
                  finalTop: finalTop,
                  finalAngle: positionSource?.angle || 0,
                });

                resolve(img);
              },
              {
                crossOrigin: "anonymous",
                // Request high-quality image loading
                quality: "high",
              }
            );
          });

          canvas.add(photo);
        }

        // Add text elements
        const addTextElement = (
  text,
  dynamicKey,
  defaultLeft,
  defaultTop,
  savedKey = null // optional backup key
) => {
  // 🔍 Try currentPositions or savedLayout using both keys
  const positionSource =
    currentPositions?.[dynamicKey] ||
    currentPositions?.[savedKey] ||
    savedLayout?.[dynamicKey] ||
    savedLayout?.[savedKey];

  let finalLeft = positionSource?.left || defaultLeft;
  let finalTop = positionSource?.top || defaultTop;
  let startOpacity = 1;

  if (showIntroAnimation && !animationComplete && !positionSource) {
    startOpacity = 0.3;
  }

  const textElement = new fabric.Text(text, {
    fontSize: 18,
    fontFamily: "Arial",
    fill: "#076066",
    fontWeight: "bold",
    left: finalLeft,
    top: finalTop,
    originX: positionSource?.originX || "center",
    originY: positionSource?.originY || "top",
    scaleX: positionSource?.scaleX || 1,
    scaleY: positionSource?.scaleY || 1,
    angle: positionSource?.angle || 0,
    opacity: startOpacity,
    selectable: isEdit,
    evented: isEdit,
    hasControls: isEdit,
    hasBorders: isEdit,
    name: dynamicKey, // 🏷 unique identifier
    finalLeft,
    finalTop,
    finalAngle: positionSource?.angle || 0,
  });

  return textElement;
};


        const valueLeft = canvas?.width / 2;
        const startTop = 320;
        const verticalGap = 25;

        const values = [
  capitalize(userData?.Name) || "User Name",
  capitalize(userData?.Email) || "Email",
  capitalize(userData?.Mo || userData?.comp_name) || "Company Name",
];

values.forEach((text, i) => {
  const dynamicKey = `textValue_${i}`;
  const savedKey = `text_${i + 1}`;

  canvas.add(
    addTextElement(
      text,
      dynamicKey,                // Main key to name the element
      valueLeft,
      startTop + i * verticalGap,
      savedKey                   // ✅ Send backup/saved key as well
    )
  );
});


        // QR Code
        if (orderId) {
          try {
            // Generate QR code at much higher resolution for better quality
            const qrDataURL = await QRCode.toDataURL(orderId, {
  margin: 0.5,
  width: CANVAS_WIDTH, // use the same width for high-res QR
  errorCorrectionLevel: "H",
});
            const qrImg = await new Promise((resolve) => {
              fabric.Image.fromURL(
                qrDataURL,
                (img) => {
                  if (!img) return;

                  const qrCodeWidth = 100;
                  const qrCodeHeight = 100;
                  const qrPositionX = 155;
                  const qrPositionY = 410;

                  // Use current position if available, otherwise use saved layout or default
                  const positionSource =
                    currentPositions?.qrCode || savedLayout?.qrCode || savedLayout?.qr_code;

                  let finalLeft = positionSource?.left || qrPositionX;
                  let finalTop = positionSource?.top || qrPositionY;
                  let startOpacity = 1;

                  if (
                    showIntroAnimation &&
                    !animationComplete &&
                    !positionSource
                  ) {
                    startOpacity = 0.3; // Start with low opacity for fade-in effect
                  }

                  img.set({
                    left: finalLeft,
                    top: finalTop,
                    scaleX: positionSource?.scaleX || qrCodeWidth / img.width,
                    scaleY: positionSource?.scaleY || qrCodeHeight / img.height,
                    originX: positionSource?.originX || "left",
                    originY: positionSource?.originY || "top",
                    angle: positionSource?.angle || 0,
                    opacity: startOpacity,
                    selectable: isEdit,
                    evented: isEdit,
                    hasControls: isEdit,
                    hasBorders: isEdit,
                    name: "qrCode",
                    // Store original dimensions for reset calculation
                    originalQRImageWidth: img.width,
                    originalQRImageHeight: img.height,
                    originalTargetScaleX: qrCodeWidth / img.width,
                    originalTargetScaleY: qrCodeHeight / img.height,
                    // Store final position for animation
                    finalLeft: finalLeft,
                    finalTop: finalTop,
                    finalAngle: positionSource?.angle || 0,
                  });

                  resolve(img);
                },
                { crossOrigin: "anonymous" }
              );
            });

            canvas.add(qrImg);
          } catch (err) {
            // QR Code Error
          }
        }



        // Update element positions tracking
        trackElementPositions(canvas);
        canvas.renderAll();

        // Save initial state for undo/redo after a small delay to ensure everything is loaded
        setTimeout(() => {
          saveCanvasState(canvas);
        }, 100);

        // Start intro animation if enabled
        if (showIntroAnimation && !animationComplete) {
          setTimeout(() => {
            startIntroAnimation(canvas);
          }, 300);
        }
      } catch (err) {
        // Content update error
      }
    };

    updateCanvasContent();
  }, [
    userData?.Name,
    userData?.Email,
    userData?.Mo,
    userImage,
    orderId,
    savedLayout,
    isCircle,
    canvasReady,
  ]);

  // Common function for canvas upscaling with quality fallback
  const upscaleCanvas = async (canvas, preferredMultiplier = 6) => {
    // Temporarily hide guides for clean export
    const guides = canvas
      .getObjects()
      .filter((obj) => obj.name && obj.name.includes("Guide"));
    guides.forEach((guide) => guide.set({ opacity: 0 }));
    canvas.renderAll();

    let dataURL = null;
    let actualMultiplier = preferredMultiplier;

    try {
      // First try with preferred multiplier
      dataURL = canvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: actualMultiplier,
      });

      // Check if dataURL is valid (should start with 'data:image')
      if (
        !dataURL ||
        !dataURL.startsWith("data:image") ||
        dataURL.length < 1000
      ) {
        throw new Error("Invalid dataURL generated");
      }
    } catch (highQualityError) {
      // Fallback to 4x multiplier
      try {
        actualMultiplier = 4;
        dataURL = canvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: actualMultiplier,
        });

        if (
          !dataURL ||
          !dataURL.startsWith("data:image") ||
          dataURL.length < 1000
        ) {
          throw new Error("Invalid dataURL generated with 4x multiplier");
        }
      } catch (mediumQualityError) {
        // Final fallback to 2x multiplier
        actualMultiplier = 2;
        dataURL = canvas.toDataURL({
          format: "png",
          quality: 1.0,
          multiplier: actualMultiplier,
        });

        if (!dataURL || !dataURL.startsWith("data:image")) {
          throw new Error("Failed to generate any valid image");
        }
      }
    }

    // Restore guides opacity (keep them hidden)
    guides.forEach((guide) => guide.set({ opacity: 0 }));
    canvas.renderAll();

    return { dataURL, actualMultiplier };
  };

  const downloadCanvas = async () => {
    setLoading(true);
    try {
      const canvas = canvasRef.current.fabricCanvas;
      if (!canvas) {
        throw new Error("Canvas not found");
      }

      // Use common upscale function with 6x preferred multiplier for download
      const { dataURL, actualMultiplier } = await upscaleCanvas(canvas, 4);

      // Create and trigger download
      const link = document.createElement("a");
      link.href = dataURL;
      const qualityLabel =
        actualMultiplier >= 4
          ? "4k"
          : actualMultiplier >= 2
          ? "hd"
          : "standard";
      link.download = `id_card_${qualityLabel}_${
        orderId || userData?.name?.replace(/\s+/g, "_") || "id"
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Optional: Upload to API in background
      const filename = `id_card_${qualityLabel}_${
        orderId || userData?.name?.replace(/\s+/g, "_") || "id"
      }.png`;
      handleCloseModal();
      UploadToAPIBackground({
        dataURL,
        filename,
        userId: userData?.id,
        api,
        authToken,
      })
        .then((result) => {
          if (result) {
            // Upload successful
          }
        })
        .catch((error) => {
          // Background upload failed
        });

      // Download completed successfully
    } catch (err) {
      // alert("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const printCanvas = async () => {
  setLoading(true);
  try {
    const canvas = canvasRef.current.fabricCanvas;
    if (!canvas) {
      throw new Error("Canvas not found");
    }

    // Use common upscale function with 6x preferred multiplier for print
    const { dataURL, actualMultiplier } = await upscaleCanvas(canvas, 4);

    // Create print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      throw new Error("Popup blocked. Please allow popups to print.");
    }

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
          alert("Failed to load image for printing.");
        };
      }
    };
          handleCloseModal();

  } catch (err) {
    alert("Printing failed. Please try again.");
  } finally {
    setLoading(false);
  }
};


  if (fetchingLayout || loading) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <p className="mt-2">Loading Layout...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Action Buttons */}
      <div style={actionButtonsStyle}>
        {isEdit && (
          <div style={buttonGroupStyle}>
            <Button
              type="default"
              onClick={resetElementPositions}
              disabled={!canvasReady || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Reset all elements to default positions"
              size={isMobile ? 'small' : undefined}
            >
              {!isMobile && 'Reset'}
              <RotateCcw size={isMobile ? 14 : 16} />
            </Button>
            <Button
              type="primary"
              onClick={() => saveLayoutToBackend(elementPositions)}
              disabled={!canvasReady || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              size={isMobile ? 'small' : undefined}
            >
              {loading ? "Saving..." : (!isMobile && "Save Layout")}
              <Save size={isMobile ? 14 : 16} />
            </Button>
          </div>
        )}
        
        <div style={buttonGroupStyle}>
          {download && (
            <Button
              type="primary"
              onClick={downloadCanvas}
              disabled={!canvasReady || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              title="Download ID Card in 4K quality"
              size={isMobile ? 'small' : undefined}
            >
              {loading ? "Wait..." : (!isMobile && "Download")}
              <ArrowBigDownDash size={isMobile ? 14 : 16} />
            </Button>
          )}
          {print && (
            <Button
              type="default"
              onClick={printCanvas}
              disabled={!canvasReady || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              size={isMobile ? 'small' : undefined}
            >
              {!isMobile && 'Print'}
              <Printer size={isMobile ? 14 : 16} />
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Container */}
      <div style={canvasContainerStyle}>
        {finalImage && userData ? (
          <div style={canvasWrapperStyle}>
            <canvas 
              ref={canvasRef} 
              style={{ maxWidth: '100%', height: 'auto' }} 
            />
          </div>
        ) : (
          <div style={loadingStyle}>
            <Spin size="large" />
            <p style={{ marginTop: '0.5rem' }}>Loading ID Card...</p>
          </div>
        )}
      </div>

      {/* Hidden QR Code */}
      <div style={{ display: "none" }}>
        <QRCodeCanvas ref={qrCodeRef} value={orderId} size={150 * 3} />
      </div>
    </div>
  );
};

export default IDCardDragAndDrop;
