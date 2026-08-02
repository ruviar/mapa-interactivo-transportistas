import assert from 'node:assert/strict';
import { test } from 'node:test';

import { columnasDe, digitoDe, enVentana, pasoCorto } from './odometro.ts';

test('una cifra de cuatro dígitos no lleva separador en es-ES', () => {
  // Intl agrupa a partir de cinco: 1004 va junto, 10.004 no.
  assert.deepEqual(
    columnasDe(1004),
    [
      { tipo: 'digito', peso: 1000 },
      { tipo: 'digito', peso: 100 },
      { tipo: 'digito', peso: 10 },
      { tipo: 'digito', peso: 1 },
    ],
  );
});

test('el separador de millar es una columna fija', () => {
  assert.deepEqual(
    columnasDe(42839),
    [
      { tipo: 'digito', peso: 10000 },
      { tipo: 'digito', peso: 1000 },
      { tipo: 'fijo', texto: '.' },
      { tipo: 'digito', peso: 100 },
      { tipo: 'digito', peso: 10 },
      { tipo: 'digito', peso: 1 },
    ],
  );
});

test('el cero ocupa una columna', () => {
  assert.deepEqual(columnasDe(0), [{ tipo: 'digito', peso: 1 }]);
});

test('la ventana del tambor va de 0 a 10, también con posiciones negativas', () => {
  assert.equal(enVentana(3.5), 3.5);
  assert.equal(Number(enVentana(23).toFixed(6)), 3);
  assert.equal(Number(enVentana(-0.3).toFixed(6)), 9.7);
});

test('cada columna lee su propio dígito del valor', () => {
  assert.equal(digitoDe(42839, 1), 9);
  assert.equal(digitoDe(42839, 100), 8);
  assert.equal(digitoDe(42839, 10000), 4);
  assert.equal(digitoDe(7, 10), 0);
});

test('la rueda cierra: de 9 a 0 es un paso adelante, no nueve atrás', () => {
  assert.equal(pasoCorto(9, 0), 1);
  assert.equal(pasoCorto(0, 9), -1);
  assert.equal(pasoCorto(3, 3), 0);
  assert.equal(pasoCorto(2, 7), 5);
  // Empate a cinco pasos: se resuelve siempre hacia delante, para que dos
  // columnas con el mismo salto no giren en sentidos contrarios.
  assert.equal(pasoCorto(7, 2), 5);
});
