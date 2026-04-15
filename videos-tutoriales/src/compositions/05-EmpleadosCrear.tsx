import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const EmpleadosCrearTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/05-EmpleadosCrear.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Crear Nuevo Empleado"
            subtitle="Registro de datos del empleado"
            moduleNumber={5}
            bg="teal"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={1486}>
          <ScreenSlide
            src="screenshots/05-empleado-crear.png"
            narration="Complete nombre, cedula, departamento, puesto, tipo nomina, salario, banco, cuenta y foto. Los campos con asterisco son obligatorios."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Editar Empleado" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
