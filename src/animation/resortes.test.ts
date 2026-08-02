import assert from 'node:assert/strict';
import { test } from 'node:test';

import { amortiguacionRelativa, RESORTES } from './resortes.ts';

test('todos los resortes caen en la banda utilizable', () => {
  for (const [nombre, resorte] of Object.entries(RESORTES)) {
    const z = amortiguacionRelativa(resorte);
    assert.ok(z >= 0.4 && z <= 1.1, `${nombre}: ζ=${z.toFixed(2)} fuera de [0.4, 1.1]`);
  }
});

test('la pulsación se recupera antes que el trazado se asienta', () => {
  // Frecuencia natural: a mayor rigidez y menor masa, antes acaba.
  const rapidez = (r: { stiffness: number; mass: number }) => Math.sqrt(r.stiffness / r.mass);
  assert.ok(rapidez(RESORTES.pulsacion) > rapidez(RESORTES.trazado));
});
