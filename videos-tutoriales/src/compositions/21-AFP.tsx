import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const AFPTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/21-AFP.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Mantenimiento de AFP"
            subtitle="Fondos de pensiones"
            moduleNumber={21}
            bg="dark"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={856}>
          <ScreenSlide
            src="screenshots/21-afp.png"
            narration="Configure las AFP con porcentaje de descuento (2.87%) y tope salarial. Afecta el calculo de nominas."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Mantenimiento de ARS" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
