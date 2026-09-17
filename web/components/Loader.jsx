import React from "react";
// import { Spinner } from "@shopify/polaris";

export default function SpinnerLoader({ fullPage = true }) {
  return (
    <div
      style={{
        position: fullPage ? "fixed" : "absolute",
        inset: "0px",
        backgroundColor: "rgba(255,255,255,0.7)",
        zIndex: "999",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <s-spinner accessibilityLabel="Loading tab" size="large" />
    </div>
  );
}
