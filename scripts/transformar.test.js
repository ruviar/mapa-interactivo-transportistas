import { test } from 'node:test';
import assert from 'node:assert/strict';

import { codigoProvincia, codigoCCAA, normalizar } from './lib/ine.js';
import {
  detectarEstado,
  limpiarNombre,
  parseEmpleados,
  fechaDesdeSerial,
  normalizarFecha,
  esVigente,
  construirFlota,
  fechaCorte,
  motivoNoMercancias,
} from './lib/transformar.js';

test('las grafías de SABI cruzan con el código INE', () => {
  // SABI escribe estas provincias sin tildes o en minúscula.
  assert.equal(codigoProvincia('a Coruña'), '15');
  assert.equal(codigoProvincia('Jaen'), '23');
  assert.equal(codigoProvincia('Alava'), '01');
  assert.equal(codigoProvincia('Avila'), '05');
  assert.equal(codigoProvincia('Guipuzcoa'), '20');
  assert.equal(codigoProvincia('Vizcaya'), '48');
  assert.equal(codigoProvincia('Baleares'), '07');
  assert.equal(codigoProvincia('Las Palmas de Gran Canaria'), '35');
  assert.equal(codigoProvincia('Zaragoza'), '50');
});

test('las grafías de los GeoJSON cruzan con el mismo código', () => {
  assert.equal(codigoProvincia('A Coruña'), '15');
  assert.equal(codigoProvincia('Araba/Álava'), '01');
  assert.equal(codigoProvincia('Gipuzkoa/Guipúzcoa'), '20');
  assert.equal(codigoProvincia('Bizkaia/Vizcaya'), '48');
  assert.equal(codigoProvincia('Illes Balears'), '07');
  assert.equal(codigoProvincia('València/Valencia'), '46');
  assert.equal(codigoProvincia('Castelló/Castellón'), '12');
});

test('un nombre desconocido no se adivina', () => {
  assert.equal(codigoProvincia('Provincia Inventada'), null);
  assert.equal(codigoProvincia(''), null);
  assert.equal(codigoProvincia(null), null);
});

test('cada provincia pertenece a su comunidad', () => {
  assert.equal(codigoCCAA('50'), '02'); // Zaragoza -> Aragón
  assert.equal(codigoCCAA('35'), '05'); // Las Palmas -> Canarias
  assert.equal(codigoCCAA('51'), '18'); // Ceuta
});

test('normalizar quita tildes y puntuación', () => {
  assert.equal(normalizar('Málaga'), 'malaga');
  assert.equal(normalizar('  Araba/Álava '), 'araba alava');
});

test('detecta el estado marcado en la razón social', () => {
  assert.equal(detectarEstado('TRANS SESE SL'), 'activa');
  assert.equal(detectarEstado('TRANSPORTES OCHOA SA (EXTINGUIDA)'), 'extinguida');
  assert.equal(detectarEstado('LOGISTICA X SL EN LIQUIDACION'), 'liquidacion');
  assert.equal(detectarEstado('TRANSPORTES Y SA EN CONCURSO DE ACREEDORES'), 'concurso');
});

test('limpia la marca de estado del nombre sin dejar residuos', () => {
  assert.equal(limpiarNombre('TRANSPORTES OCHOA SA (EXTINGUIDA)'), 'TRANSPORTES OCHOA SA');
  assert.equal(limpiarNombre('CENTRAL MENSAJEROS 2008 SLU (EXTINGUIDA)'), 'CENTRAL MENSAJEROS 2008 SLU');
  assert.equal(limpiarNombre('TRANS SESE SL'), 'TRANS SESE SL');
});

test('detecta viajeros y sanitario colados en el CNAE 4941', () => {
  // Casos reales del export.
  assert.equal(motivoNoMercancias('ATL AMBULANCIAS SL.'), 'ambulancia');
  assert.equal(motivoNoMercancias('FALCK SERVICIOS SANITARIOS S.L.'), 'sanitario');
  assert.equal(motivoNoMercancias('AUTOCARES SANGUIAO SA'), 'autocar');
  assert.equal(motivoNoMercancias('ESTACION DE AUTOBUSES DE XATIVA SL'), 'autobus');
});

test('la coincidencia ignora tildes y va por palabra completa', () => {
  assert.equal(motivoNoMercancias('AUTOBUSES OÑA SL.'), 'autobus');
  assert.equal(motivoNoMercancias('AUTOBÚS DEL SUR SL'), 'autobus');
  // Plural catalán.
  assert.equal(motivoNoMercancias('RIPOLLET AUTOCARS SL'), 'autocar');
  // Pero "autocargo" es carga, y el límite de palabra lo respeta.
  assert.equal(motivoNoMercancias('AUTOCARGO SL'), null);
  // "escolares" dentro de otra palabra no debe disparar.
  assert.equal(motivoNoMercancias('TRANSPORTES PREESCOLARIZADOS SL'), null);
});

