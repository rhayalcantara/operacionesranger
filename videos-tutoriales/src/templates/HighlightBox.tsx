import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "./styles";

interface HighlightBoxProps {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Width as percentage (0-100) */
  width: number;
  /** Height as percentage (0-100) */
  height: number;
  /** Border color */
  color?: string;
  /** Delay in frames */
  delay?: number;
  /** Label text */
  label?: string;
}

export const HighlightBox: React.FC<HighlightBoxProps> = ({
  x,
  y,
  width,
  height,
  color = COLORS.accent,
  delay = 0,
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const appear = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 12 },
  });

  // Pulsing border
  const pulseOpacity = interpolate(
    Math.sin((adjustedFrame / fps) * Math.PI * 2),
    [-1, 1],
    [0.6, 1]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        border: `3px solid ${color}`,
        borderRadius: 8,
        backgroundColor: `${color}22`,
        opacity: appear * pulseOpacity,
        transform: `scale(${0.95 + appear * 0.05})`,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      {label && (
        <div
          style={{
            position: "absolute",
            top: -30,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: color,
            borderRadius: 6,
            padding: "4px 12px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "Segoe UI, Arial, sans-serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};
