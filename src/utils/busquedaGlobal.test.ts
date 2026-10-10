import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Dataset, Empresa } from '../types/company.ts';
import { filtrarPorTexto } from './busqueda.ts';
import { buscarEnIndice, crearIndiceGlobal } from './busquedaGlobal.ts';

function empresa(
  nombre: string,
  autorizacion: string,
  localidad: string | null,
  provincia: string,
  cp: string | null = null,
): Empresa {
  return {
    nombre,
    localidad,
    cp,
    provincia,
    ccaa: '02',
    autorizacion,
    fecha: '2024-12-01',
    vehiculos: 6,
  };
}

const NOMBRES = new Map([
  ['22', 'Huesca'],
  ['50', 'Zaragoza'],
]);

const DATASET = {
  meta: {} as Dataset['meta'],
  empresas: {
    '22': [empresa('FRIGORÍFICOS DEL CINCA SL', '11222001', 'MONZÓN', '22', '22400')],
    '50': [
      empresa('TRANS SESÉ SL', '11500001', 'ZARAGOZA', '50', '50014'),
      empresa('ACARREOS EBRO SL', '11500002', 'UTEBO', '50', '50180'),
    ],
  },
} as Dataset;

test('el índice trae todo el registro, ordenado por nombre', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.deepEqual(
    indice.empresas.map((e) => e.nombre),
    ['ACARREOS EBRO SL', 'FRIGORÍFICOS DEL CINCA SL', 'TRANS SESÉ SL'],
  );
  assert.equal(indice.pajares.length, 3);
});

test('busca sin tildes por nombre, autorización, localidad, CP y provincia', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  const nombres = (consulta: string) => buscarEnIndice(indice, consulta).map((e) => e.nombre);

  assert.deepEqual(nombres('sese'), ['TRANS SESÉ SL']);
  assert.deepEqual(nombres('11500002'), ['ACARREOS EBRO SL']);
  assert.deepEqual(nombres('monzon'), ['FRIGORÍFICOS DEL CINCA SL']);
  assert.deepEqual(nombres('50180'), ['ACARREOS EBRO SL']);
  // "huesca" no aparece ni en el nombre ni en la localidad: solo la provincia.
  assert.deepEqual(nombres('frigorificos huesca'), ['FRIGORÍFICOS DEL CINCA SL']);
});

test('todos los términos tienen que aparecer, en cualquier orden', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.equal(buscarEnIndice(indice, 'utebo ebro').length, 1);
  assert.equal(buscarEnIndice(indice, 'ebro monzon').length, 0);
});

test('consulta vacía o en blanco no devuelve nada', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.equal(buscarEnIndice(indice, '').length, 0);
  assert.equal(buscarEnIndice(indice, '   ').length, 0);
});

test('el buscador del listado encuentra por autorización y por código postal', () => {
  const zaragoza = DATASET.empresas['50']!;
  assert.deepEqual(filtrarPorTexto(zaragoza, '11500001').map((e) => e.nombre), ['TRANS SESÉ SL']);
  assert.deepEqual(filtrarPorTexto(zaragoza, '50180').map((e) => e.nombre), ['ACARREOS EBRO SL']);
  assert.equal(filtrarPorTexto(zaragoza, '').length, 2);
});
