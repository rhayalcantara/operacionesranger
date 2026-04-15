import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS } from "./styles";

interface AnimatedArrowProps {
  /** X position as percentage (0-100) */
  x: number;
  /** Y position as percentage (0-100) */
  y: number;
  /** Arrow direction */
  direction?: "down" | "up" | "left" | "right";
  /** Color of the arrow */
  color?: string;
  /** Size multiplier */
  size?: number;
  /** Delay in frames */
  delay?: number;
  /** Show pulsing animation */
  pulse?: boolean;
}

export const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  x,
  y,
  direction = "down",
  color = COLORS.accent,
  size = 1,
  delay = 0,
  pulse = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const adjustedFrame = Math.max(0, frame - delay);

  const appear = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 8, mass: 0.5 },
  });

  // Bounce animation
  const bounce = pulse
    ? Math.sin((adjustedFrame / fps) * Math.PI * 3) * 8
    : 0;

  // Rotation based on direction
  const rotation = {
    down: 0,
    up: 180,
    left: 90,
    right: -90,
  }[direction];

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${appear * size}) rotate(${rotation}deg) translateY(${bounce}px)`,
        zIndex: 100,
        filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
      }}
    >
      <svg width="60" height="80" viewBox="0 0 60 80">
        {/* Arrow shaft */}
        <rect
          x="22"
          y="0"
          width="16"
          height="45"
          rx="8"
          fill={color}
        />
        {/* Arrow head */}
        <polygon
          points="30,80 5,40 55,40"
          fill={color}
        />
      </svg>
    </div>
  );
};
