import type { Orden } from '../../hooks/useFilteredCompanies';

interface Props {
  orden: Orden;
  onCambiarOrden: (orden: Orden) => void;
}

/**
 * Cabecera del listado: nombra las dos columnas y sirve para ordenar por ellas.
 *
 * Son botones con `aria-pressed` y no cabeceras de tabla: el listado es una
 * lista virtualizada, no un `<table>`, y fingir semántica de tabla para dos
 * columnas confundiría a un lector de pantalla más de lo que ayuda.
 *
 * Cada columna tiene un único sentido de orden —alfabético ascendente, tamaño
 * descendente—; volver a pulsar la activa no lo invierte, porque ninguno de los
 * dos órdenes inversos responde a una pregunta real sobre estos datos.
 */
export function CompanyListHeader({ orden, onCambiarOrden }: Props) {
  return (
    <div
      role="group"
      aria-label="Ordenar el listado"
      className="flex shrink-0 items-center justify-between gap-3 border-b border-asfalto/40 px-4 py-1.5"
    >
      <Columna
        activa={orden === 'nombre'}
        onClick={() => onCambiarOrden('nombre')}
        titulo="Ordenar por nombre de empresa (A-Z)"
        flecha="↑"
      >
        Empresa
      </Columna>

      <Columna
        activa={orden === 'tamano'}
        onClick={() => onCambiarOrden('tamano')}
        titulo="Ordenar por tamaño, de mayor a menor. Empleados en SABI, o vehículos si la flota está verificada en el REAT."
        flecha="↓"
      >
        Tamaño
      </Columna>
    </div>
  );
}

function Columna({
  activa,
  onClick,
  titulo,
  flecha,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  /** Sentido del orden de esta columna: A-Z hacia arriba, tamaño hacia abajo. */
  flecha: string;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      title={titulo}
      className={`flex items-center gap-1 text-caption transition-colors duration-150 ${
        activa ? 'font-medium text-ink' : 'text-asfalto hover:text-ink'
      }`}
    >
      {children}
      {/* Reservada siempre: si apareciera al activarse, movería la etiqueta. */}
      <span aria-hidden="true" className={activa ? 'text-atencion' : 'invisible'}>
        {flecha}
      </span>
    </button>
  );
}
