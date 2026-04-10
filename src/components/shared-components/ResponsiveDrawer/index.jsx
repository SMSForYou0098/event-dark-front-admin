import React from "react";
import { Drawer } from "antd";
import { useMyContext } from "Context/MyContextProvider";

const ResponsiveDrawer = ({
  mobilePlacement = "bottom",
  desktopPlacement = "right",
  mobileWidth = "100%",
  desktopWidth = 520,
  mobileHeight = "85vh",
  desktopHeight,
  width,
  height,
  ...props
}) => {
  const { isMobile } = useMyContext();

  const resolvedPlacement = isMobile ? mobilePlacement : desktopPlacement;
  const resolvedWidth = width ?? (isMobile ? mobileWidth : desktopWidth);
  const resolvedHeight = height ?? (isMobile ? mobileHeight : desktopHeight);

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
