const nf = new Intl.NumberFormat('es-ES');

export interface FilaRegion {
  cod: string;
  nombre: string;
  cumplen: number;
}

/**
 * Las mismas regiones que el mapa, en lista ordenada por nº de empresas.
 * Existe por dos motivos: el panel no se queda vacío mientras no hay provincia
 * elegida, y toda la navegación es alcanzable con el teclado sin depender de
 * poder pulsar un polígono.
 */
export function RegionList({
  regiones,
  onSeleccionar,
}: {
  regiones: FilaRegion[];
  onSeleccionar: (cod: string) => void;
}) {
  return (
    <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {regiones.map((region) => (
        <li key={region.cod}>
          <button
            type="button"
            onClick={() => onSeleccionar(region.cod)}
            className="flex w-full items-baseline justify-between gap-3 border-b border-asfalto/25 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-atencion/12"
          >
            <span className="truncate text-body-sm">{region.nombre}</span>
            <span className="shrink-0 font-mono text-body-sm tabular-nums text-asfalto">
              {nf.format(region.cumplen)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
