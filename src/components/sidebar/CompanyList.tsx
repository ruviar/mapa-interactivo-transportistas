import { List, type RowComponentProps } from 'react-window';

import type { Empresa } from '../../types/company';
import { ALTO_FILA_EMPRESA, CompanyRow } from './CompanyRow';

interface DatosFila {
  empresas: Empresa[];
}

function Fila({ index, style, empresas }: RowComponentProps<DatosFila>) {
  return <CompanyRow empresa={empresas[index]!} style={style} />;
}

/**
 * Listado virtualizado: una provincia grande puede traer miles de filas y solo
 * se montan las visibles.
 */
export function CompanyList({
  empresas,
  mensajeVacio,
}: DatosFila & {
  /** Por qué no hay nada que enseñar: no es lo mismo un filtro estrecho que una búsqueda sin coincidencias. */
  mensajeVacio: string;
}) {
  if (empresas.length === 0) {
    return (
      <p className="px-4 py-6 text-body-sm text-asfalto" role="status">
        {mensajeVacio}
      </p>
    );
  }

  return (
    <List
      // `overscroll-contain`: al llegar al final del listado dentro de la hoja,
      // el gesto se queda aquí y no arrastra la página por debajo.
      className="h-full overscroll-contain"
      rowComponent={Fila}
      rowCount={empresas.length}
      rowHeight={ALTO_FILA_EMPRESA}
      rowProps={{ empresas }}
    />
  );
}
