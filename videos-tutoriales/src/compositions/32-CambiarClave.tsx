import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const CambiarClaveTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/32-CambiarClave.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Cambiar Contrasena"
            subtitle="Seguridad de la cuenta"
            moduleNumber={32}
            bg="purple"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={522}>
          <ScreenSlide
            src="screenshots/32-cambiar-clave.png"
            narration="Ingrese contrasena actual, nueva contrasena y confirmacion. Las contrasenas se encriptan con bcrypt."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Auditoria" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
