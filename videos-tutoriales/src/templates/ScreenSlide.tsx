import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
} from "remotion";
import { fontFamily } from "./SlideBase";

interface ScreenSlideProps {
  src: string;
  narration: string;
  stepNumber?: number;
  stepLabel?: string;
}

export const ScreenSlide: React.FC<ScreenSlideProps> = ({
  src,
  narration,
  stepNumber,
  stepLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const imgScale = interpolate(frame, [0, 20], [1.02, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const badgeProgress = spring({
    frame: frame - 5,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const narrationProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  });
  const narrationY = interpolate(narrationProgress, [0, 1], [20, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", opacity: fadeIn }}>
      {/* Screenshot */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          bottom: 130,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(148,163,184,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            backgroundColor: "#1e293b",
            transform: `scale(${imgScale})`,
          }}
        />
      </div>

      {/* Step badge */}
      {stepNumber != null && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transform: `scale(${badgeProgress})`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              fontFamily,
              fontSize: 20,
              fontWeight: 900,
              color: "#fff",
            }}
          >
            {stepNumber}
          </div>
          {stepLabel && (
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(30,41,59,0.9)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(99,102,241,0.3)",
                fontFamily,
                fontSize: 14,
                fontWeight: 600,
                color: "#94a3b8",
              }}
            >
              {stepLabel}
            </div>
          )}
        </div>
      )}

      {/* Narration bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 110,
          background: "linear-gradient(180deg, rgba(15,23,42,0.0) 0%, rgba(15,23,42,1) 30%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px",
          opacity: narrationProgress,
          transform: `translateY(${narrationY}px)`,
        }}
      >
        <p
          style={{
            fontFamily,
            fontSize: 22,
            color: "rgba(226,232,240,0.95)",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
            maxWidth: 1200,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {narration}
        </p>
      </div>
    </AbsoluteFill>
  );
};
