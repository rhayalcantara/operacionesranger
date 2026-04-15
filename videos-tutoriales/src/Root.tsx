import React from "react";
import { Composition } from "remotion";

import { LoginTutorial } from "./compositions/01-Login";
import { DashboardTutorial } from "./compositions/02-Dashboard";
import { NavegacionTutorial } from "./compositions/03-Navegacion";
import { EmpleadosListaTutorial } from "./compositions/04-EmpleadosLista";
import { EmpleadosCrearTutorial } from "./compositions/05-EmpleadosCrear";
import { EmpleadosEditarTutorial } from "./compositions/06-EmpleadosEditar";
import { NominaCrearTutorial } from "./compositions/07-NominaCrear";
import { NominaDetalleTutorial } from "./compositions/08-NominaDetalle";
import { IngresosDescuentosTutorial } from "./compositions/09-IngresosDescuentos";
import { NominaRecalcularTutorial } from "./compositions/10-NominaRecalcular";
import { NominaCerrarTutorial } from "./compositions/11-NominaCerrar";
import { VolantePagoTutorial } from "./compositions/12-VolantePago";
import { ImpresionMasivaTutorial } from "./compositions/13-ImpresionMasiva";
import { ImportarHorasExtraTutorial } from "./compositions/14-ImportarHorasExtra";
import { ImportarVacacionesTutorial } from "./compositions/15-ImportarVacaciones";
import { GestionVacacionesTutorial } from "./compositions/16-GestionVacaciones";
import { HistorialVacacionesTutorial } from "./compositions/17-HistorialVacaciones";
import { NovedadesSaludTutorial } from "./compositions/18-NovedadesSalud";
import { CuotasTutorial } from "./compositions/19-Cuotas";
import { RegaliaTutorial } from "./compositions/20-Regalia";
import { AFPTutorial } from "./compositions/21-AFP";
import { ARSTutorial } from "./compositions/22-ARS";
import { DepartamentosTutorial } from "./compositions/23-Departamentos";
import { PuestosTutorial } from "./compositions/24-Puestos";
import { BancosTutorial } from "./compositions/25-Bancos";
import { TiposNominaTutorial } from "./compositions/26-TiposNomina";
import { SubnominasTutorial } from "./compositions/27-Subnominas";
import { ISRTutorial } from "./compositions/28-ISR";
import { DescCredCatalogoTutorial } from "./compositions/29-DescCredCatalogo";
import { EmpresaTutorial } from "./compositions/30-Empresa";
import { UsuariosTutorial } from "./compositions/31-Usuarios";
import { CambiarClaveTutorial } from "./compositions/32-CambiarClave";
import { AuditoriaTutorial } from "./compositions/33-Auditoria";
import { ReporteEmpleadosTipoTutorial } from "./compositions/34-ReporteEmpleadosTipo";
import { ReporteDescCredTutorial } from "./compositions/35-ReporteDescCred";
import { ReporteIngresosDescTutorial } from "./compositions/36-ReporteIngresosDesc";
import { EstadoCuentaTutorial } from "./compositions/37-EstadoCuenta";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="01-Login"
        component={LoginTutorial}
        durationInFrames={1249}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="02-Dashboard"
        component={DashboardTutorial}
        durationInFrames={935}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="03-Navegacion"
        component={NavegacionTutorial}
        durationInFrames={2150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="04-EmpleadosLista"
        component={EmpleadosListaTutorial}
        durationInFrames={1287}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="05-EmpleadosCrear"
        component={EmpleadosCrearTutorial}
        durationInFrames={1696}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="06-EmpleadosEditar"
        component={EmpleadosEditarTutorial}
        durationInFrames={1103}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="07-NominaCrear"
        component={NominaCrearTutorial}
        durationInFrames={1434}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="08-NominaDetalle"
        component={NominaDetalleTutorial}
        durationInFrames={1313}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="09-IngresosDescuentos"
        component={IngresosDescuentosTutorial}
        durationInFrames={1296}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="10-NominaRecalcular"
        component={NominaRecalcularTutorial}
        durationInFrames={1888}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="11-NominaCerrar"
        component={NominaCerrarTutorial}
        durationInFrames={1498}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="12-VolantePago"
        component={VolantePagoTutorial}
        durationInFrames={1117}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="13-ImpresionMasiva"
        component={ImpresionMasivaTutorial}
        durationInFrames={874}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="14-ImportarHorasExtra"
        component={ImportarHorasExtraTutorial}
        durationInFrames={1436}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="15-ImportarVacaciones"
        component={ImportarVacacionesTutorial}
        durationInFrames={1179}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="16-GestionVacaciones"
        component={GestionVacacionesTutorial}
        durationInFrames={1220}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="17-HistorialVacaciones"
        component={HistorialVacacionesTutorial}
        durationInFrames={840}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="18-NovedadesSalud"
        component={NovedadesSaludTutorial}
        durationInFrames={991}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="19-Cuotas"
        component={CuotasTutorial}
        durationInFrames={1174}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="20-Regalia"
        component={RegaliaTutorial}
        durationInFrames={1130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="21-AFP"
        component={AFPTutorial}
        durationInFrames={1066}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="22-ARS"
        component={ARSTutorial}
        durationInFrames={966}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="23-Departamentos"
        component={DepartamentosTutorial}
        durationInFrames={998}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="24-Puestos"
        component={PuestosTutorial}
        durationInFrames={823}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="25-Bancos"
        component={BancosTutorial}
        durationInFrames={794}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="26-TiposNomina"
        component={TiposNominaTutorial}
        durationInFrames={866}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="27-Subnominas"
        component={SubnominasTutorial}
        durationInFrames={843}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="28-ISR"
        component={ISRTutorial}
        durationInFrames={1444}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="29-DescCredCatalogo"
        component={DescCredCatalogoTutorial}
        durationInFrames={1341}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="30-Empresa"
        component={EmpresaTutorial}
        durationInFrames={1230}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="31-Usuarios"
        component={UsuariosTutorial}
        durationInFrames={1403}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="32-CambiarClave"
        component={CambiarClaveTutorial}
        durationInFrames={732}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="33-Auditoria"
        component={AuditoriaTutorial}
        durationInFrames={1279}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="34-ReporteEmpleadosTipo"
        component={ReporteEmpleadosTipoTutorial}
        durationInFrames={902}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="35-ReporteDescCred"
        component={ReporteDescCredTutorial}
        durationInFrames={933}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="36-ReporteIngresosDesc"
        component={ReporteIngresosDescTutorial}
        durationInFrames={963}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="37-EstadoCuenta"
        component={EstadoCuentaTutorial}
        durationInFrames={1192}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
