import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Dataset, Empresa, Regiones, TipoFlota } from '../types/company.ts';
import { contar, cumpleFlota } from './dataGrouping.ts';

function empresa(tipo: TipoFlota, valor: number | null): Empresa {
  return {
    nombre: 'X SL',
    nif: 'B00000000',
    localidad: null,
    cp: null,
    provincia: '50',
    ccaa: '02',
    cnae: '4941',
    estado: 'activa',
    empleados: null,
    flota: {
      tipo,
      valor,
      fuente: tipo === 'verificada' ? 'REAT' : tipo === 'estimada' ? 'empleados_SABI' : null,
      fecha_dato: '2024-12',
      vigente: valor !== null,
    },
  };
}

const REGIONES: Regiones = {
  ccaa: [{ cod: '02', nombre: 'Aragón', provincias: ['50'] }],
  provincias: [{ cod: '50', nombre: 'Zaragoza', ccaa: '02', total: 3 }],
};

const DATASET = {
  meta: {} as Dataset['meta'],
  empresas: {
    '50': [empresa('verificada', 10), empresa('estimada', 10), empresa('sin_dato', null)],
  },
} as Dataset;

test('cumpleFlota: "todas" deja pasar cualquier tipo, los demás filtran por el suyo', () => {
  assert.equal(cumpleFlota(empresa('verificada', 5), 'todas'), true);
  assert.equal(cumpleFlota(empresa('sin_dato', null), 'todas'), true);
  assert.equal(cumpleFlota(empresa('verificada', 5), 'verificada'), true);
  assert.equal(cumpleFlota(empresa('estimada', 5), 'verificada'), false);
  assert.equal(cumpleFlota(empresa('estimada', 5), 'estimada'), true);
  assert.equal(cumpleFlota(empresa('verificada', 5), 'estimada'), false);
});

test('contar: el filtro de fuente toca `cumplen` pero no la cobertura', () => {
  const todas = contar(DATASET, REGIONES, 4);
  assert.equal(todas.nacional.cumplen, 2);
  assert.equal(todas.nacional.conDato, 2);
  assert.equal(todas.nacional.activas, 3);

  const soloReat = contar(DATASET, REGIONES, 4, 'verificada');
  assert.equal(soloReat.nacional.cumplen, 1);
  // La cobertura mide cuánto dato hay, no cuánto pasa el filtro.
  assert.equal(soloReat.nacional.conDato, 2);
  assert.equal(soloReat.nacional.activas, 3);
  assert.equal(soloReat.provincias['50']!.cumplen, 1);
  assert.equal(soloReat.ccaa['02']!.cumplen, 1);
});
