import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { List, type RowComponentProps } from 'react-window';

import type { Empresa } from '../../types/company';
import { ALTO_FILA_EMPRESA, CompanyRow } from './CompanyRow';

/** Alto de la fila del mensaje de "no hay nada que enseñar". */
const ALTO_MENSAJE = 96;
/** Alto de la cabecera hasta que se mide de verdad (un fotograma). */
const ALTO_CABECERA_INICIAL = 120;

interface DatosFila {
  empresas: Empresa[];
  cabecera: ReactNode;
  mensajeVacio: string;
  onAltoCabecera: (alto: number) => void;
}

/**
 * La cabecera (buscador, chips, filtros) como primera fila del listado: así
 * sube con las empresas al hacer scroll en vez de quedarse fija comiéndose
 * media hoja. Su alto no es fijo —el desplegable se abre, los chips saltan de
 * línea—, así que se mide y se le comunica a la lista.
 */
function FilaCabecera({
  style,
  children,
  onAlto,
}: {
  style: CSSProperties;
  children: ReactNode;
  onAlto: (alto: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => onAlto(el.offsetHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [onAlto]);

  return (
    <div style={style}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

function Fila({
  index,
  style,
  empresas,
  cabecera,
  mensajeVacio,
  onAltoCabecera,
}: RowComponentProps<DatosFila>) {
  if (index === 0) {
    return (
      <FilaCabecera style={style} onAlto={onAltoCabecera}>
        {cabecera}
      </FilaCabecera>
    );
  }

  if (empresas.length === 0) {
    return (
      <p style={style} className="px-4 py-6 text-body-sm text-asfalto" role="status">
        {mensajeVacio}
      </p>
    );
  }

  return <CompanyRow empresa={empresas[index - 1]!} style={style} />;
}

/**
 * Listado virtualizado: una provincia grande puede traer miles de filas y solo
 * se montan las visibles. La fila 0 es la cabecera de controles.
 *
 * También sin empresas se usa la lista (cabecera + una fila de mensaje): si la
 * cabecera cambiara de rama al quedarse la búsqueda sin resultados, el
 * buscador se remontaría y perdería el foco a mitad de palabra.
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
  const [altoCabecera, setAltoCabecera] = useState(ALTO_CABECERA_INICIAL);
  const vacio = empresas.length === 0;

  return (
    <List
      // `overscroll-contain`: al llegar al final del listado dentro de la hoja,
      // el gesto se queda aquí y no arrastra la página por debajo.
      className="h-full overscroll-contain"
      rowComponent={Fila}
      rowCount={1 + (vacio ? 1 : empresas.length)}
      rowHeight={(index) =>
        index === 0 ? altoCabecera : vacio ? ALTO_MENSAJE : ALTO_FILA_EMPRESA
      }
      rowProps={{ empresas, cabecera, mensajeVacio, onAltoCabecera: setAltoCabecera }}
    />
  );
}
