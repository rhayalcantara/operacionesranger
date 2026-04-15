import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SlideBase, fontFamily, type BgTheme } from "./SlideBase";

interface IntroSlideProps {
  title: string;
  subtitle?: string;
  moduleNumber?: number;
  bg?: BgTheme;
  accentColor?: string;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({
  title,
  subtitle,
  moduleNumber,
  bg = "blue",
  accentColor = "#60a5fa",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const titleProgress = spring({
    frame: frame - 8,
    fps,
    config: { damping: 200 },
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subtitleProgress = spring({
    frame: frame - 16,
    fps,
    config: { damping: 200 },
  });
  const subtitleY = interpolate(subtitleProgress, [0, 1], [30, 0]);

  const lineWidth = interpolate(
    spring({ frame: frame - 12, fps, config: { damping: 200 } }),
    [0, 1],
    [0, 200]
  );

  return (
    <SlideBase bg={bg} glowColor={`${accentColor}15`}>
      {moduleNumber != null && (
        <div
          style={{
            padding: "8px 24px",
            borderRadius: 100,
            border: `1px solid ${accentColor}`,
            background: `${accentColor}15`,
            color: accentColor,
            fontSize: 18,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 24,
            transform: `scale(${badgeProgress})`,
            fontFamily,
          }}
        >
          TUTORIAL {String(moduleNumber).padStart(2, "0")}
        </div>
      )}

      <h1
        style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#f1f5f9",
          textAlign: "center",
          margin: 0,
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          lineHeight: 1.1,
          fontFamily,
        }}
      >
        {title}
      </h1>

      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          marginTop: 20,
          marginBottom: 20,
          borderRadius: 2,
        }}
      />

      {subtitle && (
        <p
          style={{
            fontSize: 28,
            color: "rgba(148,163,184,0.9)",
            textAlign: "center",
            margin: 0,
            opacity: subtitleProgress,
            transform: `translateY(${subtitleY}px)`,
            maxWidth: 800,
            lineHeight: 1.4,
            fontFamily,
          }}
        >
          {subtitle}
        </p>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: subtitleProgress * 0.5,
          fontSize: 16,
          color: "rgba(148,163,184,0.4)",
          letterSpacing: "0.2em",
          fontFamily,
        }}
      >
        RANGER NOMINA — GUIA DE USO
      </div>
    </SlideBase>
  );
};
