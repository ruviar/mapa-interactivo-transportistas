import type { CSSProperties } from 'react';

import type { Empresa } from '../../types/company';

const nf = new Intl.NumberFormat('es-ES');

/**
 * Una empresa del listado. El NIF y la cifra van en monoespaciada para poder
 * escanear la columna con la vista, como en un albarán.
 *
 * El tamaño se ancla a la derecha, alineado con su cabecera: es una columna de
 * verdad, no un dato más dentro de la línea de detalle. Así la cifra se lee en
 * vertical de un vistazo y el nombre puede truncarse sin arrastrarla.
 */
export function CompanyRow({ empresa, style }: { empresa: Empresa; style: CSSProperties }) {
  const { flota } = empresa;
  const verificada = flota.tipo === 'verificada';

  return (
    <div
      style={style}
      className="flex items-center gap-3 border-b border-asfalto/25 px-4 transition-colors duration-150 hover:bg-atencion/12"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className="truncate text-body-sm font-medium" title={empresa.nombre}>
          {empresa.nombre}
        </p>
        <p className="flex items-baseline gap-1.5 overflow-hidden text-caption text-asfalto">
          <span className="font-mono">{empresa.nif}</span>
          {empresa.localidad && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{empresa.localidad}</span>
            </>
          )}
        </p>
      </div>

      <p
        className="shrink-0 text-right font-mono text-caption tabular-nums text-asfalto"
        // Un dato del REAT y una estimación por plantilla no son lo mismo y
        // la interfaz no puede presentarlos como si lo fueran. Y un hueco no
        // es un cero: en el listado filtrado nunca llega un valor nulo, pero
        // la ficha fijada de la búsqueda global sí puede traerlo.
        title={
          flota.valor === null
            ? 'Sin dato de tamaño'
            : verificada
              ? 'Vehículos autorizados según el REAT'
              : 'Empleados en SABI: aproximación al tamaño de flota'
        }
      >
        {flota.valor === null ? (
          's. d.'
        ) : (
          <>
            {nf.format(flota.valor)} {verificada ? 'veh.' : 'empl.'}
            {verificada && <span className="ml-1 text-navy-800">✓</span>}
          </>
        )}
      </p>
    </div>
  );
}
