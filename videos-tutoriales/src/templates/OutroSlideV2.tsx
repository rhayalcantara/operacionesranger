import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { SlideBase, fontFamily } from "./SlideBase";

interface OutroSlideV2Props {
  nextTutorial?: string;
}

export const OutroSlideV2: React.FC<OutroSlideV2Props> = ({ nextTutorial }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkScale = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 200 },
  });

  const textProgress = spring({
    frame: frame - 12,
    fps,
    config: { damping: 200 },
  });

  const nextProgress = spring({
    frame: frame - 22,
    fps,
    config: { damping: 200 },
  });

  return (
    <SlideBase bg="green" glowColor="rgba(34,197,94,0.1)">
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${checkScale})`,
          boxShadow: "0 0 40px rgba(34,197,94,0.3)",
          marginBottom: 24,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
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
          fontSize: 48,
          fontWeight: 900,
          color: "#f1f5f9",
          margin: 0,
          opacity: textProgress,
          fontFamily,
        }}
      >
        Tutorial Completado
      </h2>

      <p
        style={{
          fontSize: 22,
          color: "rgba(148,163,184,0.7)",
          margin: "8px 0 0",
          opacity: textProgress,
          fontFamily,
        }}
      >
        Ranger Nomina
      </p>

      {nextTutorial && (
        <div
          style={{
            marginTop: 40,
            opacity: nextProgress,
            display: "flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(30,41,59,0.6)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: "14px 28px",
            border: "1px solid rgba(148,163,184,0.1)",
            fontFamily,
          }}
        >
          <span style={{ fontSize: 18, color: "rgba(148,163,184,0.5)" }}>
            Siguiente:
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#60a5fa" }}>
            {nextTutorial}
          </span>
        </div>
      )}
    </SlideBase>
  );
};
