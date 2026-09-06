import React from "react";
import {
  getDefaultCertificatePngUrl,
  getGeneratedCertificatePngUrl,
} from "./defaultCertificatePng";

export interface CertificateCardProps {
  name: string;
  bgImageUrl?: string | null;
  width?: number;
  height?: number;
  scale?: number;
  nameYPercent?: number; // default 48.5%
  nameOffsetY?: number; // default +30px from top to maintain spacing
  nameColor?: string; // default #000000
  nameFontSize?: number; // dynamic or fixed
  onImageLoad?: (dimensions: { width: number; height: number }) => void;
}

export const CertificateCard = React.forwardRef<HTMLDivElement, CertificateCardProps>(
  (
    {
      name,
      bgImageUrl,
      width = 3300,
      height = 2515,
      scale = 1,
      nameYPercent = 48.5,
      nameOffsetY = 46, // +46px down from top for spacing
      nameColor = "#000000",
      nameFontSize,
      onImageLoad,
    },
    ref
  ) => {
    const displayName = name.trim() || "Khuzaima Aurangzeb";

    // Proportional offset calculation matching base 2515px height
    const scaledOffsetY = Math.round(nameOffsetY * (height / 2515));

    // Fallback if empty string or null is passed to avoid empty src attribute warning
    const effectiveBgUrl =
      bgImageUrl && bgImageUrl.trim().length > 0
        ? bgImageUrl
        : getDefaultCertificatePngUrl();

    // Proportional font size if not explicitly provided (~4.17% of image height)
    const effectiveFontSize = nameFontSize ?? Math.max(24, Math.round(height * 0.0417));
    const letterSpacing = Math.max(1, Math.round(effectiveFontSize * 0.038));

    const containerStyle: React.CSSProperties = {
      width: `${width}px`,
      height: `${height}px`,
      position: "relative",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      boxSizing: "border-box",
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transformOrigin: "top left",
      backgroundColor: "#ffffff",
      overflow: "hidden",
    };

    return (
      <div
        id="speedup-certificate-card"
        ref={ref}
        style={containerStyle}
        className="select-none"
      >
        {/* Exact Dimensions Background Template (PNG) - Never pass empty string to src */}
        {effectiveBgUrl ? (
          <img
            src={effectiveBgUrl}
            alt="Certificate Template PNG"
            onLoad={(e) => {
              const target = e.currentTarget;
              if (target.naturalWidth && target.naturalHeight) {
                onImageLoad?.({
                  width: target.naturalWidth,
                  height: target.naturalHeight,
                });
              }
            }}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              const fallback = getGeneratedCertificatePngUrl();
              if (fallback && target.src !== fallback) {
                target.src = fallback;
              }
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${width}px`,
              height: `${height}px`,
              objectFit: "fill", // Exact match with container -> 0px cropped from top/bottom/left/right
              zIndex: 1,
              pointerEvents: "none",
              display: "block",
            }}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : null}

        {/* Centered User Name Print Layer - Pure Solid Black, Zero Drop Shadow */}
        <div
          style={{
            position: "absolute",
            top: scaledOffsetY !== 0 ? `calc(${nameYPercent}% + ${scaledOffsetY}px)` : `${nameYPercent}%`,
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            width: "84%",
            maxWidth: `${Math.round(width * 0.85)}px`,
            textAlign: "center",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          <h1
            style={{
              margin: 0,
              padding: 0,
              fontSize: `${effectiveFontSize}px`,
              fontWeight: 800,
              color: nameColor,
              letterSpacing: `${letterSpacing}px`,
              lineHeight: 1.2,
              textTransform: "uppercase",
              textShadow: "none", // Strictly solid black with NO drop shadow
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, 'Inter', serif, sans-serif",
            }}
          >
            {displayName}
          </h1>
        </div>
      </div>
    );
  }
);

CertificateCard.displayName = "CertificateCard";
