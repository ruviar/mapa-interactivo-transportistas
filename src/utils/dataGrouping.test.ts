import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Dataset, Empresa, EstadoEmpresa, Regiones, TipoFlota } from '../types/company.ts';
import { contar, cumpleFiltrosListado, cumpleFlota, type FiltrosListado } from './dataGrouping.ts';

function empresa(
  tipo: TipoFlota,
  valor: number | null,
  estado: EstadoEmpresa = 'activa',
  vigente = valor !== null,
): Empresa {
  return {
    nombre: 'X SL',
    nif: 'B00000000',
    localidad: null,
    cp: null,
    provincia: '50',
    ccaa: '02',
    cnae: '4941',
    estado,
    empleados: null,
    flota: {
      tipo,
      valor,
      fuente: tipo === 'verificada' ? 'REAT' : tipo === 'estimada' ? 'empleados_SABI' : null,
      fecha_dato: '2024-12',
      vigente,
    },
  };
}

const FILTROS_BASE: FiltrosListado = {
  umbralMin: 4,
  umbralMax: null,
  filtroFlota: 'todas',
  incluirSinDato: false,
};

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

test('cumpleFiltrosListado: sin dato vigente entra solo con incluirSinDato', () => {
  const sinDato = empresa('sin_dato', null);
  const estimadaCaducada = empresa('estimada', 50, 'activa', false);

  assert.equal(cumpleFiltrosListado(sinDato, FILTROS_BASE), false);
  assert.equal(cumpleFiltrosListado(sinDato, { ...FILTROS_BASE, incluirSinDato: true }), true);
  assert.equal(cumpleFiltrosListado(estimadaCaducada, { ...FILTROS_BASE, incluirSinDato: true }), true);
  // Con dato vigente NO se cuela por la puerta de "sin dato" aunque no cumpla el umbral.
  const porDebajo = empresa('estimada', 1);
  assert.equal(cumpleFiltrosListado(porDebajo, { ...FILTROS_BASE, incluirSinDato: true }), false);
});

test('cumpleFiltrosListado: extinguidas fuera siempre, incluso con incluirSinDato', () => {
  const extinguida = empresa('sin_dato', null, 'extinguida');
  assert.equal(cumpleFiltrosListado(extinguida, { ...FILTROS_BASE, incluirSinDato: true }), false);
});

test('cumpleFiltrosListado: umbralMax acota por arriba, combinado con el mínimo', () => {
  const filtros: FiltrosListado = { ...FILTROS_BASE, umbralMin: 4, umbralMax: 20 };
  assert.equal(cumpleFiltrosListado(empresa('estimada', 3), filtros), false); // por debajo del mínimo
  assert.equal(cumpleFiltrosListado(empresa('estimada', 10), filtros), true); // dentro del rango
  assert.equal(cumpleFiltrosListado(empresa('estimada', 20), filtros), true); // el máximo es inclusive
  assert.equal(cumpleFiltrosListado(empresa('estimada', 21), filtros), false); // por encima del máximo
});

test('cumpleFiltrosListado: umbralMax null es "sin techo"', () => {
  assert.equal(cumpleFiltrosListado(empresa('estimada', 100000), FILTROS_BASE), true);
});

test('cumpleFiltrosListado: combina con el filtro de fuente', () => {
  const soloReat: FiltrosListado = { ...FILTROS_BASE, filtroFlota: 'verificada' };
  assert.equal(cumpleFiltrosListado(empresa('estimada', 10), soloReat), false);
  assert.equal(cumpleFiltrosListado(empresa('verificada', 10), soloReat), true);
});
