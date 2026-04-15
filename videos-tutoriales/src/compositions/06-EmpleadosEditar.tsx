import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const EmpleadosEditarTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/06-EmpleadosEditar.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Editar Empleado"
            subtitle="Modificar datos existentes"
            moduleNumber={6}
            bg="teal"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={439}>
          <ScreenSlide
            src="screenshots/04-empleados-lista.png"
            narration="Desde la lista, haga clic en Editar. Puede modificar datos y cambiar el estado activo o inactivo."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={439}>
          <ScreenSlide
            src="screenshots/05-empleado-crear.png"
            narration="Los empleados inactivos no aparecen en nominas futuras. Haga clic en Guardar para confirmar."
            stepNumber={2}
            stepLabel="Paso 2"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Crear Nomina" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
