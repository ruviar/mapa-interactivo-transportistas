import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Empresa } from '../types/company.ts';
import { comparadorDe, type Orden } from './ordenacion.ts';

function empresa(
  nombre: string,
  localidad: string | null,
  vehiculos: number,
  fecha = '2020-01-01',
): Empresa {
  return {
    nombre,
    localidad,
    cp: null,
    provincia: '50',
    ccaa: '02',
    autorizacion: nombre,
    fecha,
    vehiculos,
  };
}

const NOMBRE_ASC: Orden = [{ criterio: 'nombre', sentido: 'asc' }];
const NOMBRE_DESC: Orden = [{ criterio: 'nombre', sentido: 'desc' }];
const VEHICULOS_DESC: Orden = [{ criterio: 'vehiculos', sentido: 'desc' }];
const VEHICULOS_ASC: Orden = [{ criterio: 'vehiculos', sentido: 'asc' }];
const LOCALIDAD_ASC: Orden = [{ criterio: 'localidad', sentido: 'asc' }];
const LOCALIDAD_DESC: Orden = [{ criterio: 'localidad', sentido: 'desc' }];

const zaragoza = empresa('TRANS ZETA SL', 'ZARAGOZA', 12, '2026-05-28');
const almeria = empresa('ACARREOS ALFA SL', 'ALMERIA', 3, '2008-01-22');
const sinLocalidad = empresa('MUDANZAS MEDIA SL', null, 7, '2019-03-10');

const nombres = (lista: Empresa[], orden: Orden) =>
  [...lista].sort(comparadorDe(orden)).map((e) => e.nombre);

test('nombre: alfabético ascendente y su inverso', () => {
  const lista = [zaragoza, almeria, sinLocalidad];
  assert.deepEqual(nombres(lista, NOMBRE_ASC), ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL']);
  assert.deepEqual(nombres(lista, NOMBRE_DESC), ['TRANS ZETA SL', 'MUDANZAS MEDIA SL', 'ACARREOS ALFA SL']);
});

test('vehículos: descendente y ascendente, empate desempatado por nombre', () => {
  const empateA = empresa('AAA SL', null, 5);
  const empateB = empresa('BBB SL', null, 5);
  const lista = [empateB, zaragoza, empateA, almeria];

  assert.deepEqual(nombres(lista, VEHICULOS_DESC), ['TRANS ZETA SL', 'AAA SL', 'BBB SL', 'ACARREOS ALFA SL']);
  assert.deepEqual(nombres(lista, VEHICULOS_ASC), ['ACARREOS ALFA SL', 'AAA SL', 'BBB SL', 'TRANS ZETA SL']);
});

test('fecha: más recientes primero, y su inverso', () => {
  const lista = [sinLocalidad, almeria, zaragoza];
  assert.deepEqual(
    nombres(lista, [{ criterio: 'fecha', sentido: 'desc' }]),
    ['TRANS ZETA SL', 'MUDANZAS MEDIA SL', 'ACARREOS ALFA SL'],
  );
  assert.deepEqual(
    nombres(lista, [{ criterio: 'fecha', sentido: 'asc' }]),
    ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL'],
  );
});

test('localidad: sin localidad siempre al final, en los dos sentidos', () => {
  const lista = [sinLocalidad, zaragoza, almeria];
  assert.deepEqual(
    [...lista].sort(comparadorDe(LOCALIDAD_ASC)).map((e) => e.localidad),
    ['ALMERIA', 'ZARAGOZA', null],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe(LOCALIDAD_DESC)).map((e) => e.localidad),
    ['ZARAGOZA', 'ALMERIA', null],
  );
});

test('multiclave: localidad A→Z y, dentro de cada localidad, vehículos mayor→menor', () => {
  const grandeTeruel = empresa('GRANDE TERUEL SL', 'TERUEL', 90);
  const chicaTeruel = empresa('CHICA TERUEL SL', 'TERUEL', 4);
  const mediaAlcaniz = empresa('MEDIA ALCAÑIZ SL', 'ALCAÑIZ', 20);
  const orden: Orden = [
    { criterio: 'localidad', sentido: 'asc' },
    { criterio: 'vehiculos', sentido: 'desc' },
  ];

  assert.deepEqual(
    nombres([chicaTeruel, mediaAlcaniz, grandeTeruel], orden),
    ['MEDIA ALCAÑIZ SL', 'GRANDE TERUEL SL', 'CHICA TERUEL SL'],
  );
});

test('multiclave: a igual nº de vehículos, la fecha desempata', () => {
  const vieja = empresa('AAA VIEJA SL', null, 5, '2008-01-01');
  const nueva = empresa('ZZZ NUEVA SL', null, 5, '2026-01-01');
  const orden: Orden = [
    { criterio: 'vehiculos', sentido: 'desc' },
    { criterio: 'fecha', sentido: 'desc' },
  ];
  assert.deepEqual(nombres([vieja, nueva], orden), ['ZZZ NUEVA SL', 'AAA VIEJA SL']);
});

test('sin claves: cae al alfabético por nombre', () => {
  assert.deepEqual(
    nombres([zaragoza, almeria, sinLocalidad], []),
    ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL'],
  );
});

test('multiclave: a igualdad en todas las claves, desempate alfabético estable', () => {
  const b = empresa('BETA SL', 'TERUEL', 5);
  const a = empresa('ALFA SL', 'TERUEL', 5);
  const orden: Orden = [
    { criterio: 'localidad', sentido: 'asc' },
    { criterio: 'vehiculos', sentido: 'desc' },
  ];
  assert.deepEqual(nombres([b, a], orden), ['ALFA SL', 'BETA SL']);
});
