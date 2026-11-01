/* =========================================================
   DTB
   ========================================================= */
'use strict';

/* ---------- 1. Constantes y utilidades ---------- */
const IGV = 0.18;                       // Impuesto General a las Ventas (Perú)
const STORAGE_KEY = 'processhub_v1';
const EMPRESA = {
  nombre: 'Soluciones Digitales del Sur S.A.C.',
  ruc: '20612345671',
  direccion: 'Av. Mariscal Castilla 245, Mollendo - Arequipa',
  email: 'ventas@solucionesdelsur.pe',
  telefono: '054 532100'
};

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const money = n => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Fechas en formato local AAAA-MM-DD (evita el desfase de UTC)
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const hoy = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((new Date(a + 'T00:00:00') - new Date(b + 'T00:00:00')) / 86400000);
const fmtFecha = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const sum = arr => arr.reduce((a, b) => a + b, 0);

/** Calcula subtotal, IGV y total de una lista de ítems (precios sin IGV). */
function totales(items) {
  const sub = sum(items.map(i => i.cantidad * i.precio));
  const igv = +(sub * IGV).toFixed(2);
  return { sub, igv, total: sub + igv };
}

/* ---------- 2. Datos de demostración ---------- */
function seed() {
  const clientes = [
    { id: 'c1', nombre: 'Constructora Andina S.A.C.', ruc: '20512345678', email: 'compras@andina.pe', telefono: '054 213456', direccion: 'Av. Ejército 101, Arequipa' },
    { id: 'c2', nombre: 'Logística del Sur E.I.R.L.', ruc: '20498765432', email: 'admin@logisur.pe', telefono: '054 534781', direccion: 'Jr. Comercio 320, Mollendo' },
    { id: 'c3', nombre: 'Minimarket Don Lucho', ruc: '10456789012', email: 'donlucho@gmail.com', telefono: '958 112 334', direccion: 'Calle Arequipa 88, Mejía' },
    { id: 'c4', nombre: 'Clínica San Pedro S.A.', ruc: '20601234567', email: 'logistica@sanpedro.pe', telefono: '054 287900', direccion: 'Av. Goyeneche 410, Arequipa' }
  ];
  const productos = [
    { id: 'p1', nombre: 'Desarrollo de sitio web', tipo: 'Servicio', unidad: 'proyecto', precio: 2500 },
    { id: 'p2', nombre: 'Mantenimiento web mensual', tipo: 'Servicio', unidad: 'mes', precio: 350 },
    { id: 'p3', nombre: 'Licencia de software ERP', tipo: 'Producto', unidad: 'licencia', precio: 1200 },
    { id: 'p4', nombre: 'Soporte técnico', tipo: 'Servicio', unidad: 'hora', precio: 60 },
    { id: 'p5', nombre: 'Laptop Core i5 16 GB', tipo: 'Producto', unidad: 'und', precio: 3200 }
  ];

  const facturas = [], gastos = [], cotizaciones = [];
  const today = hoy();
  let nFac = 0, nCot = 0;

  // Seis meses de historial para que el dashboard tenga datos
  for (let m = 5; m >= 0; m--) {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() - m);
    for (let k = 0; k < 3; k++) {
      const d = new Date(base); d.setDate(3 + k * 9);
      const fecha = iso(d);
      if (fecha > today) continue;
      const prod = productos[(m * 3 + k) % productos.length];
      const cant = prod.unidad === 'hora' ? 8 + (m + k) % 10 : 1 + (m + k) % 3;
      const items = [{ descripcion: prod.nombre, cantidad: cant, precio: prod.precio }];
      if (k === 1) items.push({ descripcion: productos[1].nombre, cantidad: 1, precio: productos[1].precio });
      let estado = 'Pagada', vence = addDays(fecha, 30);
      if (m === 0 && k > 0) estado = 'Pendiente';
      if (m === 1 && k === 2) { estado = 'Pendiente'; vence = addDays(fecha, 15); }
      facturas.push({
        id: uid() + m + k, numero: 'F001-' + String(++nFac).padStart(6, '0'),
        clienteId: clientes[(m + k) % clientes.length].id, fecha, vence, items,
        notas: 'Pago mediante transferencia bancaria.', estado,
        fechaPago: estado === 'Pagada' ? addDays(fecha, 10) : null
      });
    }
    const mesIso = iso(base).slice(0, 8);
    const g = (dia, categoria, descripcion, monto) => {
      const f = mesIso + String(dia).padStart(2, '0');
      if (f <= today) gastos.push({ id: uid() + m + dia, fecha: f, categoria, descripcion, monto });
    };
    g(1, 'Alquiler', 'Alquiler de oficina', 800);
    g(5, 'Servicios', 'Luz, agua e internet', 210 + m * 12);
    g(15, 'Software', 'Hosting y licencias cloud', 180);
    g(28, 'Planilla', 'Remuneraciones del personal', 2600);
    if (m % 2 === 0) g(10, 'Marketing', 'Publicidad en redes sociales', 300 + m * 20);
  }

  // Cotizaciones en distintos estados del flujo comercial
  const cot = (dias, cli, estado, items) => cotizaciones.push({
    id: uid() + dias, numero: 'COT-' + String(++nCot).padStart(5, '0'),
    clienteId: cli, fecha: addDays(today, -dias), vence: addDays(today, 15 - dias),
    items, notas: 'Validez de la oferta: 15 días. Precios no incluyen IGV.', estado
  });
  cot(40, 'c1', 'Aprobada', [{ descripcion: 'Desarrollo de sitio web', cantidad: 1, precio: 2500 }]);
  cot(25, 'c4', 'Enviada', [{ descripcion: 'Licencia de software ERP', cantidad: 3, precio: 1200 }]);   // expirará
  cot(18, 'c2', 'Rechazada', [{ descripcion: 'Laptop Core i5 16 GB', cantidad: 2, precio: 3200 }]);
  cot(6, 'c3', 'Enviada', [{ descripcion: 'Desarrollo de sitio web', cantidad: 1, precio: 2500 }, { descripcion: 'Mantenimiento web mensual', cantidad: 6, precio: 350 }]);
  cot(1, 'c2', 'Borrador', [{ descripcion: 'Soporte técnico', cantidad: 20, precio: 60 }]);

  return {
    clientes, productos, cotizaciones, facturas, gastos,
    counters: { cot: nCot, fac: nFac },
    reglas: [
      { id: 'r1', nombre: 'Marcar facturas vencidas', icono: 'bi-alarm', activa: true,
        desc: 'Cambia a “Vencida” toda factura pendiente cuya fecha de vencimiento ya pasó.' },
      { id: 'r2', nombre: 'Facturar cotizaciones aprobadas', icono: 'bi-arrow-repeat', activa: true,
        desc: 'Al aprobar una cotización se genera automáticamente su factura con los mismos ítems.' },
      { id: 'r3', nombre: 'Expirar cotizaciones', icono: 'bi-hourglass-split', activa: true,
        desc: 'Las cotizaciones enviadas que superan su fecha de validez pasan a “Expirada”.' },
      { id: 'r4', nombre: 'Recordatorios de cobro', icono: 'bi-bell', activa: true,
        desc: 'Genera una alerta por cada factura que vence en los próximos 5 días o ya está vencida.' }
    ],
    log: [{ fecha: new Date().toISOString(), icono: 'bi-database-check', texto: 'Datos de demostración cargados.' }]
  };
}