test('los transportistas de mercancías que rozan el criterio se quedan', () => {
  // "taxi industrial" y "portes" son mercancías por carretera, no viajeros.
  assert.equal(motivoNoMercancias('TAXIS INDUSTRIALES DE LA MONTAÑA SL'), null);
  assert.equal(motivoNoMercancias('TAXI-FLET SERVICES SL'), null);
  // "Urbano" es apellido, y el reparto urbano sigue siendo mercancías: la forma
  // castellana no excluye, aunque sí lo haga la catalana "urbans".
  assert.equal(motivoNoMercancias('TRANSPORTES PULIDO Y URBANO S.L.'), null);
  assert.equal(motivoNoMercancias('EXPRESSO ENVIOS URBANOS SL'), null);
  assert.equal(motivoNoMercancias('TRANSPORTES URBANOS MURCIA ALICANTE SL.'), null);
  assert.equal(
    motivoNoMercancias('EMPRESA MUNICIPAL DE TRANSPORTS URBANS DE PALMA SA'),
    'transporte_urbano',
  );
  // Ninguna de estas lleva término de exclusión.
  assert.equal(motivoNoMercancias('TRANS SESE SL'), null);
  assert.equal(motivoNoMercancias(null), null);
});

test('los marcadores financieros de SABI no son números', () => {
  assert.equal(parseEmpleados('Financial Export limit reached'), null);
  assert.equal(parseEmpleados('n.d.'), null);
  assert.equal(parseEmpleados(null), null);
  assert.equal(parseEmpleados(''), null);
  assert.equal(parseEmpleados(703), 703);
  assert.equal(parseEmpleados('12'), 12);
  assert.equal(parseEmpleados('1.803'), 1803);
});

test('convierte el serial de Excel a AAAA-MM', () => {
  assert.equal(fechaDesdeSerial(45657), '2024-12'); // 31/12/2024
  assert.equal(fechaDesdeSerial(46022), '2025-12');
  assert.equal(fechaDesdeSerial('n.d.'), null);
  assert.equal(fechaDesdeSerial(null), null);
});

test('normalizarFecha acepta año suelto y AAAA-MM', () => {
  assert.equal(normalizarFecha('2024'), '2024-12');
  assert.equal(normalizarFecha('2026-03'), '2026-03');
  assert.equal(normalizarFecha('2026-3'), '2026-03');
  assert.equal(normalizarFecha('ayer'), null);
});

test('la vigencia se mide contra la fecha de corte', () => {
  const corte = '2023-08';
  assert.equal(esVigente('2024-12', corte), true);
  assert.equal(esVigente('2023-08', corte), true);
  assert.equal(esVigente('2023-07', corte), false);
  assert.equal(esVigente('2019-12', corte), false);
  assert.equal(esVigente(null, corte), false);
});

test('fechaCorte resta los años pedidos', () => {
  assert.equal(fechaCorte(new Date('2026-08-01T00:00:00Z'), 3), '2023-08');
});

const CORTE = '2023-08';

test('el REAT manda sobre los empleados', () => {
  const flota = construirFlota({
    verificada: { nif: 'B50600527', vehiculos: 42, fecha_consulta: '2026-03' },
    empleados: 703,
    fechaEmpleados: '2024-12',
    corte: CORTE,
  });
  assert.deepEqual(flota, {
    tipo: 'verificada',
    valor: 42,
    fuente: 'REAT',
    fecha_dato: '2026-03',
    vigente: true,
  });
});

test('sin REAT, los empleados son estimación', () => {
  const flota = construirFlota({
    verificada: undefined,
    empleados: 12,
    fechaEmpleados: '2024-12',
    corte: CORTE,
  });
  assert.equal(flota.tipo, 'estimada');
  assert.equal(flota.valor, 12);
  assert.equal(flota.fuente, 'empleados_SABI');
  assert.equal(flota.vigente, true);
});

test('una estimación de hace más de 3 años queda fuera del cómputo', () => {
  const flota = construirFlota({
    verificada: undefined,
    empleados: 30,
    fechaEmpleados: '2011-12',
    corte: CORTE,
  });
  assert.equal(flota.tipo, 'estimada');
  assert.equal(flota.valor, 30); // se conserva para la ficha
  assert.equal(flota.vigente, false); // pero no cuenta en el filtro
});

test('sin empleados y sin REAT queda sin_dato', () => {
  const flota = construirFlota({
    verificada: undefined,
    empleados: null,
    fechaEmpleados: null,
    corte: CORTE,
  });
  assert.deepEqual(flota, {
    tipo: 'sin_dato',
    valor: null,
    fuente: null,
    fecha_dato: null,
    vigente: false,
  });
});

test('empleados = 0 es un dato, no una ausencia', () => {
  const flota = construirFlota({ empleados: 0, fechaEmpleados: '2024-12', corte: CORTE });
  assert.equal(flota.tipo, 'estimada');
  assert.equal(flota.valor, 0);
});
