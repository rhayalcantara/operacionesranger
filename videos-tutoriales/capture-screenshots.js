const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:4200';
const SCREENSHOT_DIR = path.join(__dirname, 'public', 'screenshots');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwibm9tYnJlcyI6ImFkbWluIiwiYXBlbGxpZG9zIjoiYWRtaW4iLCJuaXZlbCI6OSwiaWF0IjoxNzc0MjExNTkwLCJleHAiOjE3NzQyNTQ3OTB9.AARFjWg90FmIRAhT9F6NNROCuLO7NlpLfm9OMdlxUbU';
const USER = JSON.stringify({"id":"admin","nombres":"admin","apellidos":"admin","nivel":9});

// Routes to capture
const ROUTES = [
  { path: '/dashboard', name: '02-dashboard' },
  { path: '/employees', name: '04-empleados-lista' },
  { path: '/employee-form', name: '05-empleado-crear' },
  { path: '/nominas', name: '07-nomina-lista' },
  { path: '/nominas/new', name: '07-nomina-crear' },
  { path: '/nominas/detalles/23', name: '08-nomina-detalle' },
  { path: '/desc-cred-nomina', name: '09-ingresos-descuentos' },
  { path: '/importaciones', name: '14-importaciones' },
  { path: '/vacaciones', name: '16-gestion-vacaciones' },
  { path: '/vacaciones/historial', name: '17-historial-vacaciones' },
  { path: '/novedades-salud', name: '18-novedades-salud' },
  { path: '/cuotas', name: '19-cuotas' },
  { path: '/regalia', name: '20-regalia' },
  { path: '/afp', name: '21-afp' },
  { path: '/ars', name: '22-ars' },
  { path: '/departamentos', name: '23-departamentos' },
  { path: '/puestos', name: '24-puestos' },
  { path: '/bancos', name: '25-bancos' },
  { path: '/tipos-nomina', name: '26-tipos-nomina' },
  { path: '/subnominas', name: '27-subnominas' },
  { path: '/isr', name: '28-isr' },
  { path: '/no-desc-cred', name: '29-desc-cred-catalogo' },
  { path: '/empresa', name: '30-empresa' },
  { path: '/usuarios', name: '31-usuarios' },
  { path: '/cambiar-clave', name: '32-cambiar-clave' },
  { path: '/auditoria', name: '33-auditoria' },
  { path: '/reporte-empleados-tipo-nomina', name: '34-reporte-empleados-tipo' },
  { path: '/reporte-desc-cred', name: '35-reporte-desc-cred' },
  { path: '/reporte-ingresos-descuentos', name: '36-reporte-ingresos-desc' },
  { path: '/estado-cuenta-empleado', name: '37-estado-cuenta' },
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // First, go to login to set localStorage
  console.log('Setting up authentication...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0', timeout: 15000 });

  // Set JWT token in localStorage
  await page.evaluate((token, user) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user', user);
  }, TOKEN, USER);

  // Login screenshot
  console.log('Capturing: 01-login-empty');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-empty.png'), fullPage: false });

  // Navigate to dashboard first to confirm auth works
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  // Get the Angular router for SPA navigation
  const hasRouter = await page.evaluate(() => {
    const navmenu = document.querySelector('app-navmenu');
    if (navmenu) {
      const navComp = window.ng.getComponent(navmenu);
      if (navComp && navComp.router) {
        window.__router = navComp.router;
        return true;
      }
    }
    return false;
  });

  if (!hasRouter) {
    console.error('Could not get Angular router!');
    await browser.close();
    return;
  }

  console.log('Angular router ready. Starting captures...');

  // Capture each route
  for (const route of ROUTES) {
    try {
      console.log(`Capturing: ${route.name} (${route.path})`);

      // Navigate using Angular router
      await page.evaluate((path) => {
        window.__router.navigateByUrl(path);
      }, route.path);

      // Wait for navigation and data to load
      await new Promise(r => setTimeout(r, 2500));

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `${route.name}.png`),
        fullPage: false
      });

      console.log(`  OK: ${route.name}.png`);
    } catch (err) {
      console.error(`  ERROR on ${route.name}: ${err.message}`);
    }
  }

  console.log('\nAll screenshots captured!');
  await browser.close();
})();
