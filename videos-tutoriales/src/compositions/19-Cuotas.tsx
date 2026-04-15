import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const CuotasTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/19-Cuotas.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Gestion de Cuotas"
            subtitle="Planes de pago en cuotas"
            moduleNumber={19}
            bg="purple"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={964}>
          <ScreenSlide
            src="screenshots/19-cuotas.png"
            narration="Cree planes de cuotas para descuentos. El sistema aplica cada cuota automaticamente en cada nomina."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Regalia Pascual" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
