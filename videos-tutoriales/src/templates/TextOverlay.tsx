import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, SIZES } from "./styles";

interface TextOverlayProps {
  /** The text to display */
  text: string;
  /** Position: top, center, bottom */
  position?: "top" | "center" | "bottom";
  /** Text size variant */
  size?: "small" | "medium" | "large";
  /** Background style */
  variant?: "solid" | "glass" | "none";
  /** Delay in frames */
  delay?: number;
  /** Icon emoji (optional) */
  icon?: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  position = "bottom",
  size = "medium",
  variant = "solid",
  delay = 0,
  icon,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const opacity = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15 },
  });

  const translateY = interpolate(opacity, [0, 1], [30, 0]);

  const fontSize = {
    small: SIZES.bodySmall,
    medium: SIZES.bodyLarge,
    large: SIZES.titleSmall,
  }[size];

  const positionStyle = {
    top: { top: 30, left: 0, right: 0 },
    center: { top: "50%", left: 0, right: 0, transform: `translateY(-50%) translateY(${translateY}px)` },
    bottom: { bottom: 0, left: 0, right: 0 },
  }[position] as React.CSSProperties;

  const bgStyle = {
    solid: { backgroundColor: COLORS.backgroundDark },
    glass: { backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)" },
    none: { backgroundColor: "transparent" },
  }[variant];

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 60px",
        opacity,
        transform: position !== "center" ? `translateY(${translateY}px)` : undefined,
        ...bgStyle,
        zIndex: 200,
      }}
    >
      {icon && (
        <span style={{ fontSize: fontSize * 1.3, marginRight: 16 }}>
          {icon}
        </span>
      )}
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize,
          color: variant === "none" ? COLORS.text : COLORS.textLight,
          textAlign: "center",
          margin: 0,
          lineHeight: 1.4,
          maxWidth: 1400,
          fontWeight: size === "large" ? 700 : 400,
        }}
      >
        {text}
      </p>
    </div>
  );
};
