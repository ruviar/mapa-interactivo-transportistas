import type { FiltroFlota } from '../../utils/dataGrouping';

const OPCIONES: { valor: FiltroFlota; etiqueta: string; titulo: string }[] = [
  { valor: 'todas', etiqueta: 'Todas', titulo: 'Flotas verificadas y estimadas' },
  {
    valor: 'verificada',
    etiqueta: 'REAT',
    titulo: 'Solo flotas verificadas en el REAT: vehículos autorizados de verdad',
  },
  {
    valor: 'estimada',
    etiqueta: 'Plantilla',
    titulo: 'Solo estimaciones por nº de empleados publicado en SABI',
  },
];

/**
 * Filtro global por la fuente del dato de tamaño. Es global de verdad: tiñe la
 * coropleta y filtra el listado a la vez, como el umbral —si solo tocara el
 * listado, el mapa y el panel contarían cosas distintas con el mismo título.
 *
 * Mismo contenedor de control que el slider de umbral: son los dos mandos de
 * la cabecera y tienen que leerse como hermanos.
 */
export function FleetSourceFilter({
  fuente,
  onCambiar,
}: {
  fuente: FiltroFlota;
  onCambiar: (fuente: FiltroFlota) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3 border border-asfalto/50 px-3 py-1.5 lg:w-auto">
      <span className="shrink-0 text-caption uppercase tracking-[0.1em] text-asfalto">Fuente</span>

      <div role="group" aria-label="Fuente del dato de tamaño" className="flex gap-1">
        {OPCIONES.map((opcion) => {
          const activa = fuente === opcion.valor;
          return (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => onCambiar(opcion.valor)}
              aria-pressed={activa}
              title={opcion.titulo}
              className={`px-2 py-0.5 text-caption uppercase tracking-wide transition-colors duration-150 ${
                activa ? 'bg-navy-800 text-base' : 'text-asfalto hover:text-ink'
              }`}
            >
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
