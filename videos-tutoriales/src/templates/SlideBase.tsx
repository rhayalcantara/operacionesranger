import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700", "900"],
  subsets: ["latin", "latin-ext"],
});

export { fontFamily };

const BG = {
  dark: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
  green: "linear-gradient(135deg, #0f172a 0%, #052e16 100%)",
  purple: "linear-gradient(135deg, #1a0a28 0%, #0f172a 100%)",
  orange: "linear-gradient(135deg, #0f172a 0%, #431407 100%)",
  blue: "linear-gradient(135deg, #0c1222 0%, #0c2d48 100%)",
  teal: "linear-gradient(135deg, #0f172a 0%, #042f2e 100%)",
  red: "linear-gradient(135deg, #0f172a 0%, #450a0a 100%)",
};

export type BgTheme = keyof typeof BG;

interface SlideBaseProps {
  children: React.ReactNode;
  bg?: BgTheme;
  glowColor?: string;
}

export const SlideBase: React.FC<SlideBaseProps> = ({
  children,
  bg = "dark",
  glowColor = "rgba(99,102,241,0.08)",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill style={{ background: BG[bg], opacity, fontFamily }}>
      {/* Grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow orb */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          transform: "translateX(-50%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: 80,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
