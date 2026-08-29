import { List, type RowComponentProps } from 'react-window';

import type { Empresa } from '../../types/company';

const nf = new Intl.NumberFormat('es-ES');
const ALTO_FILA = 56;

interface DatosFila {
  resultados: Empresa[];
  nombresProvincia: ReadonlyMap<string, string>;
  onElegir: (empresa: Empresa) => void;
}

/**
 * Un resultado de la búsqueda global. Misma anatomía que `CompanyRow` —nombre,
 * NIF·localidad, tamaño a la derecha— pero es un botón: elegirlo navega a la
 * provincia de la empresa. La provincia va en la línea de detalle porque aquí
 * los resultados vienen de toda España y sin ella dos "TRANSPORTES PEREZ SL"
 * son indistinguibles.
 */
function Fila({ index, style, resultados, nombresProvincia, onElegir }: RowComponentProps<DatosFila>) {
  const empresa = resultados[index]!;
  const { flota } = empresa;
  const verificada = flota.tipo === 'verificada';

  return (
    <button
      type="button"
      style={style}
      onClick={() => onElegir(empresa)}
      title={`Abrir ${nombresProvincia.get(empresa.provincia) ?? 'su provincia'} con esta empresa destacada`}
      className="flex w-full items-center gap-3 border-b border-ink/5 px-4 text-left transition-colors duration-150 hover:bg-atencion/10"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="truncate text-body-sm font-medium">{empresa.nombre}</span>
        <span className="flex items-baseline gap-1.5 overflow-hidden text-caption text-asfalto">
          <span className="font-mono">{empresa.nif}</span>
          {empresa.localidad && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{empresa.localidad}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="shrink-0 font-medium text-navy-800">
            {nombresProvincia.get(empresa.provincia) ?? '—'}
          </span>
        </span>
      </span>

      <span
        className="shrink-0 text-right font-mono text-caption tabular-nums text-asfalto"
        title={
          flota.valor === null
            ? 'Sin dato de tamaño'
            : verificada
              ? 'Vehículos autorizados según el REAT'
              : 'Empleados en SABI: aproximación al tamaño de flota'
        }
      >
        {flota.valor === null ? 's. d.' : `${nf.format(flota.valor)} ${verificada ? 'veh.' : 'empl.'}`}
        {verificada && <span className="ml-1 text-navy-800">✓</span>}
      </span>
    </button>
  );
}

/**
 * Resultados de la búsqueda global. Busca sobre todas las empresas activas del
 * país sin aplicar el umbral ni el filtro de fuente: quien teclea un nombre o
 * un NIF quiere encontrar esa empresa, no que un filtro pensado para el mapa
 * se la esconda. La línea de recuento lo deja dicho.
 */
export function GlobalSearchResults({
  resultados,
  nombresProvincia,
  consulta,
  onElegir,
}: DatosFila & { consulta: string }) {
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
        {resultados.length === 1 ? 'empresa activa' : 'empresas activas'} en toda España — sin
        aplicar el umbral
      </p>

      <List
        className="h-full overscroll-contain"
        rowComponent={Fila}
        rowCount={resultados.length}
        rowHeight={ALTO_FILA}
        rowProps={{ resultados, nombresProvincia, onElegir }}
      />
    </>
  );
}
