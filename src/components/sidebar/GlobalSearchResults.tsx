import { List, type RowComponentProps } from 'react-window';

import type { Empresa } from '../../types/company';
import { ALTO_FILA_EMPRESA, DatosEmpresa } from './CompanyRow';

const nf = new Intl.NumberFormat('es-ES');

interface DatosFila {
  resultados: Empresa[];
  nombresProvincia: ReadonlyMap<string, string>;
  onElegir: (empresa: Empresa) => void;
}

/**
 * Un resultado de la búsqueda global. Mismos datos que una fila del listado,
 * pero es un botón: elegirlo navega a la provincia de la empresa. La provincia
 * va en la línea de detalle porque aquí los resultados vienen de toda España y
 * sin ella dos "TRANSPORTES PEREZ SL" son indistinguibles.
 */
function Fila({ index, style, resultados, nombresProvincia, onElegir }: RowComponentProps<DatosFila>) {
  const empresa = resultados[index]!;
  const provincia = nombresProvincia.get(empresa.provincia);

  return (
    <button
      type="button"
      style={style}
      onClick={() => onElegir(empresa)}
      title={`Abrir ${provincia ?? 'su provincia'} con esta empresa destacada`}
      className="flex w-full items-center gap-3 border-b border-ink/5 px-4 text-left transition-colors duration-150 hover:bg-atencion/10"
    >
      <DatosEmpresa empresa={empresa} provincia={provincia ?? '—'} />
    </button>
  );
}

/**
 * Resultados de la búsqueda global. Busca sobre todas las empresas del
 * registro sin aplicar el filtro de vehículos: quien teclea un nombre o una
 * autorización quiere encontrar esa empresa, no que un filtro pensado para el
 * mapa se la esconda. La línea de recuento lo deja dicho cuando hay filtro.
 */
export function GlobalSearchResults({
  resultados,
  nombresProvincia,
  consulta,
  hayFiltro,
  onElegir,
}: DatosFila & {
  consulta: string;
  /** ¿Hay un filtro de vehículos puesto? Solo entonces hace falta avisar de que aquí no se aplica. */
  hayFiltro: boolean;
}) {
  if (resultados.length === 0) {
    return (
      <p className="px-4 py-6 text-body-sm text-asfalto" role="status">
        Sin resultados para «{consulta.trim()}» en toda España.
      </p>
    );
  }

  return (
    <>
      <p className="shrink-0 border-b border-ink/5 px-4 py-1.5 text-caption text-asfalto">
        <span className="font-mono tabular-nums">{nf.format(resultados.length)}</span>{' '}
        {resultados.length === 1 ? 'empresa' : 'empresas'} en toda España
        {hayFiltro && ' — sin aplicar el filtro de vehículos'}
      </p>

      <List
        className="h-full overscroll-contain"
        rowComponent={Fila}
        rowCount={resultados.length}
        rowHeight={ALTO_FILA_EMPRESA}
        rowProps={{ resultados, nombresProvincia, onElegir }}
      />
    </>
  );
}
