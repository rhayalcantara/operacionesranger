import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { COLORS, FONTS, SIZES } from "./styles";

interface ScreenCaptureProps {
  /** Path relative to public/ folder */
  src: string;
  /** Optional zoom into a specific region (0-1 coords) */
  zoomTo?: { x: number; y: number; scale: number };
  /** Narration text displayed at the bottom */
  narration?: string;
  /** Step number shown in corner */
  stepNumber?: number;
  /** Step label */
  stepLabel?: string;
  /** Delay before showing (frames) */
  delay?: number;
}

export const ScreenCapture: React.FC<ScreenCaptureProps> = ({
  src,
  zoomTo,
  narration,
  stepNumber,
  stepLabel,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  // Fade in
  const opacity = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15 },
  });

  // Zoom animation
  const scale = zoomTo
    ? interpolate(adjustedFrame, [15, 45], [1, zoomTo.scale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const translateX = zoomTo
    ? interpolate(adjustedFrame, [15, 45], [0, -(zoomTo.x - 0.5) * 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const translateY = zoomTo
    ? interpolate(adjustedFrame, [15, 45], [0, -(zoomTo.y - 0.5) * 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Narration animation
  const narrationOpacity = spring({
    frame: adjustedFrame - 10,
    fps,
    config: { damping: 12 },
  });
  const narrationY = interpolate(narrationOpacity, [0, 1], [20, 0]);

  // Step badge animation
  const badgeScale = spring({
    frame: adjustedFrame - 5,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        opacity,
      }}
    >
      {/* Screenshot container */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          right: 30,
          bottom: narration ? 140 : 30,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: COLORS.shadow,
          border: "2px solid rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            transformOrigin: "center center",
          }}
        >
          <Img
            src={staticFile(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "#fff",
            }}
          />
        </div>
      </div>

      {/* Step badge */}
      {stepNumber && (
        <div
          style={{
            position: "absolute",
            top: 15,
            left: 15,
            transform: `scale(${badgeScale})`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            zIndex: 10,
          }}
        >
          <div
            style={{
              backgroundColor: COLORS.primary,
              borderRadius: "50%",
              width: 50,
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <span
              style={{
                fontFamily: FONTS.title,
                fontSize: 24,
                fontWeight: 800,
                color: COLORS.textLight,
              }}
            >
              {stepNumber}
            </span>
          </div>
          {stepLabel && (
            <div
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 8,
                padding: "6px 16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: SIZES.bodySmall,
                  fontWeight: 600,
                  color: COLORS.textLight,
                }}
              >
                {stepLabel}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Narration bar */}
      {narration && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            backgroundColor: COLORS.backgroundDark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 60px",
            opacity: narrationOpacity,
            transform: `translateY(${narrationY}px)`,
          }}
        >
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: SIZES.bodyLarge,
              color: COLORS.textLight,
              textAlign: "center",
              margin: 0,
              lineHeight: 1.4,
              maxWidth: 1400,
            }}
          >
            {narration}
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
};
