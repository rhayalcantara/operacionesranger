import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, SIZES } from "./styles";

interface OutroSlideProps {
  /** Next suggested tutorial */
  nextTutorial?: string;
}

export const OutroSlide: React.FC<OutroSlideProps> = ({ nextTutorial }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({
    frame,
    fps,
    config: { damping: 8 },
  });

  const textOpacity = spring({
    frame: frame - 12,
    fps,
    config: { damping: 15 },
  });

  const nextOpacity = spring({
    frame: frame - 25,
    fps,
    config: { damping: 15 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.backgroundDark} 0%, ${COLORS.primaryDark} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Checkmark circle */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          backgroundColor: COLORS.success,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${checkScale})`,
          boxShadow: "0 4px 30px rgba(46,125,50,0.4)",
          marginBottom: 30,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17L4 12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: FONTS.title,
          fontSize: SIZES.titleMedium,
          fontWeight: 700,
          color: COLORS.textLight,
          opacity: textOpacity,
          margin: 0,
        }}
      >
        ¡Tutorial Completado!
      </h2>

      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: SIZES.bodyLarge,
          color: "rgba(255,255,255,0.7)",
          opacity: textOpacity,
          marginTop: 10,
        }}
      >
        Ranger Nómina
      </p>

      {nextTutorial && (
        <div
          style={{
            marginTop: 50,
            opacity: nextOpacity,
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "16px 32px",
          }}
        >
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: SIZES.bodyMedium,
              color: "rgba(255,255,255,0.6)",
            }}
          >
            Siguiente:
          </span>
          <span
            style={{
              fontFamily: FONTS.body,
              fontSize: SIZES.bodyMedium,
              fontWeight: 600,
              color: COLORS.primaryLight,
            }}
          >
            {nextTutorial}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
