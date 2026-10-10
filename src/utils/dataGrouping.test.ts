import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Dataset, Empresa, Regiones } from '../types/company.ts';
import {
  contar,
  cumpleFiltro,
  cumplenPorRegion,
  etiquetaFiltro,
  FILTRO_INICIAL,
  filtroActivo,
} from './dataGrouping.ts';

let serie = 0;
function empresa(vehiculos: number, provincia = '50', ccaa = '02'): Empresa {
  return {
    nombre: 'X SL',
    localidad: null,
    cp: null,
    provincia,
    ccaa,
    autorizacion: String(10_000_000 + serie++),
    fecha: '2024-12-01',
    vehiculos,
  };
}

const REGIONES: Regiones = {
  ccaa: [
    { cod: '02', nombre: 'Aragón', provincias: ['22', '50'] },
    { cod: '17', nombre: 'La Rioja', provincias: ['26'] },
  ],
  provincias: [
    { cod: '22', nombre: 'Huesca', ccaa: '02', total: 1 },
    { cod: '26', nombre: 'La Rioja', ccaa: '17', total: 0 },
    { cod: '50', nombre: 'Zaragoza', ccaa: '02', total: 3 },
  ],
};

const DATASET = {
  meta: {} as Dataset['meta'],
  empresas: {
    '22': [empresa(40, '22')],
    '50': [empresa(1), empresa(5), empresa(20)],
  },
} as Dataset;

test('el filtro inicial deja pasar a todo el registro', () => {
  assert.equal(cumpleFiltro(empresa(1), FILTRO_INICIAL), true);
  assert.equal(cumpleFiltro(empresa(2803), FILTRO_INICIAL), true);
  assert.equal(filtroActivo(FILTRO_INICIAL), false);
});

test('el rango incluye sus dos extremos', () => {
  const filtro = { min: 5, max: 20 };
  assert.equal(cumpleFiltro(empresa(4), filtro), false);
  assert.equal(cumpleFiltro(empresa(5), filtro), true);
  assert.equal(cumpleFiltro(empresa(20), filtro), true);
  assert.equal(cumpleFiltro(empresa(21), filtro), false);
});

test('max null es "sin techo"', () => {
  assert.equal(cumpleFiltro(empresa(100_000), { min: 5, max: null }), true);
  assert.equal(cumpleFiltro(empresa(4), { min: 5, max: null }), false);
});

test('la etiqueta dice el rango en corto, y calla si no hay filtro', () => {
  assert.equal(etiquetaFiltro(FILTRO_INICIAL), '');
  assert.equal(etiquetaFiltro({ min: 5, max: null }), '≥ 5 veh.');
  assert.equal(etiquetaFiltro({ min: 1, max: 20 }), '≤ 20 veh.');
  assert.equal(etiquetaFiltro({ min: 5, max: 20 }), '5–20 veh.');
  assert.equal(etiquetaFiltro({ min: 5, max: 5 }), '5 veh.');
  assert.equal(filtroActivo({ min: 1, max: 20 }), true);
});

test('contar: sin filtro cuenta todas las empresas y suma sus vehículos', () => {
  const r = contar(DATASET, REGIONES, FILTRO_INICIAL);
  assert.deepEqual(r.nacional, { cumplen: 4, vehiculos: 66, total: 4 });
  assert.deepEqual(r.provincias['50'], { cumplen: 3, vehiculos: 26, total: 3 });
  assert.deepEqual(r.ccaa['02'], { cumplen: 4, vehiculos: 66, total: 4 });
});

test('contar: el filtro mueve `cumplen` y `vehiculos`, nunca `total`', () => {
  const r = contar(DATASET, REGIONES, { min: 5, max: 20 });
  assert.deepEqual(r.provincias['50'], { cumplen: 2, vehiculos: 25, total: 3 });
  assert.deepEqual(r.provincias['22'], { cumplen: 0, vehiculos: 0, total: 1 });
  assert.deepEqual(r.nacional, { cumplen: 2, vehiculos: 25, total: 4 });
});

test('contar: una región sin empresas arranca en cero, no en undefined', () => {
  const r = contar(DATASET, REGIONES, FILTRO_INICIAL);
  assert.deepEqual(r.provincias['26'], { cumplen: 0, vehiculos: 0, total: 0 });
  assert.deepEqual(r.ccaa['17'], { cumplen: 0, vehiculos: 0, total: 0 });
  assert.deepEqual(cumplenPorRegion(r.ccaa), { '02': 4, '17': 0 });
});
