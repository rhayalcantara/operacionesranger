import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";

interface WithAudioProps {
  /** Audio file name without path (e.g., "01-Login.mp3") */
  audioFile: string;
  /** Volume (0-1) */
  volume?: number;
  children: React.ReactNode;
}

/**
 * Wrapper component that adds narration audio to any composition.
 * Place it as the outermost wrapper in each tutorial.
 */
export const WithAudio: React.FC<WithAudioProps> = ({
  audioFile,
  volume = 1,
  children,
}) => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile(`audio/${audioFile}`)} volume={volume} />
      {children}
    </AbsoluteFill>
  );
};
