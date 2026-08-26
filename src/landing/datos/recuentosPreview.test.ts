import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Dataset } from '../../types/company.ts';
import { cumpleUmbral } from '../../utils/dataGrouping.ts';
import { RECUENTOS_PREVIEW_CCAA, UMBRAL_PREVIEW } from './recuentosPreview.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/**
 * Guarda contra la deriva: si `npm run data` regenera el dataset y estos
 * recuentos congelados dejan de coincidir, este test lo dice antes de que el
 * preview de la landing pinte una España que ya no existe. Para refrescarlos,
 * el comando está en el comentario de `recuentosPreview.ts`.
 */
test('los recuentos congelados del preview coinciden con el dataset real', () => {
  const dataset = JSON.parse(
    readFileSync(join(RAIZ, 'public', 'data', 'companies.json'), 'utf8'),
  ) as Dataset;

  const recalculados: Record<string, number> = {};
  for (const grupo of Object.values(dataset.empresas)) {
    for (const empresa of grupo) {
      if (cumpleUmbral(empresa, UMBRAL_PREVIEW)) {
        recalculados[empresa.ccaa] = (recalculados[empresa.ccaa] ?? 0) + 1;
      }
    }
  }

  assert.deepEqual(
    Object.fromEntries(Object.entries(RECUENTOS_PREVIEW_CCAA).sort()),
    Object.fromEntries(Object.entries(recalculados).sort()),
  );
});
