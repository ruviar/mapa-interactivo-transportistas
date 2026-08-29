import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Empresa } from '../types/company.ts';
import { comparadorDe, type Orden } from './ordenacion.ts';

function empresa(nombre: string, localidad: string | null, valor: number | null): Empresa {
  return {
    nombre,
    nif: 'B00000000',
    localidad,
    cp: null,
    provincia: '50',
    ccaa: '02',
    cnae: '4941',
    estado: 'activa',
    empleados: null,
    flota: { tipo: 'estimada', valor, fuente: 'empleados_SABI', fecha_dato: '2024-12', vigente: true },
  };
}

const NOMBRE_ASC: Orden = [{ criterio: 'nombre', sentido: 'asc' }];
const NOMBRE_DESC: Orden = [{ criterio: 'nombre', sentido: 'desc' }];
const TAMANO_DESC: Orden = [{ criterio: 'tamano', sentido: 'desc' }];
const TAMANO_ASC: Orden = [{ criterio: 'tamano', sentido: 'asc' }];
const LOCALIDAD_ASC: Orden = [{ criterio: 'localidad', sentido: 'asc' }];
const LOCALIDAD_DESC: Orden = [{ criterio: 'localidad', sentido: 'desc' }];

const zaragoza = empresa('TRANS ZETA SL', 'Zaragoza', 12);
const almeria = empresa('ACARREOS ALFA SL', 'Almería', 3);
const sinLocalidad = empresa('MUDANZAS MEDIA SL', null, 7);

test('nombre: alfabético ascendente y su inverso', () => {
  const lista = [zaragoza, almeria, sinLocalidad];
  assert.deepEqual(
    [...lista].sort(comparadorDe(NOMBRE_ASC)).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL'],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe(NOMBRE_DESC)).map((e) => e.nombre),
    ['TRANS ZETA SL', 'MUDANZAS MEDIA SL', 'ACARREOS ALFA SL'],
  );
});

test('tamano: descendente y ascendente, empate desempatado por nombre', () => {
  const empateA = empresa('AAA SL', null, 5);
  const empateB = empresa('BBB SL', null, 5);
  const lista = [empateB, zaragoza, empateA, almeria];

  assert.deepEqual(
    [...lista].sort(comparadorDe(TAMANO_DESC)).map((e) => e.nombre),
    ['TRANS ZETA SL', 'AAA SL', 'BBB SL', 'ACARREOS ALFA SL'],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe(TAMANO_ASC)).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'AAA SL', 'BBB SL', 'TRANS ZETA SL'],
  );
});

test('tamano: sin dato al final en ambos sentidos', () => {
  const sinDato = empresa('SIN DATO SL', 'Teruel', null);
  const lista = [sinDato, zaragoza, almeria];
  assert.deepEqual(
    [...lista].sort(comparadorDe(TAMANO_DESC)).map((e) => e.nombre),
    ['TRANS ZETA SL', 'ACARREOS ALFA SL', 'SIN DATO SL'],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe(TAMANO_ASC)).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'TRANS ZETA SL', 'SIN DATO SL'],
  );
});

test('localidad: sin localidad siempre al final, en los dos sentidos', () => {
  const lista = [sinLocalidad, zaragoza, almeria];
  assert.deepEqual(
    [...lista].sort(comparadorDe(LOCALIDAD_ASC)).map((e) => e.localidad),
    ['Almería', 'Zaragoza', null],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe(LOCALIDAD_DESC)).map((e) => e.localidad),
    ['Zaragoza', 'Almería', null],
  );
});

test('multiclave: localidad A→Z y, dentro de cada localidad, tamaño mayor→menor', () => {
  const grandeTeruel = empresa('GRANDE TERUEL SL', 'Teruel', 90);
  const chicaTeruel = empresa('CHICA TERUEL SL', 'Teruel', 4);
  const mediaAlcaniz = empresa('MEDIA ALCAÑIZ SL', 'Alcañiz', 20);
  const orden: Orden = [
    { criterio: 'localidad', sentido: 'asc' },
    { criterio: 'tamano', sentido: 'desc' },
  ];

  assert.deepEqual(
    [chicaTeruel, mediaAlcaniz, grandeTeruel].sort(comparadorDe(orden)).map((e) => e.nombre),
    ['MEDIA ALCAÑIZ SL', 'GRANDE TERUEL SL', 'CHICA TERUEL SL'],
  );
});

test('sin claves: cae al alfabético por nombre (el orden inicial de la herramienta)', () => {
  const lista = [zaragoza, almeria, sinLocalidad];
  assert.deepEqual(
    [...lista].sort(comparadorDe([])).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL'],
  );
});

test('multiclave: a igualdad en todas las claves, desempate alfabético estable', () => {
  const b = empresa('BETA SL', 'Teruel', 5);
  const a = empresa('ALFA SL', 'Teruel', 5);
  const orden: Orden = [
    { criterio: 'localidad', sentido: 'asc' },
    { criterio: 'tamano', sentido: 'desc' },
  ];
  assert.deepEqual([b, a].sort(comparadorDe(orden)).map((e) => e.nombre), ['ALFA SL', 'BETA SL']);
});