/* ---------- 3. Persistencia ---------- */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* almacenamiento no disponible: se usan datos demo */ }
  return seed();
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch (e) { /* sin persistencia */ }
}
let db = load();

const cliente = id => db.clientes.find(c => c.id === id) || { nombre: '(cliente eliminado)', ruc: '', email: '', direccion: '' };
const coleccion = tipo => tipo === 'cot' ? db.cotizaciones : db.facturas;
const regla = id => db.reglas.find(r => r.id === id);

function logAccion(texto, icono = 'bi-robot') {
  db.log.unshift({ fecha: new Date().toISOString(), icono, texto });
  db.log = db.log.slice(0, 40);
}

/* ---------- 4. Motor de automatizaciones ---------- */
function runAutomations(manual = false) {
  const today = hoy();
  let cambios = 0;

  if (regla('r1').activa) {
    db.facturas.filter(f => f.estado === 'Pendiente' && f.vence < today).forEach(f => {
      f.estado = 'Vencida'; cambios++;
      logAccion(`Factura ${f.numero} marcada como vencida.`, 'bi-alarm');
    });
  }
  if (regla('r3').activa) {
    db.cotizaciones.filter(c => c.estado === 'Enviada' && c.vence < today).forEach(c => {
      c.estado = 'Expirada'; cambios++;
      logAccion(`Cotización ${c.numero} expiró por fecha de validez.`, 'bi-hourglass-split');
    });
  }
  if (manual) {
    logAccion(`Ejecución manual de reglas: ${cambios} cambio(s).`, 'bi-play-circle');
    toast(cambios ? `Automatizaciones aplicadas: ${cambios} cambio(s).` : 'Todo al día: no hubo cambios.', 'success');
  }
  save();
  renderAlertas();
  return cambios;
}

/** Alertas calculadas (regla r4): no modifican datos, solo informan. */
function calcularAlertas() {
  if (!regla('r4').activa) return [];
  const today = hoy();
  const out = [];
  db.facturas.forEach(f => {
    if (f.estado === 'Vencida') {
      out.push({ tipo: 'danger', icono: 'bi-exclamation-octagon', texto: `${f.numero} de ${cliente(f.clienteId).nombre} está vencida (${money(totales(f.items).total)}).` });
    } else if (f.estado === 'Pendiente') {
      const d = diffDays(f.vence, today);
      if (d >= 0 && d <= 5) out.push({ tipo: 'warning', icono: 'bi-clock-history', texto: `${f.numero} vence ${d === 0 ? 'hoy' : 'en ' + d + ' día(s)'}.` });
    }
  });
  return out;
}

function renderAlertas() {
  const alertas = calcularAlertas();
  const badge = $('#alertCount');
  badge.textContent = alertas.length;
  badge.classList.toggle('d-none', alertas.length === 0);
  $('#alertMenu').innerHTML = alertas.length
    ? '<h6 class="dropdown-header">Recordatorios de cobro</h6>' + alertas.map(a =>
        `<a class="dropdown-item d-flex gap-2" href="#facturas"><i class="bi ${a.icono} text-${a.tipo}"></i><span>${esc(a.texto)}</span></a>`).join('')
    : '<span class="dropdown-item-text text-secondary small">No hay alertas pendientes.</span>';
}

