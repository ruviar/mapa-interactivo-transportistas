import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import type { Empresa } from '../../types/company';
import { ALTO_FILA_EMPRESA, CompanyRow } from './CompanyRow';

/** Filas de más que se montan por encima y por debajo de lo visible. */
const SOBRANTES = 12;

/**
 * Listado virtualizado con la cabecera de controles (buscador, chips, filtros)
 * dentro del mismo scroll: sube con las empresas en vez de quedarse fija.
 *
 * Es un único contenedor de scroll nativo: la cabecera va en flujo normal y,
 * debajo, una caja con el alto exacto de todas las filas (son de alto fijo) en
 * la que solo se montan las visibles. La virtualización es propia a propósito:
 * la de `react-window` no admite contenido en flujo dentro de su scroll, y
 * meter la cabecera como fila de alto variable le hacía estimar —y cambiar
 * sobre la marcha— el alto total, lo que cortaba el gesto de scroll.
 */
export function CompanyList({
  empresas,
  cabecera,
  mensajeVacio,
}: {
  empresas: Empresa[];
  /** Controles que suben con el listado al hacer scroll. */
  cabecera: ReactNode;
  /** Por qué no hay nada que enseñar: no es lo mismo un filtro estrecho que una búsqueda sin coincidencias. */
  mensajeVacio: string;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const cabeceraRef = useRef<HTMLDivElement>(null);
  const [rango, setRango] = useState({ desde: 0, hasta: 24 });
  const total = empresas.length;

  const recalcular = useCallback(() => {
    const contenedor = contenedorRef.current;
    const altoCabecera = cabeceraRef.current?.offsetHeight ?? 0;
    if (!contenedor) return;

    // Posición del borde superior visible dentro de la caja de filas.
    const arriba = contenedor.scrollTop - altoCabecera;
    const desde = Math.max(0, Math.floor(arriba / ALTO_FILA_EMPRESA) - SOBRANTES);
    const hasta = Math.min(
      total,
      Math.ceil((arriba + contenedor.clientHeight) / ALTO_FILA_EMPRESA) + SOBRANTES,
    );
    // Solo se repinta cuando cambia qué filas tocan, no en cada píxel.
    setRango((r) => (r.desde === desde && r.hasta === hasta ? r : { desde, hasta }));
  }, [total]);

  // El rango depende del alto del panel y del de la cabecera (el desplegable
  // de filtros se abre, los chips saltan de línea): se vigilan los dos.
  useLayoutEffect(() => {
    recalcular();
    const observador = new ResizeObserver(recalcular);
    if (contenedorRef.current) observador.observe(contenedorRef.current);
    if (cabeceraRef.current) observador.observe(cabeceraRef.current);
    return () => observador.disconnect();
  }, [recalcular]);

  return (
    <div
      ref={contenedorRef}
      onScroll={recalcular}
      // `overscroll-contain`: al llegar al final del listado dentro de la hoja,
      // el gesto se queda aquí y no arrastra la página por debajo.
      className="h-full overflow-y-auto overscroll-contain"
    >
      <div ref={cabeceraRef}>{cabecera}</div>

      {total === 0 ? (
        <p className="px-4 py-6 text-body-sm text-asfalto" role="status">
          {mensajeVacio}
        </p>
      ) : (
        <div className="relative" style={{ height: total * ALTO_FILA_EMPRESA }}>
          {empresas.slice(rango.desde, rango.hasta).map((empresa, i) => (
            <CompanyRow
              key={empresa.autorizacion}
              empresa={empresa}
              style={{
                position: 'absolute',
                top: (rango.desde + i) * ALTO_FILA_EMPRESA,
                left: 0,
                right: 0,
                height: ALTO_FILA_EMPRESA,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
