import React from "react";
import { Drawer, Grid } from "antd";

const { useBreakpoint } = Grid;

const ResponsiveDrawer = ({
  mobilePlacement = "bottom",
  desktopPlacement = "right",
  mobileWidth = "100%",
  desktopWidth = 520,
  mobileHeight = "90vh",
  desktopHeight,
  width,
  height,
  ...props
}) => {
  const screens = useBreakpoint();

  // If screens.lg is false, it's a mobile or tablet screen (<992px)
  const isSmallScreen = screens.lg === false;

  const resolvedPlacement = isSmallScreen ? mobilePlacement : desktopPlacement;
  const resolvedWidth = width ?? (isSmallScreen ? mobileWidth : desktopWidth);
  const resolvedHeight = height ?? (isSmallScreen ? mobileHeight : desktopHeight);

  return (
    <Drawer
      {...props}
      placement={resolvedPlacement}
      width={resolvedWidth}
      height={resolvedHeight}
    />
  );
};

export default ResponsiveDrawer;