/* ---------- 5. Notificaciones (toasts) ---------- */
function toast(msg, tipo = 'primary') {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${tipo} border-0`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${esc(msg)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
  $('#toastBox').appendChild(el);
  const t = new bootstrap.Toast(el, { delay: 3500 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  t.show();
}

/* ---------- 6. Enrutador SPA ---------- */
const VIEWS = {
  dashboard: 'Dashboard de ganancias',
  cotizaciones: 'Cotizaciones',
  facturas: 'Facturación',
  clientes: 'Clientes',
  productos: 'Productos y servicios',
  gastos: 'Gastos',
  automatizaciones: 'Automatizaciones'
};
let vistaActual = 'dashboard';

function route() {
  const hash = location.hash.slice(1);
  vistaActual = VIEWS[hash] ? hash : 'dashboard';
  $$('.view').forEach(s => s.classList.toggle('d-none', s.id !== 'view-' + vistaActual));
  $$('#mainNav .nav-link').forEach(a => {
    const on = a.dataset.view === vistaActual;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  $('#viewTitle').textContent = VIEWS[vistaActual];
  document.title = `${VIEWS[vistaActual]} | ProcessHub`;
  bootstrap.Offcanvas.getInstance($('#sidebar'))?.hide();
  refresh();
}
function refresh() { RENDER[vistaActual](); }

/* ---------- 7. Dashboard ---------- */
const charts = {};
const ultimosMeses = n => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    out.push({ key: iso(d).slice(0, 7), label: d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }) });
  }
  return out;
};
const ventasDelMes = key => sum(db.facturas.filter(f => f.estado !== 'Anulada' && f.fecha.startsWith(key)).map(f => totales(f.items).sub));
const gastosDelMes = key => sum(db.gastos.filter(g => g.fecha.startsWith(key)).map(g => g.monto));

function renderDashboard() {
  const mes = hoy().slice(0, 7);
  const ventas = ventasDelMes(mes);
  const gastos = gastosDelMes(mes);
  const ganancia = ventas - gastos;
  const margen = ventas ? (ganancia / ventas) * 100 : 0;
  const porCobrar = sum(db.facturas.filter(f => ['Pendiente', 'Vencida'].includes(f.estado)).map(f => totales(f.items).total));
  const cerradas = db.cotizaciones.filter(c => ['Aprobada', 'Rechazada', 'Expirada'].includes(c.estado));
  const conversion = cerradas.length ? db.cotizaciones.filter(c => c.estado === 'Aprobada').length / cerradas.length * 100 : 0;

  const kpis = [
    { label: 'Ventas del mes (sin IGV)', value: money(ventas), sub: `${db.facturas.filter(f => f.fecha.startsWith(mes)).length} factura(s) emitidas`, icon: 'bi-cash-stack', bg: '#e6f6f4', fg: '#0f8b7d' },
    { label: 'Gastos del mes', value: money(gastos), sub: `${db.gastos.filter(g => g.fecha.startsWith(mes)).length} registro(s)`, icon: 'bi-wallet2', bg: '#fef0c7', fg: '#b54708' },
    { label: 'Ganancia neta del mes', value: money(ganancia), sub: `Margen ${margen.toFixed(1)}%`, icon: 'bi-graph-up-arrow', bg: ganancia >= 0 ? '#dcfae6' : '#fee4e2', fg: ganancia >= 0 ? '#067647' : '#b42318' },
    { label: 'Por cobrar', value: money(porCobrar), sub: `Conversión de cotizaciones ${conversion.toFixed(0)}%`, icon: 'bi-hourglass-split', bg: '#e0edff', fg: '#1d4ed8' }
  ];
  $('#kpis').innerHTML = kpis.map(k => `
    <div class="col-sm-6 col-xl-3"><div class="kpi">
      <div class="kpi-icon" style="background:${k.bg};color:${k.fg}"><i class="bi ${k.icon}"></i></div>
      <div><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div><div class="kpi-sub">${k.sub}</div></div>
    </div></div>`).join('');

  // Gráfico combinado: barras (ventas/gastos) + línea (ganancia)
  const meses = ultimosMeses(6);
  const v = meses.map(m => ventasDelMes(m.key));
  const g = meses.map(m => gastosDelMes(m.key));
  charts.flujo?.destroy();
  charts.flujo = new Chart($('#chartFlujo'), {
    data: {
      labels: meses.map(m => m.label),
      datasets: [
        { type: 'bar', label: 'Ventas', data: v, backgroundColor: '#0f8b7d', borderRadius: 6 },
        { type: 'bar', label: 'Gastos', data: g, backgroundColor: '#f4b860', borderRadius: 6 },
        { type: 'line', label: 'Ganancia', data: v.map((x, i) => x - g[i]), borderColor: '#1d4ed8', backgroundColor: '#1d4ed8', tension: .35, pointRadius: 4 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${money(c.parsed.y)}` } } },
      scales: { y: { ticks: { callback: val => 'S/ ' + Number(val).toLocaleString('es-PE') } }, x: { grid: { display: false } } }
    }
  });

  // Gráfico de dona: gastos por categoría (últimos 6 meses)
  const desde = meses[0].key;
  const porCat = {};
  db.gastos.filter(x => x.fecha.slice(0, 7) >= desde).forEach(x => { porCat[x.categoria] = (porCat[x.categoria] || 0) + x.monto; });
  charts.gastos?.destroy();
  charts.gastos = new Chart($('#chartGastos'), {
    type: 'doughnut',
    data: { labels: Object.keys(porCat), datasets: [{ data: Object.values(porCat), backgroundColor: ['#0f8b7d', '#f4b860', '#1d4ed8', '#e5484d', '#8e6bd8', '#98a2b3'], borderWidth: 0 }] },
    options: { maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: c => `${c.label}: ${money(c.parsed)}` } } } }
  });

  // Documentos recientes
  const docs = [
    ...db.cotizaciones.map(d => ({ ...d, tipo: 'cot' })),
    ...db.facturas.map(d => ({ ...d, tipo: 'fac' }))
  ].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 7);
  $('#tablaRecientes').innerHTML = docs.map(d => `
    <tr role="button" data-action="ver" data-tipo="${d.tipo}" data-id="${d.id}">
      <td><i class="bi ${d.tipo === 'cot' ? 'bi-file-earmark-text' : 'bi-receipt'} me-1 text-secondary"></i>${d.numero}</td>
      <td class="text-truncate" style="max-width:180px">${esc(cliente(d.clienteId).nombre)}</td>
      <td>${fmtFecha(d.fecha)}</td>
      <td class="text-end">${money(totales(d.items).total)}</td>
      <td><span class="estado estado-${d.estado}">${d.estado}</span></td>
    </tr>`).join('');

  $('#logAuto').innerHTML = db.log.slice(0, 12).map(l => `
    <li class="list-group-item"><i class="bi ${l.icono}"></i>
      <div><div>${esc(l.texto)}</div><small class="text-secondary">${new Date(l.fecha).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
    </li>`).join('');
}

