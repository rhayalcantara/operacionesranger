import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONTS, SIZES } from "./styles";

interface TitleSlideProps {
  title: string;
  subtitle?: string;
  moduleNumber?: number;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({
  title,
  subtitle,
  moduleNumber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animación del fondo - gradiente que se mueve
  const bgShift = interpolate(frame, [0, 150], [0, 30], {
    extrapolateRight: "clamp",
  });

  // Logo/número aparece con spring
  const numberScale = spring({ frame, fps, config: { damping: 12 } });

  // Título aparece con delay
  const titleOpacity = spring({
    frame: frame - 10,
    fps,
    config: { damping: 15 },
  });
  const titleY = interpolate(titleOpacity, [0, 1], [40, 0]);

  // Subtítulo aparece después
  const subtitleOpacity = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });
  const subtitleY = interpolate(subtitleOpacity, [0, 1], [30, 0]);

  // Línea decorativa
  const lineWidth = spring({
    frame: frame - 15,
    fps,
    config: { damping: 10, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${135 + bgShift}deg, ${COLORS.backgroundDark} 0%, ${COLORS.primaryDark} 50%, ${COLORS.primary} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      {/* Patrón decorativo de fondo */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Badge con número del módulo */}
      {moduleNumber && (
        <div
          style={{
            transform: `scale(${numberScale})`,
            backgroundColor: COLORS.accent,
            borderRadius: 20,
            padding: "12px 32px",
            marginBottom: 30,
          }}
        >
          <span
            style={{
              fontFamily: FONTS.title,
              fontSize: SIZES.bodyLarge,
              fontWeight: 700,
              color: COLORS.textLight,
              letterSpacing: 2,
            }}
          >
            TUTORIAL {String(moduleNumber).padStart(2, "0")}
          </span>
        </div>
      )}

      {/* Título principal */}
      <h1
        style={{
          fontFamily: FONTS.title,
          fontSize: SIZES.titleLarge,
          fontWeight: 800,
          color: COLORS.textLight,
          textAlign: "center",
          margin: 0,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textShadow: "0 2px 10px rgba(0,0,0,0.3)",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>

      {/* Línea decorativa */}
      <div
        style={{
          width: `${lineWidth * 200}px`,
          height: 4,
          backgroundColor: COLORS.accent,
          borderRadius: 2,
          marginTop: 25,
          marginBottom: 25,
        }}
      />

      {/* Subtítulo */}
      {subtitle && (
        <p
          style={{
            fontFamily: FONTS.body,
            fontSize: SIZES.titleSmall,
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            margin: 0,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}

      {/* Branding */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: subtitleOpacity * 0.7,
          fontFamily: FONTS.body,
          fontSize: SIZES.bodySmall,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 3,
        }}
      >
        RANGER NÓMINA — GUÍA DE USO
      </div>
    </AbsoluteFill>
  );
};
