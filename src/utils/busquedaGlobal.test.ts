import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Dataset, Empresa, EstadoEmpresa } from '../types/company.ts';
import { buscarEnIndice, crearIndiceGlobal } from './busquedaGlobal.ts';

function empresa(
  nombre: string,
  nif: string,
  localidad: string | null,
  provincia: string,
  estado: EstadoEmpresa = 'activa',
): Empresa {
  return {
    nombre,
    nif,
    localidad,
    cp: null,
    provincia,
    ccaa: '02',
    cnae: '4941',
    estado,
    empleados: null,
    flota: { tipo: 'estimada', valor: 6, fuente: 'empleados_SABI', fecha_dato: '2024-12', vigente: true },
  };
}

const NOMBRES = new Map([
  ['22', 'Huesca'],
  ['50', 'Zaragoza'],
]);

const DATASET = {
  meta: {} as Dataset['meta'],
  empresas: {
    '22': [
      empresa('FRIGORÍFICOS DEL CINCA SL', 'B22000001', 'Monzón', '22'),
      empresa('EXTINGUIDA SA', 'A22000002', 'Jaca', '22', 'extinguida'),
    ],
    '50': [
      empresa('TRANS SESÉ SL', 'B50000001', 'Zaragoza', '50'),
      empresa('ACARREOS EBRO SL', 'B50000002', 'Utebo', '50'),
    ],
  },
} as Dataset;

test('el índice solo trae activas y viene ordenado por nombre', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.deepEqual(
    indice.empresas.map((e) => e.nombre),
    ['ACARREOS EBRO SL', 'FRIGORÍFICOS DEL CINCA SL', 'TRANS SESÉ SL'],
  );
  assert.equal(indice.pajares.length, 3);
});

test('busca sin tildes por nombre, NIF, localidad y nombre de provincia', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);

  const porNombre = buscarEnIndice(indice, 'sese');
  assert.deepEqual(porNombre.map((e) => e.nombre), ['TRANS SESÉ SL']);

  const porNif = buscarEnIndice(indice, 'b50000002');
  assert.deepEqual(porNif.map((e) => e.nombre), ['ACARREOS EBRO SL']);

  const porLocalidad = buscarEnIndice(indice, 'monzon');
  assert.deepEqual(porLocalidad.map((e) => e.nombre), ['FRIGORÍFICOS DEL CINCA SL']);

  // "huesca" no aparece ni en el nombre ni en la localidad: solo la provincia.
  const porProvincia = buscarEnIndice(indice, 'frigorificos huesca');
  assert.deepEqual(porProvincia.map((e) => e.nombre), ['FRIGORÍFICOS DEL CINCA SL']);
});

test('todos los términos tienen que aparecer, en cualquier orden', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.equal(buscarEnIndice(indice, 'ebro utebo').length, 1);
  assert.equal(buscarEnIndice(indice, 'ebro monzon').length, 0);
});

test('consulta vacía o en blanco no devuelve nada', () => {
  const indice = crearIndiceGlobal(DATASET, NOMBRES);
  assert.equal(buscarEnIndice(indice, '').length, 0);
  assert.equal(buscarEnIndice(indice, '   ').length, 0);
});