/* ---------- 8. Tablas de cada módulo ---------- */
const vacio = (cols, txt) => `<tr><td colspan="${cols}" class="text-center text-secondary py-4">${txt}</td></tr>`;
const btn = (action, icon, title, extra = '') =>
  `<button class="btn btn-sm btn-light" data-action="${action}" ${extra} title="${title}" aria-label="${title}"><i class="bi ${icon}"></i></button>`;

function renderCotizaciones() {
  const rows = [...db.cotizaciones].sort((a, b) => b.numero.localeCompare(a.numero));
  $('#tablaCotizaciones').innerHTML = rows.length ? rows.map(c => {
    const a = `data-tipo="cot" data-id="${c.id}"`;
    let acciones = btn('ver', 'bi-eye', 'Ver / imprimir', a);
    if (['Borrador', 'Enviada'].includes(c.estado)) acciones += btn('editar', 'bi-pencil', 'Editar', a);
    if (c.estado === 'Borrador') acciones += btn('enviar', 'bi-send', 'Marcar como enviada', a);
    if (c.estado === 'Enviada') acciones += btn('aprobar', 'bi-check2-circle', 'Aprobar', a) + btn('rechazar', 'bi-x-circle', 'Rechazar', a);
    if (c.estado === 'Aprobada' && !c.facturaId) acciones += btn('facturar', 'bi-receipt', 'Generar factura', a);
    acciones += btn('duplicar', 'bi-copy', 'Duplicar', a);
    if (c.estado !== 'Aprobada') acciones += btn('eliminar', 'bi-trash', 'Eliminar', a);
    return `<tr data-estado="${c.estado}">
      <td class="fw-semibold">${c.numero}</td><td>${esc(cliente(c.clienteId).nombre)}</td>
      <td>${fmtFecha(c.fecha)}</td><td>${fmtFecha(c.vence)}</td>
      <td class="text-end">${money(totales(c.items).total)}</td>
      <td><span class="estado estado-${c.estado}">${c.estado}</span>${c.facturaId ? ' <i class="bi bi-link-45deg text-success" title="Facturada"></i>' : ''}</td>
      <td class="text-end actions text-nowrap">${acciones}</td></tr>`;
  }).join('') : vacio(7, 'Aún no hay cotizaciones.');
  aplicarFiltros('tablaCotizaciones');
}

function renderFacturas() {
  const rows = [...db.facturas].sort((a, b) => b.numero.localeCompare(a.numero));
  $('#tablaFacturas').innerHTML = rows.length ? rows.map(f => {
    const a = `data-tipo="fac" data-id="${f.id}"`;
    let acciones = btn('ver', 'bi-eye', 'Ver / imprimir', a);
    if (['Pendiente', 'Vencida'].includes(f.estado)) acciones += btn('pagar', 'bi-cash-coin', 'Registrar pago', a) + btn('anular', 'bi-slash-circle', 'Anular', a);
    return `<tr data-estado="${f.estado}">
      <td class="fw-semibold">${f.numero}</td><td>${esc(cliente(f.clienteId).nombre)}</td>
      <td>${fmtFecha(f.fecha)}</td><td>${fmtFecha(f.vence)}</td>
      <td class="text-end">${money(totales(f.items).total)}</td>
      <td><span class="estado estado-${f.estado}">${f.estado}</span></td>
      <td class="text-end actions text-nowrap">${acciones}</td></tr>`;
  }).join('') : vacio(7, 'Aún no hay facturas.');
  aplicarFiltros('tablaFacturas');
}

function renderClientes() {
  $('#tablaClientes').innerHTML = db.clientes.length ? db.clientes.map(c => {
    const facturado = sum(db.facturas.filter(f => f.clienteId === c.id && f.estado !== 'Anulada').map(f => totales(f.items).total));
    return `<tr><td class="fw-semibold">${esc(c.nombre)}</td><td>${esc(c.ruc)}</td><td>${esc(c.email)}</td><td>${esc(c.telefono)}</td>
      <td class="text-end">${money(facturado)}</td>
      <td class="text-end actions text-nowrap">${btn('editCliente', 'bi-pencil', 'Editar', `data-id="${c.id}"`)}${btn('delCliente', 'bi-trash', 'Eliminar', `data-id="${c.id}"`)}</td></tr>`;
  }).join('') : vacio(6, 'Registre su primer cliente.');
  aplicarFiltros('tablaClientes');
}

