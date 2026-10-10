import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Dataset, Fuente } from '../../types/company.ts';
import { RECUENTOS_PREVIEW_CCAA } from './recuentosPreview.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const leer = <T>(...ruta: string[]) => JSON.parse(readFileSync(join(RAIZ, ...ruta), 'utf8')) as T;

const dataset = leer<Dataset>('public', 'data', 'companies.json');
const todas = Object.values(dataset.empresas).flat();

/**
 * Guarda contra la deriva: si `npm run data` regenera el dataset y estos
 * recuentos congelados dejan de coincidir, este test lo dice antes de que el
 * preview de la landing pinte una España que ya no existe.
 */
test('los recuentos congelados del preview coinciden con el dataset real', () => {
  const recalculados: Record<string, number> = {};
  for (const empresa of todas) {
    recalculados[empresa.ccaa] = (recalculados[empresa.ccaa] ?? 0) + 1;
  }

  assert.deepEqual(
    Object.fromEntries(Object.entries(RECUENTOS_PREVIEW_CCAA).sort()),
    Object.fromEntries(Object.entries(recalculados).sort()),
  );
});

/**
 * `fuente.json` alimenta la cita legal y las cifras de la landing. Sale del
 * mismo script que el dataset, pero son dos ficheros versionados: que nadie
 * suba uno sin el otro.
 */
test('la cita de la fuente cuadra con el dataset que se sirve', () => {
  const fuente = leer<Fuente>('src', 'data', 'fuente.json');

  assert.equal(fuente.empresas, todas.length);
  assert.equal(fuente.vehiculos, todas.reduce((suma, e) => suma + e.vehiculos, 0));
  assert.equal(fuente.fecha_datos, dataset.meta.fecha_datos);
  assert.equal(fuente.fecha_datos, todas.reduce((max, e) => (e.fecha > max ? e.fecha : max), ''));
  assert.match(fuente.organismo, /Ministerio de Transportes/);
});

/** La reutilización no admite desnaturalizar: ninguna fila a medias en lo que se publica. */
test('todas las empresas publicadas traen los datos del registro completos', () => {
  const autorizaciones = new Set<string>();
  for (const e of todas) {
    assert.ok(e.nombre, `sin razón social: ${e.autorizacion}`);
    assert.match(e.fecha, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Number.isInteger(e.vehiculos) && e.vehiculos >= 1, `vehículos de ${e.autorizacion}`);
    assert.ok(e.cp === null || /^\d{5}$/.test(e.cp));
    assert.ok(!autorizaciones.has(e.autorizacion), `autorización repetida: ${e.autorizacion}`);
    autorizaciones.add(e.autorizacion);
  }
  assert.equal(Object.keys(dataset.empresas).length, 52);
});
