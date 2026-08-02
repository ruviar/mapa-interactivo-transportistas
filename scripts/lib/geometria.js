/**
 * Utilidades de geometría para preparar los GeoJSON.
 * Trabajan sobre coordenadas [lon, lat] en grados.
 */

/** Simplificación Douglas-Peucker. `tolerancia` en grados. */
export function simplificar(puntos, tolerancia) {
  if (puntos.length <= 3) return puntos;

  const pila = [[0, puntos.length - 1]];
  const conservar = new Uint8Array(puntos.length);
  conservar[0] = 1;
  conservar[puntos.length - 1] = 1;

  while (pila.length) {
    const [ini, fin] = pila.pop();
    if (fin - ini < 2) continue;

    const [ax, ay] = puntos[ini];
    const [bx, by] = puntos[fin];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;

    let peor = 0;
    let idx = -1;
    for (let i = ini + 1; i < fin; i++) {
      const [px, py] = puntos[i];
      let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ax + t * dx;
      const cy = ay + t * dy;
      const d2 = (px - cx) ** 2 + (py - cy) ** 2;
      if (d2 > peor) {
        peor = d2;
        idx = i;
      }
    }

    if (idx !== -1 && Math.sqrt(peor) > tolerancia) {
      conservar[idx] = 1;
      pila.push([ini, idx], [idx, fin]);
    }
  }

  return puntos.filter((_, i) => conservar[i]);
}

/** Área del polígono por la fórmula del cordón (grados², solo para comparar tamaños). */
export function area(anillo) {
  let a = 0;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    a += anillo[j][0] * anillo[i][1] - anillo[i][0] * anillo[j][1];
  }
  return Math.abs(a / 2);
}

/** Cierra el anillo si la simplificación dejó el último punto separado del primero. */
function cerrar(anillo) {
  const [px, py] = anillo[0];
  const [ux, uy] = anillo[anillo.length - 1];
  return px === ux && py === uy ? anillo : [...anillo, [px, py]];
}

const redondear = (anillo, decimales) =>
  anillo.map(([x, y]) => [Number(x.toFixed(decimales)), Number(y.toFixed(decimales))]);

/**
 * Simplifica una geometría Polygon/MultiPolygon conservando agujeros
 * (p. ej. el enclave de Treviño dentro de Álava) e islas con entidad.
 *
 * `areaMinima` descarta islotes que a escala nacional no llegan a un píxel;
 * siempre se conserva al menos el polígono mayor.
 */
export function simplificarGeometria(geometria, { tolerancia, areaMinima, decimales = 5 }) {
  const esMulti = geometria.type === 'MultiPolygon';
  const poligonos = esMulti ? geometria.coordinates : [geometria.coordinates];

  const procesados = poligonos
    .map((poligono) => {
      const [exterior, ...agujeros] = poligono;
      const areaExterior = area(exterior);
      const anillos = [exterior, ...agujeros]
        .map((anillo, i) => {
          const simplificado = cerrar(simplificar(anillo, tolerancia));
          // Un anillo de menos de 4 puntos ya no encierra superficie.
          if (simplificado.length < 4) return null;
          // Los agujeros diminutos desaparecen; el exterior se decide fuera.
          if (i > 0 && area(simplificado) < areaMinima) return null;
          return redondear(simplificado, decimales);
        })
        .filter(Boolean);
      return anillos.length ? { anillos, areaExterior } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.areaExterior - a.areaExterior);

  if (!procesados.length) return null;

  const conservados = procesados.filter((p, i) => i === 0 || p.areaExterior >= areaMinima);
  const coordinates = conservados.map((p) => p.anillos);

  return conservados.length === 1 && !esMulti
    ? { type: 'Polygon', coordinates: coordinates[0] }
    : { type: 'MultiPolygon', coordinates };
}

/** Recorre todos los anillos de una geometría. */
export function cadaAnillo(geometria, fn) {
  const poligonos = geometria.type === 'MultiPolygon' ? geometria.coordinates : [geometria.coordinates];
  for (const poligono of poligonos) for (const anillo of poligono) fn(anillo);
}

/** [minLon, minLat, maxLon, maxLat] */
export function bbox(geometria) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  cadaAnillo(geometria, (anillo) => {
    for (const [x, y] of anillo) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  });
  return [x0, y0, x1, y1];
}

/** Desplaza una geometría en grados. Devuelve una copia. */
export function desplazar(geometria, dLon, dLat, decimales = 5) {
  const mover = (anillo) =>
    anillo.map(([x, y]) => [
      Number((x + dLon).toFixed(decimales)),
      Number((y + dLat).toFixed(decimales)),
    ]);
  const poligonos = geometria.type === 'MultiPolygon' ? geometria.coordinates : [geometria.coordinates];
  const movidos = poligonos.map((poligono) => poligono.map(mover));
  return geometria.type === 'MultiPolygon'
    ? { type: 'MultiPolygon', coordinates: movidos }
    : { type: 'Polygon', coordinates: movidos[0] };
}

/**
 * Punto interior para colocar la etiqueta: centroide del anillo exterior mayor.
 * No es "pole of inaccessibility", pero para las 19 CCAA y 52 provincias cae dentro.
 */
export function anclaEtiqueta(geometria) {
  const poligonos = geometria.type === 'MultiPolygon' ? geometria.coordinates : [geometria.coordinates];
  let mayor = null;
  let areaMayor = -1;
  for (const poligono of poligonos) {
    const a = area(poligono[0]);
    if (a > areaMayor) {
      areaMayor = a;
      mayor = poligono[0];
    }
  }
  let sx = 0;
  let sy = 0;
  let a2 = 0;
  for (let i = 0, j = mayor.length - 1; i < mayor.length; j = i++) {
    const cruz = mayor[j][0] * mayor[i][1] - mayor[i][0] * mayor[j][1];
    a2 += cruz;
    sx += (mayor[j][0] + mayor[i][0]) * cruz;
    sy += (mayor[j][1] + mayor[i][1]) * cruz;
  }
  if (a2 === 0) return [Number(mayor[0][0].toFixed(5)), Number(mayor[0][1].toFixed(5))];
  return [Number((sx / (3 * a2)).toFixed(5)), Number((sy / (3 * a2)).toFixed(5))];
}