function renderProductos() {
  $('#tablaProductos').innerHTML = db.productos.length ? db.productos.map(p => `
    <tr><td class="fw-semibold">${esc(p.nombre)}</td><td><span class="badge text-bg-light">${p.tipo}</span></td><td>${esc(p.unidad)}</td>
    <td class="text-end">${money(p.precio)}</td>
    <td class="text-end actions text-nowrap">${btn('editProducto', 'bi-pencil', 'Editar', `data-id="${p.id}"`)}${btn('delProducto', 'bi-trash', 'Eliminar', `data-id="${p.id}"`)}</td></tr>`).join('')
    : vacio(5, 'Agregue productos o servicios a su catálogo.');
  aplicarFiltros('tablaProductos');
}

function renderGastos() {
  const rows = [...db.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  $('#tablaGastos').innerHTML = rows.length ? rows.map(g => `
    <tr><td>${fmtFecha(g.fecha)}</td><td><span class="badge text-bg-light">${g.categoria}</span></td><td>${esc(g.descripcion)}</td>
    <td class="text-end">${money(g.monto)}</td>
    <td class="text-end actions">${btn('delGasto', 'bi-trash', 'Eliminar', `data-id="${g.id}"`)}</td></tr>`).join('')
    : vacio(5, 'No hay gastos registrados.');
  aplicarFiltros('tablaGastos');
}

function renderAutomatizaciones() {
  $('#listaReglas').innerHTML = db.reglas.map(r => `
    <div class="col-md-6"><div class="rule-card ${r.activa ? '' : 'off'}">
      <div class="d-flex gap-3 align-items-start">
        <div class="rule-icon"><i class="bi ${r.icono}"></i></div>
        <div class="flex-grow-1"><h3 class="h6 mb-1">${r.nombre}</h3><p class="text-secondary small mb-0">${r.desc}</p></div>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" data-regla="${r.id}" ${r.activa ? 'checked' : ''} aria-label="Activar ${r.nombre}">
        </div>
      </div>
    </div></div>`).join('');
}

const RENDER = {
  dashboard: renderDashboard, cotizaciones: renderCotizaciones, facturas: renderFacturas,
  clientes: renderClientes, productos: renderProductos, gastos: renderGastos,
  automatizaciones: renderAutomatizaciones
};

/** Filtro combinado: texto libre + estado. */
function aplicarFiltros(tableId) {
  const txt = ($(`.table-search[data-table="${tableId}"]`)?.value || '').toLowerCase().trim();
  const est = $(`.estado-filter[data-table="${tableId}"]`)?.value || '';
  $$(`#${tableId} tr`).forEach(tr => {
    if (tr.querySelector('td[colspan]')) return;
    const ok = (!txt || tr.textContent.toLowerCase().includes(txt)) && (!est || tr.dataset.estado === est);
    tr.classList.toggle('d-none', !ok);
  });
}

/* ---------- 9. Editor de cotizaciones / facturas ---------- */
const modal = id => bootstrap.Modal.getOrCreateInstance($(id));

function itemRow(it = { descripcion: '', cantidad: 1, precio: 0 }) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="form-control form-control-sm it-desc" list="dlProductos" value="${esc(it.descripcion)}" placeholder="Producto o servicio" required></td>
    <td><input type="number" class="form-control form-control-sm it-cant" min="0.01" step="0.01" value="${it.cantidad}" required></td>
    <td><input type="number" class="form-control form-control-sm it-precio" min="0" step="0.01" value="${it.precio}" required></td>
    <td class="text-end it-importe">${money(it.cantidad * it.precio)}</td>
    <td><button type="button" class="btn btn-sm btn-light it-del" aria-label="Quitar línea"><i class="bi bi-x-lg"></i></button></td>`;
  return tr;
}

function leerItems() {
  return $$('#docItems tr').map(tr => ({
    descripcion: $('.it-desc', tr).value.trim(),
    cantidad: parseFloat($('.it-cant', tr).value) || 0,
    precio: parseFloat($('.it-precio', tr).value) || 0
  }));
}

function recalcular() {
  $$('#docItems tr').forEach(tr => {
    const c = parseFloat($('.it-cant', tr).value) || 0, p = parseFloat($('.it-precio', tr).value) || 0;
    $('.it-importe', tr).textContent = money(c * p);
  });
  const t = totales(leerItems());
  $('#tSub').textContent = money(t.sub);
  $('#tIgv').textContent = money(t.igv);
  $('#tTotal').textContent = money(t.total);
}

function abrirDocumento(tipo, id = null, base = null) {
  const doc = id ? coleccion(tipo).find(d => d.id === id) : base;
  const form = $('#formDoc');
  form.reset(); form.classList.remove('was-validated');
  $('#docTipo').value = tipo;
  $('#docId').value = id || '';
  const nombre = tipo === 'cot' ? 'cotización' : 'factura';
  $('#docTitle').textContent = id ? `Editar ${nombre} ${doc.numero}` : `Nueva ${nombre}`;
  $('#docVenceLabel').textContent = tipo === 'cot' ? 'Válida hasta' : 'Fecha de vencimiento';
  $('#docCliente').innerHTML = '<option value="">Seleccione…</option>' +
    db.clientes.map(c => `<option value="${c.id}">${esc(c.nombre)} — ${c.ruc}</option>`).join('');
  $('#dlProductos').innerHTML = db.productos.map(p => `<option value="${esc(p.nombre)}">`).join('');
  $('#docCliente').value = doc?.clienteId || '';
  const fecha = id ? doc.fecha : hoy();
  $('#docFecha').value = fecha;
  $('#docVence').value = id ? doc.vence : addDays(fecha, tipo === 'cot' ? 15 : 30);
  $('#docNotas').value = doc?.notas || (tipo === 'cot' ? 'Validez de la oferta: 15 días. Precios no incluyen IGV.' : 'Pago mediante transferencia bancaria.');
  const body = $('#docItems'); body.innerHTML = '';
  (doc?.items?.length ? doc.items : [undefined]).forEach(it => body.appendChild(itemRow(it)));
  recalcular();
  modal('#modalDoc').show();
}

function guardarDocumento(e) {
  e.preventDefault();
  const form = e.target;
  const items = leerItems();
  if (!form.checkValidity() || !items.length) { form.classList.add('was-validated'); return; }
  if ($('#docVence').value < $('#docFecha').value) { toast('La fecha de vencimiento no puede ser anterior a la emisión.', 'danger'); return; }

  const tipo = $('#docTipo').value, id = $('#docId').value;
  const datos = { clienteId: $('#docCliente').value, fecha: $('#docFecha').value, vence: $('#docVence').value, notas: $('#docNotas').value.trim(), items };
  let doc;
  if (id) {
    doc = coleccion(tipo).find(d => d.id === id);
    Object.assign(doc, datos);
    toast(`${doc.numero} actualizado.`, 'success');
  } else {
    doc = { id: uid(), numero: siguienteNumero(tipo), estado: tipo === 'cot' ? 'Borrador' : 'Pendiente', ...datos };
    coleccion(tipo).push(doc);
    logAccion(`${tipo === 'cot' ? 'Cotización' : 'Factura'} ${doc.numero} creada para ${cliente(doc.clienteId).nombre}.`, 'bi-file-earmark-plus');
    toast(`${doc.numero} creado correctamente.`, 'success');
  }
  modal('#modalDoc').hide();
  runAutomations();
  if (vistaActual !== 'dashboard') location.hash = tipo === 'cot' ? 'cotizaciones' : 'facturas';
  refresh();
}

function siguienteNumero(tipo) {
  db.counters[tipo]++;
  return tipo === 'cot' ? 'COT-' + String(db.counters.cot).padStart(5, '0') : 'F001-' + String(db.counters.fac).padStart(6, '0');
}

/** Convierte una cotización aprobada en factura (núcleo de la automatización). */
function facturarCotizacion(cot, automatico = false) {
  const fecha = hoy();
  const fac = {
    id: uid(), numero: siguienteNumero('fac'), estado: 'Pendiente', clienteId: cot.clienteId,
    fecha, vence: addDays(fecha, 30), items: cot.items.map(i => ({ ...i })),
    notas: `Generada desde la cotización ${cot.numero}.`, origen: cot.id
  };
  db.facturas.push(fac);
  cot.facturaId = fac.id;
  logAccion(`${automatico ? 'Automatización: ' : ''}factura ${fac.numero} generada desde ${cot.numero}.`, 'bi-arrow-repeat');
  return fac;
}

/* ---------- 10. Vista previa e impresión ---------- */
function htmlDocumento(tipo, d) {
  const c = cliente(d.clienteId), t = totales(d.items);
  const titulo = tipo === 'cot' ? 'COTIZACIÓN' : 'FACTURA ELECTRÓNICA';
  return `<div class="doc-sheet">
    <div class="doc-head">
      <div><h2 class="h5 mb-1">${EMPRESA.nombre}</h2>
        <div class="small">${EMPRESA.direccion}<br>${EMPRESA.email} · ${EMPRESA.telefono}</div></div>
      <div class="doc-box"><div>RUC ${EMPRESA.ruc}</div><div class="tipo">${titulo}</div><div class="fw-bold">${d.numero}</div></div>
    </div>
    <div class="row small g-2">
      <div class="col-7"><strong>Cliente:</strong> ${esc(c.nombre)}<br><strong>RUC:</strong> ${esc(c.ruc)}<br><strong>Dirección:</strong> ${esc(c.direccion || '—')}</div>
      <div class="col-5 text-end"><strong>Emisión:</strong> ${fmtFecha(d.fecha)}<br><strong>${tipo === 'cot' ? 'Válida hasta' : 'Vencimiento'}:</strong> ${fmtFecha(d.vence)}<br><strong>Estado:</strong> ${d.estado}</div>
    </div>
    <table><thead><tr><th>#</th><th>Descripción</th><th class="num">Cant.</th><th class="num">P. unit.</th><th class="num">Importe</th></tr></thead>
      <tbody>${d.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.descripcion)}</td><td class="num">${i.cantidad}</td><td class="num">${money(i.precio)}</td><td class="num">${money(i.cantidad * i.precio)}</td></tr>`).join('')}</tbody>
    </table>
    <div class="doc-totals">
      <div><span>Op. gravada</span><span>${money(t.sub)}</span></div>
      <div><span>IGV 18%</span><span>${money(t.igv)}</span></div>
      <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>
    </div>
    ${d.notas ? `<p class="small mt-3 mb-0"><strong>Notas:</strong> ${esc(d.notas)}</p>` : ''}
    <p class="small text-secondary mt-4 mb-0 text-center">Documento generado con ProcessHub · Representación referencial con fines académicos</p>
  </div>`;
}

