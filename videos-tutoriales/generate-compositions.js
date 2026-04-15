/**
 * Generates all 37 tutorial compositions using the V2 templates
 * with TransitionSeries, Google Fonts, and audio-synced durations.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMP_DIR = path.join(__dirname, 'src', 'compositions');

// Get audio durations
function getAudioDuration(filename) {
  try {
    const filepath = path.join(__dirname, 'public', 'audio', filename);
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of json "${filepath}"`,
      { encoding: 'utf8' }
    );
    return parseFloat(JSON.parse(result).format.duration);
  } catch {
    return 40; // fallback
  }
}

// Tutorial definitions
const tutorials = [
  {
    id: "01-Login", export: "LoginTutorial", title: "Como Iniciar Sesion",
    subtitle: "Acceso al sistema de nomina", moduleNumber: 1, bg: "blue",
    next: "Panel Principal",
    screenshots: ["screenshots/01-login-empty.png", "screenshots/01-login-filled.png"],
    narrations: [
      "Al abrir la aplicacion, vera la pantalla de inicio de sesion con los campos de usuario y contrasena.",
      "Ingrese su nombre de usuario y contrasena. Haga clic en Login para acceder al sistema.",
    ],
  },
  {
    id: "02-Dashboard", export: "DashboardTutorial", title: "Panel Principal",
    subtitle: "Vista general del sistema", moduleNumber: 2, bg: "blue",
    next: "Menu de Navegacion",
    screenshots: ["screenshots/02-dashboard.png"],
    narrations: [
      "El Dashboard muestra empleados activos, ultima nomina, costo anual y mensual, graficos y nominas recientes.",
    ],
  },
  {
    id: "03-Navegacion", export: "NavegacionTutorial", title: "Menu de Navegacion",
    subtitle: "Estructura completa del sistema", moduleNumber: 3, bg: "purple",
    next: "Lista de Empleados",
    screenshots: ["screenshots/03-navegacion-sidebar.png", "screenshots/02-dashboard.png"],
    narrations: [
      "El menu lateral organiza todas las secciones: Payroll, RRHH, Importaciones, Reportes y Mantenimientos.",
      "Las opciones de Empresa, Usuarios y Auditoria solo estan disponibles para administradores nivel 9.",
    ],
  },
  {
    id: "04-EmpleadosLista", export: "EmpleadosListaTutorial", title: "Lista de Empleados",
    subtitle: "Consulta y busqueda", moduleNumber: 4, bg: "teal",
    next: "Crear Empleado",
    screenshots: ["screenshots/04-empleados-lista.png"],
    narrations: [
      "La tabla muestra codigo, nombre, departamento, puesto, salario y estado. Use la barra de busqueda para filtrar.",
    ],
  },
  {
    id: "05-EmpleadosCrear", export: "EmpleadosCrearTutorial", title: "Crear Nuevo Empleado",
    subtitle: "Registro de datos del empleado", moduleNumber: 5, bg: "teal",
    next: "Editar Empleado",
    screenshots: ["screenshots/05-empleado-crear.png"],
    narrations: [
      "Complete nombre, cedula, departamento, puesto, tipo nomina, salario, banco, cuenta y foto. Los campos con asterisco son obligatorios.",
    ],
  },
  {
    id: "06-EmpleadosEditar", export: "EmpleadosEditarTutorial", title: "Editar Empleado",
    subtitle: "Modificar datos existentes", moduleNumber: 6, bg: "teal",
    next: "Crear Nomina",
    screenshots: ["screenshots/04-empleados-lista.png", "screenshots/05-empleado-crear.png"],
    narrations: [
      "Desde la lista, haga clic en Editar. Puede modificar datos y cambiar el estado activo o inactivo.",
      "Los empleados inactivos no aparecen en nominas futuras. Haga clic en Guardar para confirmar.",
    ],
  },
  {
    id: "07-NominaCrear", export: "NominaCrearTutorial", title: "Crear Nueva Nomina",
    subtitle: "Primer paso del proceso de pago", moduleNumber: 7, bg: "orange",
    next: "Detalle de Nomina",
    screenshots: ["screenshots/07-nomina-lista.png", "screenshots/07-nomina-crear.png"],
    narrations: [
      "La lista muestra todas las nominas con su estado, tipo, fechas y montos totales.",
      "Seleccione tipo, quincena, fechas y titulo. La nomina se crea abierta para agregar conceptos.",
    ],
  },
  {
    id: "08-NominaDetalle", export: "NominaDetalleTutorial", title: "Detalle de Nomina",
    subtitle: "Desglose completo por empleado", moduleNumber: 8, bg: "orange",
    next: "Ingresos y Descuentos",
    screenshots: ["screenshots/08-nomina-detalle.png"],
    narrations: [
      "Vea sueldo bruto, AFP, ARS, ISR, descuentos manuales, ingresos adicionales y neto a pagar por empleado.",
    ],
  },
  {
    id: "09-IngresosDescuentos", export: "IngresosDescuentosTutorial", title: "Ingresos y Descuentos Manuales",
    subtitle: "Agregar conceptos a la nomina", moduleNumber: 9, bg: "orange",
    next: "Recalcular Nomina",
    screenshots: ["screenshots/09-ingresos-descuentos.png"],
    narrations: [
      "Seleccione nomina, empleado y tipo de concepto. Los ingresos suman, los descuentos restan. Recalcule despues.",
    ],
  },
  {
    id: "10-NominaRecalcular", export: "NominaRecalcularTutorial", title: "Recalcular Nomina",
    subtitle: "Calculo automatico de descuentos de ley", moduleNumber: 10, bg: "orange",
    next: "Cerrar Nomina",
    screenshots: ["screenshots/08-nomina-detalle.png"],
    narrations: [
      "AFP al 2.87 por ciento con tope. ARS al 3.04 por ciento. ISR: se deduce TSS primero, luego tramos progresivos.",
    ],
  },
  {
    id: "11-NominaCerrar", export: "NominaCerrarTutorial", title: "Cerrar Nomina",
    subtitle: "Proceso irreversible", moduleNumber: 11, bg: "red",
    next: "Volante de Pago",
    screenshots: ["screenshots/08-nomina-detalle.png"],
    narrations: [
      "Al cerrar se crea snapshot historico. La nomina queda inmutable. Verifique todos los montos antes de cerrar.",
    ],
  },
  {
    id: "12-VolantePago", export: "VolantePagoTutorial", title: "Volante de Pago",
    subtitle: "Comprobante de pago PDF", moduleNumber: 12, bg: "blue",
    next: "Impresion Masiva",
    screenshots: ["screenshots/08-nomina-detalle.png"],
    narrations: [
      "El volante PDF muestra datos de empresa, empleado, periodo, ingresos, descuentos de ley y neto a pagar.",
    ],
  },
  {
    id: "13-ImpresionMasiva", export: "ImpresionMasivaTutorial", title: "Impresion Masiva",
    subtitle: "Todos los volantes en un PDF", moduleNumber: 13, bg: "blue",
    next: "Importar Horas Extra",
    screenshots: ["screenshots/08-nomina-detalle.png"],
    narrations: [
      "Genera un PDF unico con todos los volantes de pago, uno por pagina, listo para imprimir.",
    ],
  },
  {
    id: "14-ImportarHorasExtra", export: "ImportarHorasExtraTutorial", title: "Importar Horas Extra",
    subtitle: "Carga desde archivo Excel", moduleNumber: 14, bg: "green",
    next: "Importar Vacaciones",
    screenshots: ["screenshots/14-importaciones.png"],
    narrations: [
      "Seleccione nomina, suba Excel con codigos de empleado y horas al 35 y 15 por ciento. El sistema valida la estructura.",
    ],
  },
  {
    id: "15-ImportarVacaciones", export: "ImportarVacacionesTutorial", title: "Importar Vacaciones",
    subtitle: "Carga desde archivo Excel", moduleNumber: 15, bg: "green",
    next: "Gestion de Vacaciones",
    screenshots: ["screenshots/14-importaciones.png"],
    narrations: [
      "Similar a horas extra. El pago se calcula con salario promedio de 3 meses, solo dias habiles lunes a viernes.",
    ],
  },
  {
    id: "16-GestionVacaciones", export: "GestionVacacionesTutorial", title: "Gestion de Vacaciones",
    subtitle: "Administrar vacaciones de empleados", moduleNumber: 16, bg: "teal",
    next: "Historial de Vacaciones",
    screenshots: ["screenshots/16-gestion-vacaciones.png"],
    narrations: [
      "Cree registros de vacaciones con fechas. El sistema calcula dias habiles y monto basado en salario promedio.",
    ],
  },
  {
    id: "17-HistorialVacaciones", export: "HistorialVacacionesTutorial", title: "Historial de Vacaciones",
    subtitle: "Consulta de registros anteriores", moduleNumber: 17, bg: "teal",
    next: "Novedades de Salud",
    screenshots: ["screenshots/17-historial-vacaciones.png"],
    narrations: [
      "Filtre por empleado para ver fechas, dias disfrutados, montos pagados y estado de cada vacacion.",
    ],
  },
  {
    id: "18-NovedadesSalud", export: "NovedadesSaludTutorial", title: "Novedades de Salud",
    subtitle: "Registro de eventos medicos", moduleNumber: 18, bg: "teal",
    next: "Gestion de Cuotas",
    screenshots: ["screenshots/18-novedades-salud.png"],
    narrations: [
      "Registre licencias medicas e incapacidades. Son registros de RRHH independientes de la nomina.",
    ],
  },
  {
    id: "19-Cuotas", export: "CuotasTutorial", title: "Gestion de Cuotas",
    subtitle: "Planes de pago en cuotas", moduleNumber: 19, bg: "purple",
    next: "Regalia Pascual",
    screenshots: ["screenshots/19-cuotas.png"],
    narrations: [
      "Cree planes de cuotas para descuentos. El sistema aplica cada cuota automaticamente en cada nomina.",
    ],
  },
  {
    id: "20-Regalia", export: "RegaliaTutorial", title: "Regalia Pascual",
    subtitle: "Aguinaldo navideno", moduleNumber: 20, bg: "purple",
    next: "Mantenimiento de AFP",
    screenshots: ["screenshots/20-regalia.png"],
    narrations: [
      "Calcula automaticamente el aguinaldo basado en historial salarial del ano. Solo administradores nivel 9.",
    ],
  },
  {
    id: "21-AFP", export: "AFPTutorial", title: "Mantenimiento de AFP",
    subtitle: "Fondos de pensiones", moduleNumber: 21, bg: "dark",
    next: "Mantenimiento de ARS",
    screenshots: ["screenshots/21-afp.png"],
    narrations: [
      "Configure las AFP con porcentaje de descuento (2.87%) y tope salarial. Afecta el calculo de nominas.",
    ],
  },
  {
    id: "22-ARS", export: "ARSTutorial", title: "Mantenimiento de ARS",
    subtitle: "Seguro medico obligatorio", moduleNumber: 22, bg: "dark",
    next: "Departamentos",
    screenshots: ["screenshots/22-ars.png"],
    narrations: [
      "Configure las ARS con porcentaje (3.04%) y tope salarial. Los cambios se reflejan al recalcular.",
    ],
  },
  {
    id: "23-Departamentos", export: "DepartamentosTutorial", title: "Departamentos",
    subtitle: "Estructura organizacional", moduleNumber: 23, bg: "dark",
    next: "Cargos",
    screenshots: ["screenshots/23-departamentos.png"],
    narrations: [
      "Cree, edite o elimine departamentos. Se asignan a los empleados para organizar la empresa.",
    ],
  },
  {
    id: "24-Puestos", export: "PuestosTutorial", title: "Cargos",
    subtitle: "Puestos de trabajo", moduleNumber: 24, bg: "dark",
    next: "Bancos",
    screenshots: ["screenshots/24-puestos.png"],
    narrations: [
      "Administre los cargos disponibles. Cada empleado tiene un cargo asignado.",
    ],
  },
  {
    id: "25-Bancos", export: "BancosTutorial", title: "Bancos",
    subtitle: "Entidades financieras", moduleNumber: 25, bg: "dark",
    next: "Tipos de Nomina",
    screenshots: ["screenshots/25-bancos.png"],
    narrations: [
      "Registre los bancos donde los empleados reciben su pago de nomina.",
    ],
  },
  {
    id: "26-TiposNomina", export: "TiposNominaTutorial", title: "Tipos de Nomina",
    subtitle: "Periodos de pago", moduleNumber: 26, bg: "dark",
    next: "Sub-Nominas",
    screenshots: ["screenshots/26-tipos-nomina.png"],
    narrations: [
      "Configure tipos Mensual, Quincenal o Semanal. Determina la frecuencia de pago de cada empleado.",
    ],
  },
  {
    id: "27-Subnominas", export: "SubnominasTutorial", title: "Sub-Nominas",
    subtitle: "Clasificaciones internas", moduleNumber: 27, bg: "dark",
    next: "Tabla de ISR",
    screenshots: ["screenshots/27-subnominas.png"],
    narrations: [
      "Sub-grupos dentro de un tipo de nomina para organizar empleados por clasificacion.",
    ],
  },
  {
    id: "28-ISR", export: "ISRTutorial", title: "Tabla de ISR",
    subtitle: "Tramos impositivos", moduleNumber: 28, bg: "dark",
    next: "Catalogo Desc/Cred",
    screenshots: ["screenshots/28-isr.png"],
    narrations: [
      "Tramos progresivos del Impuesto Sobre la Renta. Primero se deduce TSS (AFP+ARS), luego se aplican las tasas.",
    ],
  },
  {
    id: "29-DescCredCatalogo", export: "DescCredCatalogoTutorial", title: "Catalogo de Conceptos",
    subtitle: "Tipos de ingresos y descuentos", moduleNumber: 29, bg: "dark",
    next: "Configuracion de Empresa",
    screenshots: ["screenshots/29-desc-cred-catalogo.png"],
    narrations: [
      "Cada concepto tiene codigo, nombre y clasificacion como ingreso o descuento. Se usan en nominas.",
    ],
  },
  {
    id: "30-Empresa", export: "EmpresaTutorial", title: "Configuracion de Empresa",
    subtitle: "Datos de la compania", moduleNumber: 30, bg: "purple",
    next: "Gestion de Usuarios",
    screenshots: ["screenshots/30-empresa.png"],
    narrations: [
      "Configure nombre, RNC, direccion, telefono, representante legal y logo. Solo administradores nivel 9.",
    ],
  },
  {
    id: "31-Usuarios", export: "UsuariosTutorial", title: "Gestion de Usuarios",
    subtitle: "Cuentas de acceso", moduleNumber: 31, bg: "purple",
    next: "Cambiar Contrasena",
    screenshots: ["screenshots/31-usuarios.png"],
    narrations: [
      "Cree usuarios con nombre, contrasena y nivel de acceso. Nivel 9 es administrador completo.",
    ],
  },
  {
    id: "32-CambiarClave", export: "CambiarClaveTutorial", title: "Cambiar Contrasena",
    subtitle: "Seguridad de la cuenta", moduleNumber: 32, bg: "purple",
    next: "Auditoria",
    screenshots: ["screenshots/32-cambiar-clave.png"],
    narrations: [
      "Ingrese contrasena actual, nueva contrasena y confirmacion. Las contrasenas se encriptan con bcrypt.",
    ],
  },
  {
    id: "33-Auditoria", export: "AuditoriaTutorial", title: "Auditoria del Sistema",
    subtitle: "Registro de operaciones", moduleNumber: 33, bg: "purple",
    next: "Reporte Empleados por Tipo",
    screenshots: ["screenshots/33-auditoria.png"],
    narrations: [
      "Vea quien hizo que y cuando. Filtre por fecha, modulo y accion. Solo administradores nivel 9.",
    ],
  },
  {
    id: "34-ReporteEmpleadosTipo", export: "ReporteEmpleadosTipoTutorial", title: "Reporte Empleados por Tipo",
    subtitle: "Distribucion por tipo de nomina", moduleNumber: 34, bg: "blue",
    next: "Reporte Desc/Cred",
    screenshots: ["screenshots/34-reporte-empleados-tipo.png"],
    narrations: [
      "Agrupa empleados por tipo de nomina. Muestra codigo, nombre, departamento y salario. Exportable a Excel.",
    ],
  },
  {
    id: "35-ReporteDescCred", export: "ReporteDescCredTutorial", title: "Reporte Desc/Cred por Nomina",
    subtitle: "Conceptos aplicados", moduleNumber: 35, bg: "blue",
    next: "Reporte Ingresos/Descuentos",
    screenshots: ["screenshots/35-reporte-desc-cred.png"],
    narrations: [
      "Vea todos los ingresos y descuentos de una nomina especifica, agrupados por tipo. Exportable a Excel.",
    ],
  },
  {
    id: "36-ReporteIngresosDesc", export: "ReporteIngresosDescTutorial", title: "Reporte Ingresos y Descuentos",
    subtitle: "Vista consolidada", moduleNumber: 36, bg: "blue",
    next: "Estado de Cuenta",
    screenshots: ["screenshots/36-reporte-ingresos-desc.png"],
    narrations: [
      "Reporte consolidado con totales por concepto. Ideal para contabilidad y reconciliaciones.",
    ],
  },
  {
    id: "37-EstadoCuenta", export: "EstadoCuentaTutorial", title: "Estado de Cuenta Empleado",
    subtitle: "Historial de pagos completo", moduleNumber: 37, bg: "blue",
    next: null,
    screenshots: ["screenshots/37-estado-cuenta.png"],
    narrations: [
      "Historial completo de pagos de un empleado: periodo, sueldo, descuentos y neto. Exportable a Excel.",
    ],
  },
];

// Generate composition file
function generateComposition(t) {
  const audioFile = `${t.id}.mp3`;
  const audioDuration = getAudioDuration(audioFile);
  const totalFrames = Math.ceil(audioDuration * 30) + 60; // audio + 2 sec padding

  const introFrames = 90; // 3 sec
  const outroFrames = 90; // 3 sec
  const transitionFrames = 15;

  const numScreenshots = t.screenshots.length;
  const numTransitions = numScreenshots + 1; // intro->screens + screens->outro
  const screenFrames = Math.floor(
    (totalFrames - introFrames - outroFrames - numTransitions * transitionFrames) / numScreenshots
  );

  const screenSequences = t.screenshots.map((src, i) => {
    const narration = t.narrations[i] || t.narrations[0];
    return `
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: ${transitionFrames} })}
        />
        <TransitionSeries.Sequence durationInFrames={${screenFrames}}>
          <ScreenSlide
            src="${src}"
            narration="${narration.replace(/"/g, '\\"')}"
            stepNumber={${i + 1}}
            stepLabel="Paso ${i + 1}"
          />
        </TransitionSeries.Sequence>`;
  }).join('\n');

  const nextTutorial = t.next ? `nextTutorial="${t.next}"` : '';

  return `import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroSlide } from "../templates/IntroSlide";
import { ScreenSlide } from "../templates/ScreenSlide";
import { OutroSlideV2 } from "../templates/OutroSlideV2";

export const ${t.export}: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile("audio/${audioFile}")} volume={1} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={${introFrames}}>
          <IntroSlide
            title="${t.title}"
            subtitle="${t.subtitle}"
            moduleNumber={${t.moduleNumber}}
            bg="${t.bg}"
          />
        </TransitionSeries.Sequence>
${screenSequences}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: ${transitionFrames} })}
        />
        <TransitionSeries.Sequence durationInFrames={${outroFrames}}>
          <OutroSlideV2 ${nextTutorial} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
`;
}

// Generate Root.tsx
function generateRoot() {
  const imports = tutorials.map(t =>
    `import { ${t.export} } from "./compositions/${t.id}";`
  ).join('\n');

  const compositions = tutorials.map(t => {
    const audioFile = `${t.id}.mp3`;
    const audioDuration = getAudioDuration(audioFile);
    const totalFrames = Math.ceil(audioDuration * 30) + 60;
    return `      <Composition
        id="${t.id}"
        component={${t.export}}
        durationInFrames={${totalFrames}}
        fps={30}
        width={1920}
        height={1080}
      />`;
  }).join('\n');

  return `import React from "react";
import { Composition } from "remotion";

${imports}

export const RemotionRoot: React.FC = () => {
  return (
    <>
${compositions}
    </>
  );
};
`;
}

// Main
console.log('Generating V2 compositions...');

// Clean old compositions
const oldFiles = fs.readdirSync(COMP_DIR).filter(f => f.endsWith('.tsx'));
oldFiles.forEach(f => fs.unlinkSync(path.join(COMP_DIR, f)));
console.log(`Cleaned ${oldFiles.length} old files.`);

// Generate new compositions
for (const t of tutorials) {
  const content = generateComposition(t);
  const filePath = path.join(COMP_DIR, `${t.id}.tsx`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`OK: ${t.id}.tsx`);
}

// Generate Root.tsx
const rootContent = generateRoot();
fs.writeFileSync(path.join(__dirname, 'src', 'Root.tsx'), rootContent, 'utf8');
console.log('OK: Root.tsx');

console.log(`\nDone! ${tutorials.length} compositions generated.`);
