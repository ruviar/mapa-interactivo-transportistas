import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Empresa } from '../types/company.ts';
import { comparadorDe } from './ordenacion.ts';

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

const zaragoza = empresa('TRANS ZETA SL', 'Zaragoza', 12);
const almeria = empresa('ACARREOS ALFA SL', 'Almería', 3);
const sinLocalidad = empresa('MUDANZAS MEDIA SL', null, 7);

test('nombre: alfabético ascendente y su inverso', () => {
  const lista = [zaragoza, almeria, sinLocalidad];
  assert.deepEqual(
    [...lista].sort(comparadorDe('nombre')).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'MUDANZAS MEDIA SL', 'TRANS ZETA SL'],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe('nombre-desc')).map((e) => e.nombre),
    ['TRANS ZETA SL', 'MUDANZAS MEDIA SL', 'ACARREOS ALFA SL'],
  );
});

test('tamano: descendente por defecto, ascendente al invertir, empate alfabético', () => {
  const empateA = empresa('AAA SL', null, 5);
  const empateB = empresa('BBB SL', null, 5);
  const lista = [empateB, zaragoza, empateA, almeria];

  assert.deepEqual(
    [...lista].sort(comparadorDe('tamano')).map((e) => e.nombre),
    ['TRANS ZETA SL', 'AAA SL', 'BBB SL', 'ACARREOS ALFA SL'],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe('tamano-asc')).map((e) => e.nombre),
    ['ACARREOS ALFA SL', 'AAA SL', 'BBB SL', 'TRANS ZETA SL'],
  );
});

test('localidad: sin localidad siempre al final, en los dos sentidos', () => {
  const lista = [sinLocalidad, zaragoza, almeria];
  assert.deepEqual(
    [...lista].sort(comparadorDe('localidad')).map((e) => e.localidad),
    ['Almería', 'Zaragoza', null],
  );
  assert.deepEqual(
    [...lista].sort(comparadorDe('localidad-desc')).map((e) => e.localidad),
    ['Zaragoza', 'Almería', null],
  );
});

test('localidad: a igual localidad desempata el nombre', () => {
  const b = empresa('BETA SL', 'Teruel', 1);
  const a = empresa('ALFA SL', 'Teruel', 9);
  assert.deepEqual(
    [b, a].sort(comparadorDe('localidad')).map((e) => e.nombre),
    ['ALFA SL', 'BETA SL'],
  );
});
