import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const ReporteEmpleadosTipoTutorial: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/34-ReporteEmpleadosTipo.mp3")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <IntroSlide
            title="Reporte Empleados por Tipo"
            subtitle="Distribucion por tipo de nomina"
            moduleNumber={34}
            bg="blue"
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={692}>
          <ScreenSlide
            src="screenshots/34-reporte-empleados-tipo.png"
            narration="Agrupa empleados por tipo de nomina. Muestra codigo, nombre, departamento y salario. Exportable a Excel."
            stepNumber={1}
            stepLabel="Paso 1"
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <OutroSlideV2 nextTutorial="Reporte Desc/Cred" />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
