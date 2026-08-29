import { Pulsable } from '../../animation/Pulsable';
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
 * Los segmentos son `Pulsable`: se hunden con resorte al pulsarlos, y el
 * activo se enciende en ámbar — el acento que el sistema de diseño reserva
 * para el filtro activo.
 */
export function FleetSourceFilter({
  fuente,
  onCambiar,
}: {
  fuente: FiltroFlota;
  onCambiar: (fuente: FiltroFlota) => void;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-full border border-ink/10 bg-superficie px-3 py-1.5 lg:w-auto">
      <span className="shrink-0 text-caption uppercase tracking-[0.1em] text-asfalto">Fuente</span>

      <div role="group" aria-label="Fuente del dato de tamaño" className="flex gap-1">
        {OPCIONES.map((opcion) => {
          const activa = fuente === opcion.valor;
          return (
            <Pulsable
              key={opcion.valor}
              type="button"
              onClick={() => onCambiar(opcion.valor)}
              aria-pressed={activa}
              title={opcion.titulo}
              className={`rounded-full px-2.5 py-0.5 text-caption uppercase tracking-wide transition-colors duration-150 ${
                activa ? 'bg-atencion font-medium text-superficie' : 'text-asfalto hover:text-ink'
              }`}
            >
              {opcion.etiqueta}
            </Pulsable>
          );
        })}
      </div>
    </div>
  );
}
