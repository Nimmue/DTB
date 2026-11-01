# ProcessHub — Plataforma de automatización de procesos

Aplicación web de una sola página (SPA) para generar cotizaciones y facturas, controlar gastos y visualizar las ganancias en un dashboard, con reglas de automatización configurables.

## Tecnologías
- **HTML5** semántico (estructura y formularios con validación nativa)
- **CSS3** propio (`css/styles.css`) sobre **Bootstrap 5.3** (framework)
- **JavaScript ES6+** (`js/app.js`), sin dependencias de compilación
- **Chart.js 4** para los gráficos del dashboard
- **Bootstrap Icons** y fuente **Inter**
- **localStorage** como almacenamiento persistente en el navegador

## Cómo ejecutarlo
1. Descomprima la carpeta.
2. Abra `index.html` en Chrome, Edge o Firefox (requiere internet para cargar los CDN), o use la extensión *Live Server* de VS Code.
3. La primera vez se cargan datos de demostración; el botón **Restablecer datos demo** los regenera.

## Estructura
```
processhub/
├── index.html      # Estructura: barra lateral, vistas y modales
├── css/styles.css  # Identidad visual, layout, estados, impresión y responsive
└── js/app.js       # Estado, enrutador, renderizado, automatizaciones
```

## Módulos
| Módulo | Funciones |
|---|---|
| Dashboard | KPIs del mes, gráfico ventas/gastos/ganancia (6 meses), gastos por categoría, documentos recientes, registro de actividad |
| Cotizaciones | Crear, editar, duplicar, enviar, aprobar/rechazar, convertir en factura, imprimir |
| Facturación | Emitir, registrar pago, anular, imprimir/PDF, exportar CSV |
| Clientes / Productos / Gastos | CRUD con validación (RUC peruano de 11 dígitos) |
| Automatizaciones | 4 reglas activables: facturas vencidas, facturación automática, expiración de cotizaciones, recordatorios de cobro |
