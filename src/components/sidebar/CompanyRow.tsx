import type { CSSProperties } from 'react';

import type { Empresa } from '../../types/company';

const nf = new Intl.NumberFormat('es-ES');

/** Alto de una fila de empresa. Lo comparten el listado y los resultados globales. */
export const ALTO_FILA_EMPRESA = 72;

/** "2026-05-28" -> "28/05/2026". Sin `Date`: no hay zona horaria que la mueva. */
export function fechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Los datos de una empresa, tal como los publica el registro: razón social,
 * municipio y código postal, y debajo la autorización con su fecha. La cifra
 * de vehículos se ancla a la derecha como columna propia, para leerla en
 * vertical de un vistazo sin que el nombre la arrastre al truncarse.
 *
 * Es contenido de frase (solo `<span>`) a propósito: va igual dentro de la
 * fila del listado que dentro del botón de un resultado de búsqueda.
 */
export function DatosEmpresa({
  empresa,
  provincia,
}: {
  empresa: Empresa;
  /** Nombre de la provincia; solo en resultados de toda España. */
  provincia?: string;
}) {
  return (
    <>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="truncate text-body-sm font-medium" title={empresa.nombre}>
          {empresa.nombre}
        </span>

        <span className="flex items-baseline gap-1.5 overflow-hidden text-caption text-asfalto">
          {empresa.localidad && <span className="truncate">{empresa.localidad}</span>}
          {empresa.cp && (
            <>
              <span aria-hidden="true">·</span>
              <span className="shrink-0 font-mono tabular-nums">{empresa.cp}</span>
            </>
          )}
          {provincia && (
            <>
              <span aria-hidden="true">·</span>
              <span className="shrink-0 font-medium text-atencion">{provincia}</span>
            </>
          )}
        </span>

        <span className="flex items-baseline gap-1.5 overflow-hidden text-caption text-asfalto/80">
          <span className="shrink-0" title="Número de autorización MDPE">
            Aut. <span className="font-mono tabular-nums">{empresa.autorizacion}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate" title="Fecha de alta o de última actualización de la autorización">
            act. <span className="font-mono tabular-nums">{fechaCorta(empresa.fecha)}</span>
          </span>
        </span>
      </span>

      <span
        className="shrink-0 rounded-full bg-atencion/10 px-2.5 py-1 text-right font-mono text-caption font-medium tabular-nums text-atencion"
        title="Vehículos adscritos a la autorización"
      >
        {nf.format(empresa.vehiculos)} veh.
      </span>
    </>
  );
}

/** Una empresa del listado. */
export function CompanyRow({ empresa, style }: { empresa: Empresa; style: CSSProperties }) {
  return (
    <div
      style={style}
      className="flex items-center gap-3 border-b border-ink/5 px-4 transition-colors duration-150 hover:bg-atencion/10"
    >
      <DatosEmpresa empresa={empresa} />
    </div>
  );
}
