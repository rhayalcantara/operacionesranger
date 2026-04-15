import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, SIZES } from "./styles";

interface TransitionSlideProps {
  /** Text to show during transition */
  text: string;
  /** Icon emoji */
  icon?: string;
  /** Background color */
  bgColor?: string;
}

export const TransitionSlide: React.FC<TransitionSlideProps> = ({
  text,
  icon,
  bgColor = COLORS.primary,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Circle expand animation
  const circleScale = spring({
    frame,
    fps,
    config: { damping: 10, mass: 0.8 },
  });

  const textOpacity = spring({
    frame: frame - 8,
    fps,
    config: { damping: 15 },
  });

  const textY = interpolate(textOpacity, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Expanding circle background */}
      <div
        style={{
          position: "absolute",
          width: 2400,
          height: 2400,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.08)",
          transform: `scale(${circleScale})`,
        }}
      />

      {icon && (
        <span
          style={{
            fontSize: 72,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            marginBottom: 20,
          }}
        >
          {icon}
        </span>
      )}

      <h2
        style={{
          fontFamily: FONTS.title,
          fontSize: SIZES.titleMedium,
          fontWeight: 700,
          color: COLORS.textLight,
          textAlign: "center",
          margin: 0,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          textShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        {text}
      </h2>
    </AbsoluteFill>
  );
};