function verDocumento(tipo, id) {
  const d = coleccion(tipo).find(x => x.id === id);
  if (!d) return;
  $('#previewBody').innerHTML = htmlDocumento(tipo, d);
  modal('#modalPreview').show();
}

/* ---------- 11. Exportación CSV ---------- */
function exportarCSV() {
  const celda = v => `"${String(v).replace(/"/g, '""')}"`;
  const filas = [['Numero', 'Cliente', 'RUC', 'Emision', 'Vencimiento', 'Subtotal', 'IGV', 'Total', 'Estado']];
  db.facturas.forEach(f => {
    const t = totales(f.items), c = cliente(f.clienteId);
    filas.push([f.numero, c.nombre, c.ruc, f.fecha, f.vence, t.sub.toFixed(2), t.igv.toFixed(2), t.total.toFixed(2), f.estado]);
  });
  const csv = '﻿' + filas.map(r => r.map(celda).join(';')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `facturas_${hoy()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Reporte CSV descargado.', 'success');
}

/* ---------- 12. Formularios de maestros ---------- */
function abrirCliente(id) {
  const c = id ? db.clientes.find(x => x.id === id) : {};
  const f = $('#formCliente'); f.reset(); f.classList.remove('was-validated');
  $('#cliId').value = id || '';
  $('#cliNombre').value = c.nombre || ''; $('#cliRuc').value = c.ruc || '';
  $('#cliEmail').value = c.email || ''; $('#cliTel').value = c.telefono || ''; $('#cliDir').value = c.direccion || '';
  modal('#modalCliente').show();
}
function abrirProducto(id) {
  const p = id ? db.productos.find(x => x.id === id) : {};
  const f = $('#formProducto'); f.reset(); f.classList.remove('was-validated');
  $('#proId').value = id || '';
  $('#proNombre').value = p.nombre || ''; $('#proTipo').value = p.tipo || 'Servicio';
  $('#proUnidad').value = p.unidad || 'und'; $('#proPrecio').value = p.precio ?? '';
  modal('#modalProducto').show();
}
function abrirGasto() {
  const f = $('#formGasto'); f.reset(); f.classList.remove('was-validated');
  $('#gasFecha').value = hoy();
  modal('#modalGasto').show();
}

/** Envoltorio común: valida con la API de restricciones HTML5 y guarda. */
function onSubmitValidado(formId, modalId, accion) {
  $(formId).addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()) { f.classList.add('was-validated'); return; }
    if (accion() === false) return;
    save(); modal(modalId).hide(); refresh();
  });
}

/* ---------- 13. Acciones de las tablas (delegación de eventos) ---------- */
const ACCIONES = {
  ver: (t, id) => verDocumento(t, id),
  editar: (t, id) => abrirDocumento(t, id),
  duplicar: (t, id) => {
    const o = coleccion(t).find(d => d.id === id);
    abrirDocumento(t, null, { ...o, items: o.items.map(i => ({ ...i })) });
  },
  enviar: (t, id) => {
    const c = db.cotizaciones.find(d => d.id === id);
    c.estado = 'Enviada';
    logAccion(`Cotización ${c.numero} enviada a ${cliente(c.clienteId).nombre}.`, 'bi-send');
    toast(`${c.numero} marcada como enviada.`);
  },
  aprobar: (t, id) => {
    const c = db.cotizaciones.find(d => d.id === id);
    c.estado = 'Aprobada';
    logAccion(`Cotización ${c.numero} aprobada.`, 'bi-check2-circle');
    if (regla('r2').activa) {
      const f = facturarCotizacion(c, true);
      toast(`Aprobada. Se generó la factura ${f.numero} automáticamente.`, 'success');
    } else toast(`${c.numero} aprobada.`, 'success');
  },
  rechazar: (t, id) => {
    const c = db.cotizaciones.find(d => d.id === id);
    c.estado = 'Rechazada';
    logAccion(`Cotización ${c.numero} rechazada.`, 'bi-x-circle');
  },
  facturar: (t, id) => {
    const f = facturarCotizacion(db.cotizaciones.find(d => d.id === id));
    toast(`Factura ${f.numero} generada.`, 'success');
  },
  eliminar: (t, id) => {
    const c = db.cotizaciones.find(d => d.id === id);
    if (!confirm(`¿Eliminar la cotización ${c.numero}?`)) return false;
    db.cotizaciones = db.cotizaciones.filter(d => d.id !== id);
  },
  pagar: (t, id) => {
    const f = db.facturas.find(d => d.id === id);
    f.estado = 'Pagada'; f.fechaPago = hoy();
    logAccion(`Pago registrado para ${f.numero} (${money(totales(f.items).total)}).`, 'bi-cash-coin');
    toast(`Pago de ${f.numero} registrado.`, 'success');
  },
  anular: (t, id) => {
    const f = db.facturas.find(d => d.id === id);
    if (!confirm(`¿Anular la factura ${f.numero}? Esta acción no se puede deshacer.`)) return false;
    f.estado = 'Anulada';
    logAccion(`Factura ${f.numero} anulada.`, 'bi-slash-circle');
  },
  editCliente: (t, id) => abrirCliente(id),
  delCliente: (t, id) => {
    if ([...db.facturas, ...db.cotizaciones].some(d => d.clienteId === id)) { toast('No se puede eliminar: el cliente tiene documentos asociados.', 'danger'); return false; }
    if (!confirm('¿Eliminar este cliente?')) return false;
    db.clientes = db.clientes.filter(c => c.id !== id);
  },
  editProducto: (t, id) => abrirProducto(id),
  delProducto: (t, id) => {
    if (!confirm('¿Eliminar este ítem del catálogo?')) return false;
    db.productos = db.productos.filter(p => p.id !== id);
  },
  delGasto: (t, id) => {
    if (!confirm('¿Eliminar este gasto?')) return false;
    db.gastos = db.gastos.filter(g => g.id !== id);
  }
};
const SOLO_LECTURA = ['ver', 'editar', 'duplicar', 'editCliente', 'editProducto'];

/* ---------- 14. Inicialización y eventos ---------- */
document.addEventListener('DOMContentLoaded', () => {
  $('#todayLabel').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Clic en cualquier acción de tabla
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, tipo, id } = el.dataset;
    const r = ACCIONES[action]?.(tipo, id);
    if (!SOLO_LECTURA.includes(action) && r !== false) { runAutomations(); refresh(); }
  });

  // Botones "Crear"
  $$('[data-new]').forEach(b => b.addEventListener('click', () => {
    const n = b.dataset.new;
    if (n === 'cot' || n === 'fac') {
      if (!db.clientes.length) { toast('Primero registre un cliente.', 'warning'); return abrirCliente(); }
      abrirDocumento(n);
    }
    if (n === 'cliente') abrirCliente();
    if (n === 'producto') abrirProducto();
    if (n === 'gasto') abrirGasto();
  }));

  // Editor de ítems
  $('#btnAddItem').addEventListener('click', () => { $('#docItems').appendChild(itemRow()); recalcular(); });
  $('#docItems').addEventListener('input', e => {
    if (e.target.classList.contains('it-desc')) {
      const p = db.productos.find(x => x.nombre === e.target.value);
      if (p) $('.it-precio', e.target.closest('tr')).value = p.precio;   // autocompleta precio
    }
    recalcular();
  });
  $('#docItems').addEventListener('click', e => {
    if (!e.target.closest('.it-del')) return;
    if ($$('#docItems tr').length > 1) e.target.closest('tr').remove();
    recalcular();
  });
  $('#docFecha').addEventListener('change', () => {
    if (!$('#docId').value) $('#docVence').value = addDays($('#docFecha').value, $('#docTipo').value === 'cot' ? 15 : 30);
  });
  $('#formDoc').addEventListener('submit', guardarDocumento);

  // Maestros
  onSubmitValidado('#formCliente', '#modalCliente', () => {
    const id = $('#cliId').value;
    const datos = { nombre: $('#cliNombre').value.trim(), ruc: $('#cliRuc').value.trim(), email: $('#cliEmail').value.trim(), telefono: $('#cliTel').value.trim(), direccion: $('#cliDir').value.trim() };
    if (db.clientes.some(c => c.ruc === datos.ruc && c.id !== id)) { toast('Ya existe un cliente con ese RUC.', 'danger'); return false; }
    if (id) Object.assign(db.clientes.find(c => c.id === id), datos);
    else db.clientes.push({ id: uid(), ...datos });
    toast('Cliente guardado.', 'success');
  });
  onSubmitValidado('#formProducto', '#modalProducto', () => {
    const id = $('#proId').value;
    const datos = { nombre: $('#proNombre').value.trim(), tipo: $('#proTipo').value, unidad: $('#proUnidad').value.trim(), precio: parseFloat($('#proPrecio').value) };
    if (id) Object.assign(db.productos.find(p => p.id === id), datos);
    else db.productos.push({ id: uid(), ...datos });
    toast('Ítem guardado.', 'success');
  });
  onSubmitValidado('#formGasto', '#modalGasto', () => {
    db.gastos.push({ id: uid(), fecha: $('#gasFecha').value, categoria: $('#gasCat').value, descripcion: $('#gasDesc').value.trim(), monto: parseFloat($('#gasMonto').value) });
    toast('Gasto registrado.', 'success');
  });

  // Búsqueda y filtros
  $$('.table-search, .estado-filter').forEach(el => el.addEventListener('input', () => aplicarFiltros(el.dataset.table)));

  // Automatizaciones
  $('#listaReglas').addEventListener('change', e => {
    const r = regla(e.target.dataset.regla);
    if (!r) return;
    r.activa = e.target.checked;
    logAccion(`Regla “${r.nombre}” ${r.activa ? 'activada' : 'desactivada'}.`, 'bi-toggles');
    runAutomations(); renderAutomatizaciones();
  });
  $('#btnRunAuto').addEventListener('click', () => { runAutomations(true); refresh(); });

  // Impresión, exportación y reinicio
  $('#btnPrint').addEventListener('click', () => { $('#printArea').innerHTML = $('#previewBody').innerHTML; window.print(); });
  $('#btnCsv').addEventListener('click', exportarCSV);
  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Se borrarán los datos actuales y se cargarán los datos de demostración. ¿Continuar?')) return;
    db = seed(); runAutomations(); refresh(); toast('Datos de demostración restablecidos.');
  });

  window.addEventListener('hashchange', route);
  runAutomations();   // las reglas se ejecutan al iniciar
  route();
});
